# RFC: Automatic Decoupling Detection and Enforcement

- **Status:** Draft
- **Date:** 2026-07-31
- **Scope:** `circuit-json`, `@tscircuit/core`, `@tscircuit/checks`,
  `@tscircuit/cli`, and `tscircuit`

## Summary

tscircuit should detect and validate decoupling capacitors with no new board
inputs. The default experience is: infer the likely relationship, explain the
reasoning, emit a warning, and let the user ignore it if the inference is wrong.

Existing component metadata can make the result more precise, but no new prop
is required. The toolchain should:

1. identify likely power pins and eligible capacitors;
2. associate them using electrical topology and routed geometry;
3. validate count, capacitance, sharing, and routed supply/return paths;
4. emit typed diagnostics with confidence and supporting evidence; and
5. keep inferred findings warning-only and suppressible.

Inference must be conservative. Ambiguous or incomplete cases are warnings or
`not_checked`, not build failures.

## Problem

`maxDecouplingTraceLength` currently stores a maximum on a capacitor and
propagates it to traces connected to that capacitor. This has three limitations:

- it does not identify which IC pin the capacitor decouples;
- every trace touching the capacitor may inherit the same generic limit; and
- a generic trace-length check cannot detect an incorrectly arranged capacitor
  bank or evaluate the return path.

The existing `decouplingFor` and `decouplingTo` props can express an explicit
relationship, but requiring them on every board duplicates information the
tool can usually infer.

All runtime packages must use compatible schemas and checks so the same circuit
does not produce different inference results across CLI runtime paths.

## Goals

- No new board props are required for advisory detection.
- Every inferred warning states why it was emitted and how confident it is.
- An incorrect inferred warning can be persistently ignored.
- Existing pin and capacitor metadata is reused without adding JSX props.
- Results are deterministic and explain why a capacitor was selected or
  rejected.
- Routed validation covers both the supply path and the return connection.
- Heuristics do not cause hard failures.
- Existing projects and capacitor props continue to work during migration.

## Non-goals

- Proving frequency-domain PDN impedance or loop inductance.
- Deriving universal limits such as “all decoupling traces must be 2 mm.”
- Treating reference designators, net names, or PCB proximity as electrical
  proof.
- Requiring one capacitor per pin when the topology is ambiguous.

## Proposed model

### No new author-facing inputs

This RFC introduces no new JSX props. Inference reuses existing information:

- port capabilities such as `requiresPower` and `requiresGround`;
- `shouldHaveDecouplingCapacitor` and
  `recommendedDecouplingCapacitorCapacitance`;
- capacitor value, type, and two-terminal connectivity;
- existing `decouplingFor`, `decouplingTo`, and
  `maxDecouplingTraceLength` when already present; and
- routed PCB geometry.

Missing metadata reduces confidence. It does not require the board author to
add anything.

### Source-stage resolver

The resolver first identifies probable power and reference ports from existing
port capabilities such as `requiresPower`, `requiresGround`, voltage metadata,
and `shouldHaveDecouplingCapacitor`. Pin and net names are fallback evidence,
not authority.

For each probable power port, it finds two-terminal capacitors where:

1. one terminal shares the port's supply connectivity domain;
2. the other terminal reaches a probable reference domain;
3. the component is electrically usable as a capacitor; and
4. the connection is not separated by an incompatible net tie, switch, or
   isolation boundary.

The PCB-stage validator later ranks remaining candidates using:

- supply-path length from power pad to capacitor pad;
- return-path length or access to the same continuous reference region;
- via count;
- whether the capacitor and target share a local branch rather than only a
  distant bulk rail; and
- whether another power pin is a better match.

The ranking is deterministic and lexicographic. Strong topology evidence is
considered before value hints, names, or proximity. Several weak hints must
never combine into authoritative evidence.

Confidence communicates ambiguity, not electrical correctness:

| Confidence | Meaning |
| --- | --- |
| High | Semantic power/reference ports, exact topology, and one clearly best candidate |
| Medium | Correct topology but several plausible assignments |
| Low | Relationship depends on names, generic value ranges, or proximity |

When several assignments are equally plausible, all are preserved. tscircuit
must not silently invent a one-capacitor-per-pin assignment.

Existing explicit metadata strengthens, but is not required for, the inference:

| Evidence | Initial behavior |
| --- | --- |
| Existing `decouplingFor` / `decouplingTo` | Explicit relationship |
| Existing recommended capacitance plus exact connectivity | Stronger inference |
| Zero-input structural inference | Warning only |
| Names, generic presets, or proximity | Low-confidence warning only |

`shouldHaveDecouplingCapacitor` can request analysis. All relationships newly
inferred by this RFC remain warnings.

### PCB-stage validator

After routing, `@tscircuit/checks` should build a copper connectivity graph from
pads, traces, vias, net ties, and supported plane regions.

For each candidate relation it should measure:

- the shortest connected path from the target power pad to the capacitor supply
  pad;
- the path from the capacitor return pad to an acceptable target reference pad,
  or verified access to the same continuous reference region;
- via counts and any other explicitly configured geometric constraints.

The checker then performs deterministic matching between probable power pins
and candidate capacitors. If several assignments are equally plausible, the
result is ambiguous. The checker must not assume that a capacitor is dedicated
or shared when existing metadata does not say so.

Unsupported planes, missing PCB ports, incomplete routing, or unresolved return
domains produce `not_checked`. They are not electrical-compliance errors.
Proven schema or generation defects may be reported separately as tool errors.

## Circuit JSON

Add versioned records for inferred relations and results:

```json
{
  "type": "source_decoupling_relation",
  "source_decoupling_relation_id": "decoupling_relation_1",
  "target_source_port_id": "source_port_u1_vdd",
  "capacitor_source_component_id": "source_component_c1",
  "origin": "inferred",
  "confidence": "medium",
  "reasons": [
    "target port requires power",
    "capacitor connects the same supply domain to ground"
  ],
  "counter_evidence": [
    "two other capacitors have the same source topology"
  ],
  "alternative_candidate_count": 2
}
```

```json
{
  "type": "pcb_decoupling_result",
  "pcb_decoupling_result_id": "pcb_decoupling_result_1",
  "source_decoupling_relation_id": "decoupling_relation_1",
  "status": "ambiguous",
  "severity": "warning",
  "assigned_source_component_ids": ["source_component_c1"],
  "reason": "two other capacitors are plausible candidates"
}
```

The result status is one of:

- `satisfied`
- `violated`
- `ambiguous`
- `not_checked`

Schema changes must be released in dependency order so strict Circuit JSON
consumers do not reject new records.

## Diagnostics and build behavior

Diagnostics should include:

- the affected component and power pins;
- selected and rejected capacitor candidates;
- the evidence used for the relationship;
- actual and permitted path metrics; and
- why the result is a warning, ambiguous, or not checked.

An inferred warning should read like:

> Inferred C1 as decoupling U1.VDD because VDD requires power, C1 connects the
> same supply domain to ground, and C1 has the shortest routed path among three
> candidates. Confidence: medium. This inference may be wrong. Ignore warning.

Ignoring the warning creates a persistent waiver keyed by the rule, component,
and target ports. The user does not need to edit the circuit. Waivers may store
a reason and remain visible as waived results, but do not count as active
warnings.

Initial severity rules:

| Condition | Result |
| --- | --- |
| Existing explicit relationship or length limit | Preserve existing behavior |
| Zero-input structural inference | Warning |
| Name- or proximity-based inference | Low-confidence warning |

`tsci build` reports new inferred diagnostics without changing its default exit
behavior. This RFC introduces no new build-failing condition.

Waived findings must be classified as waived before the CLI counts active
warnings.

The CLI should also report the versions and supported schema capabilities of
the runtime packages it actually loaded. If the required schema or checker
capability is unavailable, the analysis is `not_checked`; the CLI must not
silently claim compliance.

## Backward compatibility

- No new JSX prop is introduced.
- `maxDecouplingTraceLength` remains accepted during a compatibility window.
- Its current generic trace behavior remains unchanged for existing designs.
- `decouplingFor` and `decouplingTo` remain valid explicit relationship hints.
- Boards without decoupling metadata receive warnings only.
- New Circuit JSON records require coordinated updates to strict consumers.

After migration, `maxDecouplingTraceLength` may be deprecated, but removing it
is outside this RFC.

## Package ownership

| Package | Responsibility |
| --- | --- |
| `@tscircuit/core` | Source candidate discovery using existing metadata |
| `circuit-json` | Versioned relation, result, and waiver schemas |
| `@tscircuit/checks` | Copper graph, path metrics, assignment, diagnostics |
| `@tscircuit/cli` | Capability checks, warning display, and waivers |
| `tscircuit` | Compatible dependency set and integration tests |

## Rollout

1. **Schema:** add internal inferred-relation and result records.
2. **Advisory source analysis:** emit candidates, ambiguity, and missing-cap
   warnings without failing builds.
3. **Physical validation:** add routed supply/return metrics and matching;
   continue warning by default.
4. **Warning controls:** add persistent ignore/waiver support and tune
   confidence from false-positive reports.

Each phase must work independently. Failure to run a later phase must not turn
an unknown result into a pass.

## Acceptance criteria

- With no new props or policies, tscircuit infers likely power-pin/capacitor
  relationships and labels them as inferred warnings.
- Every inferred warning includes confidence, reasons, and alternative
  candidates.
- Ignoring an inferred warning persists a stable waiver and does not require a
  circuit edit.
- A remote capacitor on the same named rail can produce an explainable
  warning from relative routed-path evidence.
- Bank ambiguity is preserved instead of inventing a one-to-one assignment.
- Symmetric candidates produce deterministic output.
- Ambiguous relationships and incomplete geometry do not fail builds.
- Both supply and return constraints are measured when the geometry supports
  them.
- Waived warnings are visible but do not count as active warnings.
- Project-local and bundled CLI runtime paths produce the same result or report
  a capability mismatch.
- Existing `maxDecouplingTraceLength` tests continue to pass.

## Open questions

- Which existing pin fields are sufficient before name-based fallback is used?
- What is the minimum plane representation required for return-path
  verification?
- What stable identity should persistent warning waivers use across refactors?
- What confidence threshold avoids warning fatigue without hiding useful
  inferences?

## References

- [Current capacitor props](https://github.com/tscircuit/props/blob/0aa7ff141dbda2fc7d1470f6919660035603dcfa/lib/components/capacitor.ts)
- [Trace-length aggregate check addition](https://github.com/tscircuit/checks/pull/174)
- [RP2040 hardware design guidance](https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf)
- [TI high-speed layout guidance](https://www.ti.com/lit/an/scaa082a/scaa082a.pdf)
- [Microchip decoupling guidance](https://onlinedocs.microchip.com/oxy/GUID-04B5982F-17EC-4A6E-B7FE-72DF0A5463B9-en-US-3/GUID-F15B709B-5112-4669-BAE9-9DBAC5DA209C.html)
