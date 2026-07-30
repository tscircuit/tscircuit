# RFC: Automatic Decoupling Detection and Enforcement

- **Status:** Draft / acceptable for advisory prototyping; strict
  build-failing enforcement is blocked until the Phase 0–5 gates and the
  disposition table in §30 are satisfied
- **Date:** 2026-07-31
- **Authors:** Codex orchestration, synthesizing the local-architecture,
  upstream, and electrical/design research tracks
- **Audience:** maintainers of `circuit-json`, `@tscircuit/props`,
  `@tscircuit/core`, `@tscircuit/checks`, `@tscircuit/cli`, `tscircuit`,
  component libraries, and PCB placement/routing packages
- **Target outcome:** a board author receives automatic, actionable, and
  optionally build-failing decoupling diagnostics without adding
  `maxDecouplingTraceLength` to capacitors

## 1. Abstract

This RFC defines a first-class model and implementation path for automatically
detecting whether an integrated-circuit power pin is properly decoupled and
enforcing the corresponding logical and physical requirements.

The requirement belongs to the powered component pin or pin group, not to the
capacitor. A component library declares the requirement once. The toolchain
then:

1. discovers eligible capacitors from source-domain connectivity;
2. determines the supply and reference terminals;
3. validates role, count, sharing, and capacitance;
4. constructs a physical copper graph after routing;
5. measures the shortest connected supply path and available return path or
   reference-plane access;
6. solves a deterministic capacitated matching problem between required pin
   slots and eligible capacitors; and
7. emits typed Circuit JSON diagnostics through normal aggregate DRC.

This approach detects a remote or incorrectly arranged capacitor bank even when
all capacitors and power pins are connected to the same named rail. It does not
depend on per-capacitor `maxDecouplingTraceLength`.

`maxDecouplingTraceLength` remains accepted as a deprecated-compatible explicit
constraint. When the target decoupling relationship is known, it contributes a
relationship-level supply-path maximum. During migration, its existing generic
`source_trace.max_length` behavior remains available. It is not required for
new automatic detection.

Automatic reporting and build enforcement are separate contracts. This RFC
adds source/netlist and PCB/routing diagnostics to normal DRC, adds a strict DRC
failure policy to the CLI, and stages default build failure to avoid breaking
legacy projects abruptly.

## 2. Normative language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and
**MAY** are to be interpreted as normative requirements for implementations of
this RFC.

## 3. Decision summary

The proposal adopts a two-pass, relationship-aware architecture:

```text
explicit intent + component policy + pin attributes + source connectivity
                                  |
                                  v
                     requirement/candidate resolver
                                  |
        source_decoupling_requirement + source_decoupling_relation
                                  |
                                  v
                      PCB copper graph builder
                                  |
                                  v
             feasible edges + deterministic capacitated matching
                                  |
                                  v
          source decoupling ERC + PCB decoupling DRC diagnostics
                                  |
                                  v
             aggregate checks + configurable tsci exit policy
```

The source pass establishes electrical eligibility. PCB proximity MUST NOT
establish electrical intent. The PCB pass validates only candidates already
shown to be electrically eligible.

The normative precedence order is:

1. explicit design relationship, constraint, override, or waiver;
2. reviewed component-library pin or pin-group policy;
3. structural inference from semantic pin attributes and exact connectivity;
4. name-based or generic fallback.

Only explicit requirements and reviewed, versioned, vendor-cited library
policies that the project trusts are eligible to fail a build when strict DRC
is enabled. Structural inference MAY warn. Name-only fallback MUST NOT fail a
build. If assignment is ambiguous, the implementation MUST preserve the
candidate group and MUST NOT fail unless every policy-permitted assignment
fails the same authoritative rule. Stable-ID order is only a presentation
tie-breaker, never electrical evidence.

## 4. Motivation

Local decoupling is a relationship among:

- a target device power pin or power-pin group;
- a supply domain;
- one or more capacitors of an acceptable role and value;
- an acceptable return/reference domain;
- a physical supply path;
- a physical return path or valid reference-plane access; and
- device-specific count, sharing, via, and locality constraints.

A generic maximum on a capacitor does not express that relationship.

The practical failure motivating this RFC is a bank of nominally correct
capacitors connected to the correct power and ground nets but positioned or
routed so that they do not provide local high-frequency decoupling to the
individual IC pins. A netlist-only check sees sufficient capacitance. A generic
trace-length check sees only ordinary traces to a shared net. Neither can prove
that each required pin has a feasible local capacitor path.

The electrical motivation is supported by primary vendor guidance:

- Raspberry Pi states that local decoupling supplies charge for sudden load
  demand and normally recommends 100 nF per RP2040 power pin, while documenting
  an intentional USB_VDD/IOVDD sharing trade-off in its reference design.
  Sharing therefore must be policy, not a universal one-cap-per-pin rule:
  [Hardware design with RP2040, section 2.1.2](https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf).
- RP2040 VREG input/output have distinct 1 µF local requirements, demonstrating
  that pin names and a universal 100 nF rule are insufficient:
  [RP2040 datasheet, section 2.10.1](https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf).
- Texas Instruments treats the parasitic path through supply pin, capacitor,
  and device ground return as the relevant loop, and gives part-family-specific
  placement guidance:
  [PCB Layout Guidelines for TAS2xxx](https://www.ti.com/lit/pdf/slaa902).
- TI also recommends placing the lowest-valued capacitor closest, using adjacent
  ground vias, and routing power flow through the capacitor:
  [High-Speed Layout Guidelines, section 2.4](https://www.ti.com/lit/an/scaa082a/scaa082a.pdf).
- Microchip distinguishes analog, digital, and output supply domains and
  emphasizes short, low-inductance plane access:
  [AN5603](https://ww1.microchip.com/downloads/aemDocuments/documents/TCG/ApplicationNotes/ApplicationNotes/AN5603-Power-Supply-Decoupling-and-Layout-Considerations-DS00005603.pdf).
- A Microchip family manual gives a concrete 6 mm pin-to-capacitor limit. This
  demonstrates that numeric limits are useful but device/family-specific:
  [Decoupling Capacitors, section 2.2](https://onlinedocs.microchip.com/oxy/GUID-04B5982F-17EC-4A6E-B7FE-72DF0A5463B9-en-US-3/GUID-F15B709B-5112-4669-BAE9-9DBAC5DA209C.html).

The DRC defined here is a geometric and topological proxy. It MUST NOT claim to
prove frequency-domain PDN impedance, capacitor derating, anti-resonance, or
loop inductance.

## 5. Current behavior and verified version skew

### 5.1 Installed worktree versions

The researched worktree resolves:

| Package | Installed version |
| --- | ---: |
| `tscircuit` | `0.0.2153` |
| `@tscircuit/core` | `0.0.1521` |
| `@tscircuit/checks` | `0.0.146` |
| `@tscircuit/props` | `0.0.592` |
| `@tscircuit/cli` | `0.1.1748` |
| root `circuit-json` | `0.0.448` |
| CLI- and tscircuit-nested `circuit-json` | `0.0.455` |

The version table above was verified from that worktree's lockfile and
installed package artifacts. It is a dated reproduction baseline, not a claim
about the versions all projects currently resolve.

Upstream heads inspected on 2026-07-30 were newer for core, props, CLI, and the
meta-package, while `@tscircuit/checks@0.0.146` remained the current checks
release. The primary-source links below are commit-pinned where the evidence
depends on exact behavior.

### 5.2 Existing props and data flow

`@tscircuit/props` accepts:

```ts
interface CapacitorProps {
  decouplingFor?: string
  decouplingTo?: string
  bypassFor?: string
  bypassTo?: string
  maxDecouplingTraceLength?: number
}
```

Primary source:
[`capacitor.ts`](https://github.com/tscircuit/props/blob/0aa7ff141dbda2fc7d1470f6919660035603dcfa/lib/components/capacitor.ts).

Core implements `decouplingFor`/`decouplingTo` by creating two ordinary traces.
It does not retain “capacitor C serves target pin P” as semantic Circuit JSON.
Primary source:
[`Capacitor.ts`](https://github.com/tscircuit/core/blob/e6322181621fd8c13922fbea559504918cf415ae/lib/components/normal-components/Capacitor.ts).

Core serializes `maxDecouplingTraceLength` as
`source_component.max_decoupling_trace_length`. When any generic source trace
touches a capacitor carrying this value, core assigns the minimum connected
capacitor limit to `source_trace.max_length`; otherwise it falls back to
`<trace maxLength>`. Both capacitor legs are affected. The mechanism does not
know whether the capacitor is a bypass, coupling, filter, timing, or bulk part.
Primary source:
[`get-max-length-from-connected-components.ts`](https://github.com/tscircuit/core/blob/e6322181621fd8c13922fbea559504918cf415ae/lib/components/primitive-components/Trace/trace-utils/get-max-length-from-connected-components.ts).

The current generic source schemas are:
[`source_simple_capacitor.ts`](https://github.com/tscircuit/circuit-json/blob/836bcdf4af71a4cbcf6a2bad5d2ba7f51bedec55/src/source/source_simple_capacitor.ts)
and
[`source_trace.ts`](https://github.com/tscircuit/circuit-json/blob/836bcdf4af71a4cbcf6a2bad5d2ba7f51bedec55/src/source/source_trace.ts).

### 5.3 Existing pin metadata

The strongest existing foundation is:

```ts
shouldHaveDecouplingCapacitor?: boolean
recommendedDecouplingCapacitorCapacitance?: string | number
```

These fields were added for toolchain consumption in
[`@tscircuit/props` PR #603](https://github.com/tscircuit/props/pull/603),
added to Circuit JSON by
[`circuit-json` PR #493](https://github.com/tscircuit/circuit-json/pull/493),
and serialized by core through
[`core` PR #2120](https://github.com/tscircuit/core/pull/2120).

Current source definitions:

- [`PinAttributeMap`](https://github.com/tscircuit/props/blob/0aa7ff141dbda2fc7d1470f6919660035603dcfa/lib/common/pinAttributeMap.ts)
- [`source_pin_attributes.ts`](https://github.com/tscircuit/circuit-json/blob/836bcdf4af71a4cbcf6a2bad5d2ba7f51bedec55/src/source/properties/source_pin_attributes.ts)
- [`apply-pin-attributes-to-source-port.ts`](https://github.com/tscircuit/core/blob/e6322181621fd8c13922fbea559504918cf415ae/lib/components/primitive-components/Port/apply-pin-attributes-to-source-port.ts)

No installed or researched upstream decoupling check consumes these fields.
`@tscircuit/checks` only counts them as evidence that a pin is not wholly
underspecified:
[`check-all-pins-in-component-are-underspecified.ts`](https://github.com/tscircuit/checks/blob/efc69871888f2ff3f392f11070fb1b0ada9e2f19/lib/check-all-pins-in-component-are-underspecified.ts).

### 5.4 Existing trace-length DRC

`checkPcbTraceLengths()`:

- maps each `pcb_trace` to its `source_trace`;
- skips sources without numeric `max_length`;
- uses `pcb_trace.trace_length` when available;
- otherwise sums planar route segments and charges a fixed 1.6 mm per via; and
- emits `pcb_trace_too_long_warning`.

Primary sources:

- [`checks` PR #174](https://github.com/tscircuit/checks/pull/174)
- [`check-pcb-trace-lengths.ts`](https://github.com/tscircuit/checks/blob/efc69871888f2ff3f392f11070fb1b0ada9e2f19/lib/check-pcb-trace-lengths.ts)
- [`pcb_trace_too_long_warning.ts`](https://github.com/tscircuit/circuit-json/blob/836bcdf4af71a4cbcf6a2bad5d2ba7f51bedec55/src/pcb/pcb_trace_too_long_warning.ts)

Contrary to the older diagnosis in the original problem statement,
`@tscircuit/checks@0.0.146` includes this check in `runAllRoutingChecks()`:
[`run-all-checks.ts`](https://github.com/tscircuit/checks/blob/efc69871888f2ff3f392f11070fb1b0ada9e2f19/lib/run-all-checks.ts).

However, direct inspection of the installed `@tscircuit/cli@0.1.1748` artifact
shows that its fallback aggregate omits trace length; the published metadata
does not identify the exact embedded checks version. Separately, the inspected
upstream CLI head declares `tscircuit@0.0.2142-libonly`, and that head's lock
resolves `@tscircuit/checks@0.0.145`. The upstream lock is build-provenance
evidence for that head, not proof of the precise dependency embedded in the
installed 0.1.1748 artifact. Normal local generation first resolves the
project's own `tscircuit`, but fallback/bundled paths can differ.
Published-artifact tests are therefore REQUIRED.

### 5.5 Existing CLI enforcement

`tsci build` separates Circuit JSON errors and warnings and prints them:
[`build-file.ts`](https://github.com/tscircuit/cli/blob/38eb5ef5efdd30cf30c5b86102e5d3f7ea33da46/cli/build/build-file.ts).

Current CLI intentionally exits 0 for ordinary DRC errors and exits nonzero only
for fatal generation failures:

- [`register.ts`](https://github.com/tscircuit/cli/blob/38eb5ef5efdd30cf30c5b86102e5d3f7ea33da46/cli/build/register.ts)
- [`build-with-drc-error.test.ts`](https://github.com/tscircuit/cli/blob/38eb5ef5efdd30cf30c5b86102e5d3f7ea33da46/tests/cli/build/build-with-drc-error.test.ts)

A live local build produced trace-overlap and pad/trace-clearance errors, printed
“Build completed with errors,” and exited 0. Therefore adding a decoupling error
alone is automatic reporting, not build enforcement.

### 5.6 RP2040 example

The local RP2040 part defines aliases but no decoupling pin attributes. Its six
100 nF IOVDD capacitors are placed in one row, each connected separately to
shared V3V3 and GND nets; the six IOVDD pins independently connect to V3V3.

A controlled local render verified:

- with `maxDecouplingTraceLength={2}`, both capacitor-connected source traces
  inherited `max_length: 2` and emitted overlength warnings;
- `decouplingFor`/`decouplingTo` behaved identically to explicit generic traces;
- with pin decoupling metadata but no maximum, metadata reached `source_port`,
  no maximum appeared, and no decoupling diagnostic was emitted.

## 6. Terminology

**Target port**

A source port on a powered component for which a decoupling requirement is
declared or inferred.

**Target group**

One or more target ports governed by one sharing/cardinality policy.

**Requirement**

A normalized statement of role, target ports, supply domain, acceptable
reference domain, value/count/sharing rules, geometric constraints,
provenance, and enforcement.

**Requirement slot**

One unit of dedicated coverage. A requirement with count six expands to six
slots for matching.

**Candidate capacitor**

A `simple_capacitor` whose source topology, terminals, role, and electrical
properties make it eligible for a requirement.

**Supply terminal**

The capacitor terminal in the target supply connectivity class.

**Return terminal**

The capacitor terminal in an acceptable reference connectivity class.

**Relation**

An explicit or inferred source-domain association between requirements and one
or more candidate capacitors. A relation may remain a candidate group when
source topology is symmetric.

**Coverage assignment**

A feasible PCB-stage assignment of requirement slots to capacitors. The
assignment is a proof of coverage, not necessarily a claim of exclusive
electrical purpose.

**Supply path**

Connected routed copper from the target PCB port to the capacitor supply PCB
port.

**Return path**

Connected routed copper from the capacitor return PCB port to an acceptable
target reference PCB port.

**Return access**

Verified access from both capacitor return and target reference to the same
continuous reference region when exact in-plane current spreading is not
measured.

**Authoritative policy**

An explicit design policy or reviewed component-library policy.

**Structural inference**

An inference based on semantic pin attributes and exact source connectivity,
without relying on names or PCB proximity.

**Fallback inference**

A low-confidence inference based on names, generic component type, or generic
presets.

**Bank**

Multiple capacitors sharing supply/reference domains. A bank is not inherently
invalid; it fails only when no permitted assignment satisfies the applicable
locality, count, sharing, value, and return constraints.

## 7. Goals

The implementation MUST:

1. detect decoupling requirements without per-capacitor
   `maxDecouplingTraceLength`;
2. let component libraries declare part/pin requirements once;
3. recognize direct traces, named-net connectivity, exposed subcircuit nets,
   and declared internal connectivity;
4. validate missing capacitors, wrong return domains, unacceptable values,
   count, sharing, and physical path constraints;
5. detect a remote bank using assignment feasibility rather than visual
   pattern recognition;
6. distinguish source/netlist validation from PCB/routing validation;
7. preserve evidence, policy ID/version, and confidence in diagnostics;
8. be deterministic under Circuit JSON array permutation;
9. distinguish `covered`, `failed`, `ambiguous`, `not_applicable`,
   `suppressed`, `not_checked`, and `unverifiable`;
10. integrate into aggregate DRC and an explicit CLI failure policy; and
11. retain backward compatibility for existing capacitor and trace props.

## 8. Non-goals

The first implementation MUST NOT:

- claim frequency-domain PDN validation;
- infer a physically meaningful universal distance from capacitance alone;
- fetch or interpret datasheets during builds;
- use an LLM or probabilistic service in build-failing analysis;
- add, move, or reconnect components automatically;
- silently rewrite source traces or schematic topology;
- make PCB proximity establish electrical purpose;
- treat every capacitor bank as invalid;
- merge analog, digital, isolated, or post-filter reference domains because
  their names look similar; or
- replace vendor reference-layout review, SPICE, or field solvers.

Automatic placement and routing optimization MAY later consume the same
requirement/relation records, but they are outside the normative v1 checker.

## 9. Electrical and product requirements

### 9.1 Electrical requirements

1. **Pin-specific policy.** Requirements MUST be representable per port and per
   exact port group.
2. **Role-specific policy.** The model MUST distinguish at least local bypass,
   bulk, regulator input, regulator output, and reference filtering.
3. **Domain correctness.** A candidate MUST connect the target supply domain to
   an explicitly acceptable reference domain.
4. **Terminal identity.** Supply and return capacitor ports MUST be recorded
   after connectivity resolution, including for non-polarized capacitors.
5. **Capacitance semantics.** Policies MUST support an accepted range and/or
   minimum aggregate capacitance. A nominal recommendation alone MUST NOT imply
   an undocumented tolerance.
6. **Sharing.** Policies MUST state whether a capacitor is dedicated, shared by
   an exact authorized group, or aggregate/bulk. A numeric capacity alone MUST
   NOT authorize sharing by an otherwise unnamed group of pins.
7. **Physical path.** Authoritative geometric policies MUST be able to limit
   supply length, return length, combined length, via counts, side, and
   reference continuity independently.
8. **Plane honesty.** Access to a continuous plane MAY be verified; an
   unmeasured plane-spreading path MUST NOT be reported as zero length.
9. **Narrow claims.** Passing a geometric policy MUST be described as such and
   MUST NOT imply acceptable impedance over frequency.

### 9.2 Product requirements

1. **No repetitive board annotation.** A board author MUST NOT need to add a
   maximum to every capacitor when a part library supplies the policy.
2. **Explainability.** Every diagnostic MUST identify target, requirement,
   policy source/version, candidates, measured facts, limit, and corrective
   actions.
3. **Compatibility.** Existing JSX and Circuit JSON MUST remain readable during
   staged rollout.
4. **Predictable enforcement.** Diagnostic severity and CLI exit behavior MUST
   be separately configurable and visible.
5. **Offline reproducibility.** Policy resolution MUST be hermetic and pinned by
   ID/version.
6. **Actionable uncertainty.** Missing geometry or ambiguous intent MUST produce
   an explicit state, never a silent pass.
7. **Auditable exceptions.** Waivers MUST be scoped, reasoned, stable, and
   visible in reports.
8. **Bundle parity.** Published CLI artifacts MUST be tested, and executed
   checker/core versions MUST be observable.

## 10. Alternatives considered

### 10.1 Name/proximity inference plus generic trace maximum

Find a `C*` component on `VDD`/`GND`, choose the nearest IC, and set
`source_trace.max_length`.

This is small and reuses existing DRC, but names are not semantics, both
capacitor legs are constrained generically, shared-net traces do not represent
the target-pin-to-capacitor path, and placement would decide electrical intent.

**Decision:** rejected as the normative architecture. Name inference MAY
produce authoring suggestions only.

### 10.2 Hidden direct-trace synthesis

Infer a pair, synthesize a direct source trace, and attach an internal maximum.

This can feed existing routing/checking, but mutates topology, chooses an
arbitrary pair in symmetric banks, and still does not validate the full return
relationship.

**Decision:** rejected for automatic inference. Existing explicit
`decouplingFor` MAY be adapted into a first-class relation while preserving its
existing traces.

### 10.3 First-class requirements, relations, and path-aware DRC

Separate electrical intent from geometric validation, represent ambiguity,
solve coverage on eligible candidates, and emit dedicated diagnostics.

**Decision:** adopted.

### 10.4 Full PDN simulation

Require ESR/ESL, package and stackup models, load spectra, plane geometry, and
target impedance.

This is a valuable future opt-in analysis but infeasible as a default build DRC
with today's data.

**Decision:** out of scope. The proposed role/policy/provenance model is
intentionally extensible.

## 11. Confidence and precedence model

### 11.1 Precedence tiers

Resolution MUST be lexicographic, not an opaque weighted score.

| Tier | Source | May fail strict build? |
| ---: | --- | --- |
| 1 | explicit relation, constraint, override, or waiver | Yes |
| 2 | reviewed component-library pin/group policy | Yes |
| 3 | semantic pin attributes + structural connectivity | Only definite logical violations; geometric inference warns by default |
| 4 | names/generic fallback | No |

Within one tier, narrower scope wins:

```text
exact relation > exact port > exact pin group > component >
component family/package > project > global preset
```

Conflicting equally scoped authoritative policies MUST emit
`policy_conflict`. The implementation MUST NOT silently select by input order.

### 11.2 Constraint composition

Numeric safety constraints normally compose by taking the strictest applicable
value:

```text
effective maximum = minimum(all applicable non-waived maxima)
```

An explicit relaxation MUST use a separately modeled override or waiver with:

- the replaced policy/field;
- a non-empty reason;
- author/scope;
- optional expiration; and
- policy version.

`maxDecouplingTraceLength` contributes an explicit maximum but MUST NOT silently
relax a stricter library requirement.

### 11.3 Confidence

Each resolved field MUST carry provenance and one confidence enum:

```ts
type DecouplingConfidence =
  | "explicit"
  | "library_authoritative"
  | "structural_unambiguous"
  | "structural_ambiguous"
  | "fallback"
```

Confidence is field-level. A requirement may have a library-authoritative role
and value while its candidate relation is structurally ambiguous.

Severity MUST use the weakest evidence required to prove the violation. For
example, a missing-capacitor finding remains an error only when every fact
required by §14.8 is authoritative, while a name-only claim that a nearby
capacitor is too far remains informational.

### 11.4 Negative intent

Explicit `decouplingRequired: false`, `role: "not_decoupling"`, or a valid waiver
MUST override lower-tier positive inference. `undefined` means unspecified, not
false.

### 11.5 Trust, policy compatibility, and field provenance

“Library” is origin, not trust. An error-eligible policy MUST be versioned,
carry field-specific evidence, and be trusted externally to its authoring
metadata: either its exact ID/version and digest are in the installed,
version-pinned reviewed tscircuit registry or project configuration explicitly
allowlists that exact identity. Self-declared reviewer names and documentation
are provenance, not authority. Untrusted third-party metadata is capped at
warning.

Precedence is applied independently to role, value/range, count, exact sharing
group, supply/reference domain, each geometric metric, severity, opt-out, and
waiver. The effective record MUST retain provenance for every resolved field.
An explicit relaxation is not “strictest wins”: it MUST name the superseded
field and policy version and is treated as an auditable override. Without such
an override, applicable maxima combine by minimum.

An unknown, malformed, or newer unsupported policy ID/version MUST produce a
typed compatibility diagnostic. It MUST NOT fall back to a similarly named or
older policy. If that policy is needed for an enforcing conclusion, the result
is `unverifiable`; strict CI MAY fail the compatibility diagnostic itself, but
MUST NOT report the board as electrically noncompliant with an unevaluated
rule.

## 12. Proposed public API

### 12.1 Pin attributes

The existing fields remain valid. Add a structured policy selector/override:

```ts
interface DecouplingRequirementProp {
  required?: boolean
  role?:
    | "local_bypass"
    | "bulk"
    | "regulator_input"
    | "regulator_output"
    | "reference_filter"
    | "other"

  policyId?: string
  targetGroup?: string
  acceptedCapacitance?: {
    min?: number | string
    max?: number | string
    recommended?: number | string
  }
  requiredCount?: number
  sharing?: "dedicated" | "exact_group" | "aggregate"
  maxTargetPortsPerCapacitor?: number
  permittedSharedTargetGroups?: string[][]
  acceptableReferencePorts?: string[]
  acceptableReferenceNets?: string[]

  maxSupplyPathLength?: number | string
  maxReturnPathLength?: number | string
  maxCombinedPathLength?: number | string
  maxSupplyVias?: number
  maxReturnVias?: number
  requireSameSide?: boolean
  requireContinuousReference?: boolean

  enforcement?: "error" | "warning" | "info" | "off"
  documentationUrl?: string
  documentationRevision?: string
  documentationLocator?: string
  documentationDigest?: string
}

interface PinAttributeMap {
  // Existing compatibility fields:
  shouldHaveDecouplingCapacitor?: boolean
  recommendedDecouplingCapacitorCapacitance?: string | number

  // New normalized authoring surface:
  decoupling?: DecouplingRequirementProp | false
}
```

`shouldHaveDecouplingCapacitor: true` declares an *existence intent*, but it
supplies no numeric
path limit, sharing permission, exact capacitance tolerance, or reference
domain by itself. Its companion `recommended...` value remains advisory unless
a structured or versioned policy converts it to an accepted range.
It is not sufficient by itself for an initial hard failure because candidate
and reference semantics may still be inferred. `requiresPower` alone never
creates an authoritative decoupling requirement.
Explicit `false` suppresses lower-tier discovery; absence means unknown.

String units are parsed by props/core. Circuit JSON stores normalized
capacitance in farads and distance in millimetres.

Example component-library definition:

```tsx
<chip
  name="U1"
  pinAttributes={{
    IOVDD1: {
      requiresPower: true,
      decoupling: {
        required: true,
        role: "local_bypass",
        policyId: "raspberry-pi.rp2040-iovdd-v1",
        targetGroup: "IOVDD_LOCAL",
        acceptedCapacitance: { recommended: "100nF" },
        sharing: "dedicated",
        enforcement: "warning",
        documentationUrl:
          "https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf",
        documentationLocator: "section 2.1.2",
      },
    },
  }}
/>
```

This is a non-normative proposed RP2040 metadata example. The citation supports
the 100 nF recommendation, local placement intent, and documented sharing
exception; it does not establish an 80–150 nF accepted range, a 2 mm maximum,
or a zero-via rule. Those values MUST NOT fail an RP2040 build unless a project
separately adopts and trusts an exact reviewed engineering policy for them.

### 12.2 Optional capacitor role

Capacitor role metadata is optional and never required for ordinary automatic
detection:

```ts
interface CapacitorProps {
  decouplingRole?:
    | "auto"
    | "local_bypass"
    | "bulk"
    | "regulator_input"
    | "regulator_output"
    | "reference_filter"
    | "not_decoupling"
}
```

`"not_decoupling"` is a strong negative signal for coupling, crystal-load,
bootstrap, feedback, or other capacitors that topology might otherwise make
eligible. Existing `decouplingFor`/`decouplingTo` are explicit positive intent.

### 12.3 Project configuration

Illustrative config:

```json
{
  "drc": {
    "decoupling": {
      "mode": "enforce-authoritative",
      "defaultPolicyId": "tscircuit.digital-local-v1",
      "serializeAnalysis": true,
      "placementAdvisory": true,
      "maxCandidatesPerRequirement": 128
    },
    "trustedDecouplingPolicies": [
      {
        "policyId": "project.example-layout-v1",
        "policyVersion": "1",
        "digest": "sha256:..."
      }
    ],
    "failurePolicy": "errors"
  }
}
```

Supported decoupling modes:

- `"off"`: no new decoupling analysis;
- `"advisory"`: run all analysis, cap all new diagnostics at warning;
- `"enforce-authoritative"`: explicit/library definite violations retain error
  severity; heuristic violations remain non-fatal;
- `"strict"`: fails authoritative errors and configured compatibility/resource
  errors. During the initial rollout it MUST NOT promote heuristic-only
  requirements, ambiguous assignments, or incomplete geometry into an
  electrical-compliance failure.

Supported CLI failure policies:

- `"none"`: preserve current exit-0 behavior for non-fatal DRC;
- `"errors"`: exit 1 for any non-ignored Circuit JSON error;
- `"errors-and-warnings"`: exit 1 for any non-ignored error or warning.

CLI aliases:

```text
tsci build --strict-drc
tsci build --drc-failure-policy=errors
tsci check decoupling
```

`--strict-drc` aliases `--drc-failure-policy=errors`.
`tsci check decoupling` runs source and available PCB checks and exits nonzero
for definite non-waived errors.

## 13. Circuit JSON schema

### 13.1 Requirement record

```ts
interface SourceDecouplingRequirement {
  type: "source_decoupling_requirement"
  source_decoupling_requirement_id: string

  target_source_component_id: string
  target_source_port_ids: string[]
  target_group_id?: string

  supply_source_net_id?: string
  capacitor_return_domain_ids?: string[]
  target_reference_source_port_ids?: string[]
  permitted_reference_traversals?: Array<
    "direct" | "net_tie" | "zero_ohm" | "ferrite" | "inductor"
  >

  role:
    | "local_bypass"
    | "bulk"
    | "regulator_input"
    | "regulator_output"
    | "reference_filter"
    | "other"

  accepted_capacitance_min?: number
  accepted_capacitance_max?: number
  recommended_capacitance?: number
  required_capacitor_count?: number
  required_total_capacitance_min?: number

  sharing: "dedicated" | "exact_group" | "aggregate"
  max_target_ports_per_capacitor?: number
  permitted_shared_target_port_groups?: string[][]

  max_supply_path_length?: number
  max_return_path_length?: number
  max_combined_path_length?: number
  max_supply_vias?: number
  max_return_vias?: number
  require_same_side?: boolean
  require_continuous_reference?: boolean
  return_verification:
    | "explicit_path_required"
    | "continuous_region_access_sufficient"
    | "not_required"

  policy_id: string
  policy_version: string
  policy_source: "explicit" | "library" | "structural" | "fallback"
  confidence:
    | "explicit"
    | "library_authoritative"
    | "structural_unambiguous"
    | "structural_ambiguous"
    | "fallback"
  enforcement: "error" | "warning" | "info" | "off"

  field_provenance: Record<string, {
    code: string
    source_element_ids: string[]
    policy_id?: string
    policy_version?: string
    documentation_url?: string
    documentation_revision?: string
    documentation_locator?: string
    documentation_digest?: string
    authority:
      | "trusted_vendor_evidence"
      | "trusted_tscircuit_policy"
      | "trusted_project_policy"
      | "untrusted"
    confidence:
      | "explicit"
      | "library_authoritative"
      | "structural_unambiguous"
      | "structural_ambiguous"
      | "fallback"
  }>
  documentation_url?: string
  documentation_revision?: string
  documentation_locator?: string
  documentation_digest?: string
  subcircuit_id?: string
}
```

Requirements MUST be serialized by core when they arise from explicit or
component-library metadata. For old Circuit JSON containing only existing
source-port fields, the checks resolver MUST be able to synthesize an ephemeral
equivalent.

Input requirement records are authoritative declarations. Inferred relations,
measurements, and diagnostics are derived output. Every analysis run MUST
remove or replace prior derived output for the same checker/version before
recomputing it; a derived record MUST NOT be promoted to user intent on a later
run.

### 13.2 Relation record

```ts
interface SourceDecouplingRelation {
  type: "source_decoupling_relation"
  source_decoupling_relation_id: string
  source_decoupling_requirement_ids: string[]

  candidates: Array<{
    capacitor_source_component_id: string
    capacitor_supply_source_port_id: string
    capacitor_return_source_port_id: string
  }>

  resolution:
    | "explicit"
    | "unique"
    | "candidate_group"
    | "ambiguous"
    | "unresolved"
  relation_source: "explicit" | "structural" | "fallback"
  confidence:
    | "explicit"
    | "library_authoritative"
    | "structural_unambiguous"
    | "structural_ambiguous"
    | "fallback"
  evidence: Array<{
    code: string
    source_element_ids: string[]
  }>
  subcircuit_id?: string
}
```

`candidates` MUST be non-empty and unique by the three-ID tuple. Every port in
a tuple MUST belong to its named capacitor, supply and return ports MUST differ,
and all IDs MUST resolve in the same allowed board/subcircuit connectivity
scope. Parallel positional arrays are forbidden.

`targetGroup` is a namespaced library authoring key
(`<package-or-part-id>/<group-name>`), not a Circuit JSON selector. Core
resolves all declarations for that key into one requirement containing sorted,
unique source-port IDs and a stable hash-derived `target_group_id`. Duplicate
identical declarations coalesce. Conflicting roles, counts, sharing rules, or
policies produce `policy_conflict`; counts are never added merely because the
same per-pin declaration repeats. Exact shared groups in Circuit JSON contain
resolved source-port IDs only.

The relation MAY contain a symmetric candidate group. It MUST NOT invent a
one-to-one source assignment merely to make output deterministic.

Core MUST serialize explicit relations from `decouplingFor`/`decouplingTo`.
During DRC, the resolver produces structural relations. When
`serializeAnalysis` is enabled, Board/core inserts deduplicated inferred
relations before diagnostics. Standalone checks MUST work whether inferred
relations were pre-serialized or resolved transiently.

### 13.3 PCB evaluation record

Serialization is optional by default and recommended for debug/viewers:

```ts
interface PcbDecouplingEvaluation {
  type: "pcb_decoupling_evaluation"
  pcb_decoupling_evaluation_id: string
  source_decoupling_requirement_id: string
  source_decoupling_relation_id?: string

  execution_status: "checked" | "not_checked" | "unverifiable"
  coverage_status:
    | "covered"
    | "deficient"
    | "ambiguous"
    | "not_applicable"
    | "suppressed"

  assigned_pairs: Array<{
    target_source_port_id: string
    capacitor_source_component_id: string
    capacitor_supply_source_port_id: string
    capacitor_return_source_port_id: string
    supply_path_length?: number
    return_path_length?: number
    combined_path_length?: number
    supply_via_count?: number
    return_via_count?: number
    return_mode?:
      | "return_path_measured"
      | "return_access_verified"
      | "return_unverifiable"
  }>

  policy_id: string
  policy_version: string
  checker_version: string
  subcircuit_id?: string
}
```

### 13.4 Diagnostic records

Use four stable top-level types and code enums rather than multiplying a unique
Circuit JSON type for every reason:

```ts
type SourceDecouplingDiagnosticCode =
  | "missing_capacitor"
  | "capacitance_mismatch"
  | "wrong_reference"
  | "dedicated_capacitor_reused"
  | "assignment_ambiguous"
  | "policy_conflict"
  | "legacy_limit_unbound"
  | "malformed_policy"
  | "unknown_policy"
  | "incompatible_policy_version"
  | "analysis_resource_limit"

interface SourceDecouplingError {
  type: "source_decoupling_error"
  source_decoupling_error_id: string
  error_type: "source_decoupling_error"
  code: SourceDecouplingDiagnosticCode
  message: string
  source_decoupling_requirement_ids: string[]
  source_decoupling_relation_ids?: string[]
  source_component_ids?: string[]
  source_port_ids?: string[]
  candidate_capacitor_source_component_ids?: string[]
  policy_id: string
  policy_version: string
  original_severity: "error" | "warning" | "info"
  effective_severity: "error"
  execution_status: "checked" | "unverifiable"
  coverage_status: "deficient" | "ambiguous" | "not_applicable"
  waiver_key: string
  subcircuit_id?: string
}

interface SourceDecouplingWarning {
  type: "source_decoupling_warning"
  source_decoupling_warning_id: string
  warning_type: "source_decoupling_warning"
  // Same common fields as SourceDecouplingError except:
  effective_severity: "warning" | "info"
}

type PcbDecouplingDiagnosticCode =
  | "supply_path_too_long"
  | "return_path_too_long"
  | "combined_path_too_long"
  | "excess_supply_vias"
  | "excess_return_vias"
  | "bank_coverage_deficient"
  | "no_connected_copper_path"
  | "return_unverifiable"
  | "reference_region_discontinuous"
  | "wrong_side"
  | "routing_not_checked"
  | "unsupported_branch_topology"
  | "analysis_resource_limit"

interface PcbDecouplingError {
  type: "pcb_decoupling_error"
  pcb_decoupling_error_id: string
  error_type: "pcb_decoupling_error"
  code: PcbDecouplingDiagnosticCode
  message: string
  source_decoupling_requirement_ids: string[]
  source_decoupling_relation_ids?: string[]
  target_source_port_ids: string[]
  candidate_capacitor_source_component_ids: string[]
  deficient_target_source_port_ids?: string[]
  rejected_candidates?: Array<{
    target_source_port_id: string
    capacitor_source_component_id: string
    reason_codes: PcbDecouplingDiagnosticCode[]
    supply_path_length?: number
    return_path_length?: number
    supply_via_count?: number
    return_via_count?: number
    capacitor_plane_access_length?: number
    target_plane_access_length?: number
  }>
  actual_supply_path_length?: number
  maximum_supply_path_length?: number
  actual_return_path_length?: number
  maximum_return_path_length?: number
  actual_combined_path_length?: number
  maximum_combined_path_length?: number
  actual_supply_via_count?: number
  maximum_supply_via_count?: number
  actual_return_via_count?: number
  maximum_return_via_count?: number
  return_mode?:
    | "return_path_measured"
    | "return_access_verified"
    | "return_unverifiable"
  policy_id: string
  policy_version: string
  original_severity: "error" | "warning" | "info"
  effective_severity: "error"
  execution_status: "checked" | "unverifiable"
  coverage_status: "deficient" | "ambiguous" | "not_applicable"
  waiver_key: string
  subcircuit_id?: string
}

interface PcbDecouplingWarning {
  type: "pcb_decoupling_warning"
  pcb_decoupling_warning_id: string
  warning_type: "pcb_decoupling_warning"
  // Same common fields as PcbDecouplingError except:
  effective_severity: "warning" | "info"
}
```

The warning interfaces inherit every common field shown on their corresponding
error interfaces; implementations MUST define that shared base once in the
schema package rather than treating the comments above as optional fields.
Candidate and rejected-edge arrays are bounded and deterministically sorted.

Waiver resolution occurs before active diagnostic type classification. A
waived finding is emitted only as a `decoupling_suppression` report record with
`original_severity`, `effective_severity: "suppressed"`, and `waiver_id`; it
MUST NOT retain an `_error` type or `error_type`, and MUST NOT enter the CLI's
active error/warning sets. Active `_error` records always have effective
severity `error`. `not_checked` is an evaluation/report state and does not
produce an active electrical error.

`@tscircuit/circuit-json-util` MUST categorize source diagnostics as netlist DRC
and PCB diagnostics as routing DRC.

Diagnostic IDs MUST derive from stable requirement IDs, code, candidate/target
IDs where relevant, and policy version. They MUST NOT depend on array order or
human message text.

### 13.5 Concrete Circuit JSON example

```json
[
  {
    "type": "source_decoupling_requirement",
    "source_decoupling_requirement_id": "source_decoupling_requirement_U1_IOVDD3",
    "target_source_component_id": "source_component_U1",
    "target_source_port_ids": ["source_port_U1_IOVDD3"],
    "target_group_id": "source_decoupling_group_rp2040_iovdd_local",
    "supply_source_net_id": "source_net_V3V3",
    "capacitor_return_domain_ids": ["source_domain_GND"],
    "target_reference_source_port_ids": ["source_port_U1_GND"],
    "permitted_reference_traversals": ["direct"],
    "role": "local_bypass",
    "recommended_capacitance": 1e-7,
    "required_capacitor_count": 1,
    "sharing": "dedicated",
    "max_target_ports_per_capacitor": 1,
    "return_verification": "continuous_region_access_sufficient",
    "policy_id": "raspberry-pi.rp2040-iovdd-v1",
    "policy_version": "1",
    "policy_source": "library",
    "confidence": "library_authoritative",
    "enforcement": "warning",
    "field_provenance": {
      "role": {
        "code": "reviewed_component_policy",
        "source_element_ids": ["source_port_U1_IOVDD3"],
        "policy_id": "raspberry-pi.rp2040-iovdd-v1",
        "policy_version": "1",
        "documentation_url": "https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf",
        "documentation_locator": "section 2.1.2",
        "authority": "trusted_vendor_evidence",
        "confidence": "library_authoritative"
      },
      "recommended_capacitance": {
        "code": "vendor_recommendation",
        "source_element_ids": ["source_port_U1_IOVDD3"],
        "policy_id": "raspberry-pi.rp2040-iovdd-v1",
        "policy_version": "1",
        "documentation_url": "https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf",
        "documentation_locator": "section 2.1.2",
        "authority": "trusted_vendor_evidence",
        "confidence": "library_authoritative"
      }
    },
    "documentation_url": "https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf",
    "documentation_locator": "section 2.1.2",
    "subcircuit_id": "subcircuit_RP2040_CORE"
  },
  {
    "type": "source_decoupling_relation",
    "source_decoupling_relation_id": "source_decoupling_relation_U1_IOVDD3_candidates",
    "source_decoupling_requirement_ids": [
      "source_decoupling_requirement_U1_IOVDD3"
    ],
    "candidates": [
      {
        "capacitor_source_component_id": "source_component_C_IOVDD1",
        "capacitor_supply_source_port_id": "source_port_C_IOVDD1_1",
        "capacitor_return_source_port_id": "source_port_C_IOVDD1_2"
      },
      {
        "capacitor_source_component_id": "source_component_C_IOVDD2",
        "capacitor_supply_source_port_id": "source_port_C_IOVDD2_1",
        "capacitor_return_source_port_id": "source_port_C_IOVDD2_2"
      }
    ],
    "resolution": "candidate_group",
    "relation_source": "structural",
    "confidence": "structural_ambiguous",
    "evidence": [
      {
        "code": "same_supply_and_reference_domains",
        "source_element_ids": [
          "source_net_V3V3",
          "source_net_GND"
        ]
      }
    ],
    "subcircuit_id": "subcircuit_RP2040_CORE"
  }
]
```

No capacitor maximum is present. This proposed record is advisory: it carries
no vendor-derived numeric geometry. The PCB matcher may report topology and
proximity guidance, but an RP2040 remote-bank build failure requires a separate
exact project or reviewed-registry physical policy.

## 14. Detailed architecture

### 14.1 Component-policy materialization

`@tscircuit/core` MUST materialize explicit/library decoupling requirements
during source rendering after target source ports exist.

Legacy mapping:

- `shouldHaveDecouplingCapacitor: true` creates a requirement if no structured
  requirement exists;
- `recommendedDecouplingCapacitorCapacitance` populates
  `recommended_capacitance`;
- `shouldHaveDecouplingCapacitor: false` suppresses lower-tier inference;
- structured `decoupling` fields override corresponding legacy fields;
- conflicting legacy and structured fields emit a property/policy conflict
  diagnostic.

Requirement normalization MUST:

- parse and normalize units;
- validate finite non-negative values;
- pin a policy ID and version;
- resolve target source-port IDs;
- retain field provenance;
- avoid resolving PCB candidates.

### 14.2 Explicit capacitor relations

When both `decouplingFor` and `decouplingTo` resolve:

1. core MUST keep creating the existing two traces;
2. core MUST identify the target source port(s), capacitor supply port, and
   return domain;
3. core MUST serialize an explicit `source_decoupling_relation`; and
4. if no corresponding requirement exists, core MAY create an explicit
   relationship-derived requirement at warning enforcement.

`bypassFor`/`bypassTo` are currently accepted but unconsumed; v1 MUST implement
them as documented aliases with the same trace and relation behavior as
`decouplingFor`/`decouplingTo`. Supplying both alias pairs with conflicting
selectors MUST be an error.

An explicit relation is evidence, not proof that the route satisfies policy.

### 14.3 Compatibility resolver

`@tscircuit/checks` MUST export a pure function:

```ts
interface ResolveDecouplingOptions {
  policyRegistry?: DecouplingPolicyRegistry
  mode?: "off" | "advisory" | "enforce-authoritative" | "strict"
  maxCandidatesPerRequirement?: number
}

interface DecouplingResolution {
  requirements: SourceDecouplingRequirement[]
  relations: SourceDecouplingRelation[]
  sourceDiagnostics: Array<
    SourceDecouplingError | SourceDecouplingWarning
  >
}

declare function resolveDecouplingRequirements(
  circuitJson: AnyCircuitElement[],
  options?: ResolveDecouplingOptions,
): DecouplingResolution
```

The resolver MUST accept:

- new explicit requirement/relation records;
- existing source-port decoupling fields;
- old explicit capacitor traces; and
- Circuit JSON with no new records.

The resolver MUST NOT depend on React component instances, selectors, PCB
placement, or network access.

### 14.4 Aggregate execution and caching

The checks APIs SHOULD accept an optional analysis context without breaking
existing signatures:

```ts
interface CheckContext {
  decoupling?: DecouplingResolution
  pcbCopperGraph?: PcbCopperGraph
}

runAllNetlistChecks(circuitJson, context?)
runAllPlacementChecks(circuitJson, context?)
runAllRoutingChecks(circuitJson, context?)
runAllChecks(circuitJson, context?)
```

`runAllChecks()` MUST compute the resolution once and share it. Direct calls to
category functions MUST lazily compute it when absent. Implementations MAY use a
per-array weak cache, but output MUST not depend on cache state.

Core Board DRC MUST:

1. wait for the same relevant render/routing phases used today;
2. obtain one resolution;
3. optionally insert deduplicated inferred relation/evaluation records;
4. run category checks with shared context; and
5. insert deduplicated diagnostics.

### 14.5 Source connectivity model

Build a deterministic union/find or equivalent connectivity index using:

- `source_trace.connected_source_port_ids`;
- `source_trace.connected_source_net_ids`;
- `subcircuit_connectivity_map_key`;
- exposed subcircuit ports/nets;
- declared internally connected source-port groups; and
- net ties or isolation elements according to their explicit semantics.

The implementation MUST NOT merge domains only because names match.

Connectivity keys MUST preserve board/subcircuit scope. Traversal MAY cross
nested subcircuits through explicit exposed connectivity. It MUST NOT allow an
unrelated same-name net in another scope to satisfy a requirement.

Connectivity has two layers: conductive reachability and semantic domain
identity. Net ties preserve the identity of both domains even though they create
a controlled conductive path. Ferrite beads, inductors, filters, zero-ohm
resistors, power switches, and other series elements are typed traversal edges,
not union operations. A requirement policy MUST explicitly permit each edge
class and direction; otherwise a capacitor across or upstream of that element
does not satisfy a downstream local-bypass requirement. Conditional switches
are not assumed closed. AGND/DGND or isolated returns remain distinct unless
the requirement names the allowed crossing.

Mounted modules MUST expose metadata stating whether each requirement is
`satisfied_internally`, `required_externally`, or `not_exposed`. Internal
connections and `subcircuit_connectivity_map_key` may prove internal
satisfaction only within the module boundary; the outer checker MUST NOT infer
internal decoupling from a shared external rail.

### 14.6 Requirement discovery algorithm

Process all IDs in stable lexical order:

1. Load explicit requirements, explicit negative intent, overrides, and waivers.
2. Load reviewed component-library requirements.
3. Synthesize missing requirements for ports with
   `should_have_decoupling_capacitor === true`.
4. For otherwise unannotated ports with `requires_power === true`, MAY create
   structural advisory requirements only if a supply provider/domain and
   compatible reference domain are semantically identifiable.
5. MAY create name-based authoring suggestions for remaining likely power pins.
6. Apply precedence and scope rules field by field.
7. Validate and pin policy ID/version.
8. Expand requirement groups into logical coverage slots only during matching.

`requires_power` alone MUST NOT invent capacitance, sharing, or a build-failing
distance.

### 14.7 Candidate discovery algorithm

For each requirement:

1. Select `source_component.ftype === "simple_capacitor"`.
2. Require exactly two usable terminals for v1.
3. Determine whether exactly one terminal belongs to the target supply
   connectivity class.
4. Require the other terminal to belong to an acceptable reference class.
5. Respect capacitor polarity.
6. Reject explicit `decouplingRole: "not_decoupling"`.
7. Reject explicit contradictory roles.
8. Apply accepted capacitance rules; voltage-rating qualification is deferred
   from normative v1.
9. Apply subcircuit/board scope.
10. Retain all electrically eligible symmetric candidates up to the configured
    resource limit.

Geometry MUST NOT be used in steps 1–10.

Classification precedence:

```text
explicit capacitor role >
explicit relation >
requirement role/topology >
component-library capacitor metadata >
structural topology/value >
fallback name/value
```

A capacitor between a supply and acceptable reference can be a candidate for
local bypass or bulk depending on policy. Capacitance alone MUST NOT establish
role.

Voltage-rating qualification is non-normative in v1 because this RFC does not
define rail-voltage and derating data. Unknown rating MUST NOT reject a
candidate. If electrically eligible candidates exceed the work bound, the
entire requirement becomes `analysis_resource_limit`/`unverifiable`; the
checker MUST NOT truncate and then emit a fatal deficiency. Spatial pruning is
safe only when a proven lower bound eliminates a candidate.

Contradictory equally scoped explicit intent—for example
`decouplingRole="not_decoupling"` together with `decouplingFor`—is
`policy_conflict` and remains non-evaluable until corrected. It MUST NOT be
resolved by the classification order.

### 14.8 Source-level checks

`checkDecouplingTopology()` MUST run under netlist DRC and report:

- no electrically eligible candidate;
- wrong return/reference;
- definite capacitance mismatch based entirely on authoritative range data;
- insufficient dedicated candidate count;
- unauthorized sharing;
- authoritative policy conflict/malformed policy;
- unresolved legacy maximum; and
- ambiguity where a build-failing conclusion would require an arbitrary choice.

During the initial rollout, tier-3 structural requirements and candidate rules
MUST NOT cause a hard failure. A `should_have_decoupling_capacitor === true`
field alone is authoritative only for the author's existence intent, not for
candidate eligibility. `missing_capacitor` may be an error only when the role,
candidate definition, capacitor-return domain, and any rejection criteria used
are all authoritative. If rejection depends on inferred reference, role,
sharing, range, or geometry, emit warning/`unverifiable`.

If an electrically feasible candidate group exists, source ERC passes even if
the exact one-to-one mapping is symmetric. Physical coverage is decided later.
“Passes” here means only that the modeled source requirement has eligible
coverage candidates. If an authoritative failure depends on selecting one of
multiple unsupported interpretations, the result MUST be `ambiguous` and
non-fatal. If every possible interpretation produces the same definite
failure, the common failure MAY retain authoritative severity.

## 15. PCB geometry and routing algorithm

### 15.1 Pre-route placement advisory

Before routing, a placement check MAY use a pad-to-pad straight-line lower
bound. If this lower bound exceeds an authoritative maximum, no route can pass,
so the check MAY emit an early diagnostic with the same eventual severity.

A lower-bound pass is not a physical pass. The diagnostic/evaluation MUST say
`placement_lower_bound_only`.

### 15.2 Copper graph

Build one weighted graph per physical connectivity class.

Vertices SHOULD include:

- PCB port/pad anchors;
- trace wire endpoints and junctions;
- via endpoints per layer;
- through-pad transitions;
- proven copper-pour contacts;
- connected-region/plane access points; and
- explicit net-tie transitions with correct domain labels.

Edges:

- wire edge weight: centreline Euclidean length;
- via edge: layer transition with geometric vertical length when stackup is
  known, plus a separate via-count attribute;
- pad-internal edge: zero from the resolved PCB-port anchor to the pad copper
  boundary in v1; centre-to-centre placement distance is never substituted;
- pour/plane edge: only when region continuity is geometrically proven.

Graph construction MUST use geometric connectivity and electrical net identity.
Two same-net objects that do not physically touch MUST NOT be connected.
Different-net objects MUST NOT be connected except through explicit allowed
elements.

Coordinates MUST be quantized to a documented tolerance before junction
merging. The implementation SHOULD reuse existing connectivity/geometry
utilities rather than duplicate approximate contact logic.

Collinear overlap, geometric trace intersections, plated through pads,
through/blind/buried vias, thermal spokes, antipads, slots, cutouts, and split
regions MUST be represented according to their actual layer geometry.
Unrepresented thermals or pour topology make the affected return metric
`unverifiable`; shared source-net identity never creates a zero-cost plane
edge.

### 15.3 Path metrics

For each target slot/candidate pair compute:

- shortest supply copper path;
- shortest return copper path to an acceptable target reference port, if
  explicitly representable;
- otherwise access from both ends to the same continuous reference region;
- combined explicit path length;
- supply and return via counts;
- side/layer transitions;
- reference-region continuity; and
- whether all required PCB elements are present and routed.

The supply metric starts at the target PCB-port anchor and ends at the
candidate's supply PCB-port anchor. The explicit return metric starts at the
candidate return anchor and ends at the target's policy-named reference anchor.
Both are copper centreline lengths plus known vertical barrel lengths. The
combined metric is their sum only when both paths are explicitly measured.
Plane-access verification proves only that both anchors contact one continuous
represented region; it does not measure spreading distance, loop area,
impedance, or inductance.

Return state is one of:

```ts
type ReturnVerificationMode =
  | "return_path_measured"
  | "return_access_verified"
  | "return_unverifiable"
```

`return_access_verified` MUST NOT fabricate an in-plane path length. A combined
length constraint cannot pass from access-only data unless the policy explicitly
defines access verification as sufficient.

The existing fixed “1.6 mm per via” generic trace heuristic MUST NOT be treated
as decoupling inductance. Use actual stackup/board geometry for path length when
available and enforce via count independently. If vertical geometry is absent,
report via count and mark vertical length unavailable.

A return check requires both authoritative `capacitor_return_domain_ids` and at
least one authoritative `target_reference_source_port_id`. With multiple
target endpoints, the policy either names the permitted exact set or the
checker evaluates every named endpoint and uses global matching feasibility;
it never chooses by array order. Traversal is limited to the typed edges listed
in `permitted_reference_traversals`. If endpoints or traversal semantics are
missing, return and combined checks are `unverifiable` and non-fatal; supply
checks may still run. V1 strict return enforcement excludes topologies that
cannot be expressed by these fields.

Branch/feed-through ordering is deferred from v1 enforcement because no stable
API defines “capacitor before shared trunk.” When shortest path is insufficient
to decide a common-trunk layout, v1 reports
`unsupported_branch_topology`/`unverifiable` non-fatally. A later RFC may add a
typed branch topology constraint with exact endpoints.

### 15.4 Feasible edge construction

Create a bipartite edge between a requirement slot and candidate capacitor only
when:

1. source electrical eligibility passes;
2. required PCB elements exist;
3. a connected supply path exists;
4. all authoritative measurable geometric constraints pass;
5. same-side/reference conditions pass; and
6. any required but unavailable metric is handled according to policy.

Each edge stores its measured metrics and failure reasons. Failed edges remain
available for nearest-alternative diagnostics but are not matching edges.

Straight-line lower bounds and a spatial index SHOULD prune impossible
candidates before shortest-path searches.

### 15.5 Bank and sharing solver

For dedicated/local requirements:

- left nodes are requirement slots;
- right nodes are eligible capacitors;
- capacitor capacity comes from policy; dedicated policy supplies capacity one;
- an exact policy-authorized shared capacitor is usable only for the named
  target-port group, up to its declared capacity; and
- edges are the feasible edges above.

Use deterministic maximum bipartite matching. Hopcroft–Karp is sufficient for
unit capacity; node expansion or bounded flow handles declared sharing.

For aggregate/bulk requirements, use a bounded capacity/value flow or a
separate deterministic aggregate-capacitance solver. Nominal values MUST NOT
be summed unless the policy defines accepted role, tolerance, DC-bias/derating
treatment, and whether one physical capacitor may satisfy another role. V1 MAY
defer aggregate optimization while supporting explicitly selected bulk
capacitors.

Outcomes:

- full feasible matching: covered;
- no full matching: deficient;
- source candidates exist but geometry is unavailable: unverifiable/unrouted;
- correctness depends on choosing among equal source interpretations:
  ambiguous.

A remote bank fails because too few candidate edges satisfy locality for all
slots, not because the components visually form a row.

The solver MUST search global feasibility; it MUST NOT fail because a greedy or
display-only pairing failed while another allowed pairing succeeds. Multiple
equally valid matchings yield `covered` plus a symmetric candidate group, not a
claim of unique semantic identity. A full matching proves only feasible
modeled count/value/role/path coverage—not PDN adequacy.

The error SHOULD report a deterministic deficient subset: affected target pins,
candidate set, number of required slots, number feasible, and shortest failing
alternatives.

### 15.6 Determinism

The implementation MUST:

- sort elements by stable primary ID;
- use stable connectivity-class identifiers;
- preserve symmetric candidate groups;
- use stable tie-breakers only for display assignments;
- define `actual <= limit + epsilon` as pass;
- derive one distance epsilon from the Circuit JSON coordinate unit, router
  output precision, and cross-runtime golden tests; record it in checker
  metadata rather than standardizing an arbitrary universal value;
- derive diagnostic IDs from stable semantic inputs; and
- produce byte-for-byte equivalent diagnostics under input array permutation.

Correctness MUST NOT depend on which canonical maximum matching is displayed.

## 16. DRC integration

### 16.1 Netlist category

Add `checkDecouplingTopology()` to `runAllNetlistChecks()`.

It runs when:

- general DRC is enabled; and
- netlist DRC is enabled.

It runs even when PCB or routing is disabled.

### 16.2 Placement category

Add `checkDecouplingPlacementLowerBounds()` to
`runAllPlacementChecks()` when placement advisory is enabled.

It runs only when PCB and placement DRC are enabled.

### 16.3 Routing category

Add `checkPcbDecoupling()` to `runAllRoutingChecks()`.

It runs after routing effects and child subcircuits settle, under the existing
PCB/routing DRC gates. It MUST be included in `runAllChecks()`.

The generic `checkPcbTraceLengths()` remains unchanged for clocks, crystals,
buses, explicit generic trace limits, and compatibility behavior.

### 16.4 Disabled or missing geometry

- PCB disabled: source ERC runs; PCB execution status is `not_checked`.
- Routing disabled: source ERC and placement advisory may run; route status is
  `not_checked`.
- Required PCB port missing: physical evaluation is `unverifiable` and
  non-fatal in v1. Strict mode MAY separately fail a typed tool/schema
  integrity error only when the port is contractually required and its absence
  is proven to be a generation/schema defect; that integrity failure MUST NOT
  be reported as board electrical noncompliance.
- Copper pour/stackup absent: enforce measurable supply constraints; report
  unverified return facts explicitly.

The absence of a physical check MUST NOT be represented as a pass.

### 16.5 Dedupe and category filters

New diagnostics MUST participate in existing dedupe logic. Circuit JSON util
categorization MUST make:

- `source_decoupling_*` subject to `--ignore-netlist-drc`;
- placement lower-bound diagnostics subject to `--ignore-placement-drc`;
- `pcb_decoupling_*` subject to `--ignore-routing-drc`.

A targeted waiver is preferred to disabling a whole category.

## 17. CLI integration and enforcement

### 17.1 Reporting

`tsci build` MUST:

- print the new diagnostics with target/capacitor selectors;
- include diagnostic counts by category and severity;
- write all diagnostics to Circuit JSON;
- indicate whether analysis used project-installed or CLI-fallback runtime; and
- print core/checks/policy versions in verbose build metadata.

### 17.2 Failure policy

Implement:

```ts
type DrcFailurePolicy = "none" | "errors" | "errors-and-warnings"
```

Exit rules:

| Policy | Non-ignored errors | Non-ignored warnings |
| --- | --- | --- |
| `none` | report, exit 0 | report, exit 0 |
| `errors` | exit 1 | report, exit 0 |
| `errors-and-warnings` | exit 1 | exit 1 |

Fatal generation errors continue to exit nonzero independently.

During migration:

- existing projects default to `none`;
- `tsci check decoupling` is strict for definite decoupling errors;
- new CI scaffolds SHOULD use `errors`;
- after telemetry and an announced release boundary, maintainers MAY make
  `errors` the build default.

This staged policy is deliberate because changing all existing DRC errors from
exit 0 to exit 1 is broader than decoupling.

Successfully generated board artifacts, Circuit JSON, active diagnostics, and
suppression reports MUST be written before strict DRC returns a nonzero status.
`tsci check decoupling` filters out unrelated DRC and counts only active
decoupling diagnostics. `--ignore-warnings` removes active warnings from
`errors-and-warnings` failure calculation but does not hide errors or
suppression audit records. `--ignore-netlist-drc` affects source decoupling
electrical diagnostics only; `--ignore-routing-drc` affects PCB decoupling
diagnostics only. Neither category ignore may suppress schema/policy
compatibility or analysis-resource errors, which are tool-integrity failures,
not waivable electrical DRC.

| Finding after waiver/category resolution | `none` | `errors` | `errors-and-warnings` |
| --- | ---: | ---: | ---: |
| Active error | 0 | 1 | 1 |
| Active warning | 0 | 0 | 1 |
| Warning with `--ignore-warnings` | 0 | 0 | 0 |
| Validly waived/suppressed finding | 0 | 0 | 0 |
| Expired/mismatched waiver; active error remains | 0 | 1 | 1 |
| Capability/policy incompatibility in strict/check mode | n/a | 1 | 1 |

### 17.3 Packed-artifact release test

A release MUST NOT ship unless a black-box test against the packed CLI artifact:

1. uses a project-installed current tscircuit and verifies decoupling output;
2. uses the fallback runtime and verifies equivalent behavior;
3. exceeds generic `source_trace.max_length` and observes the generic warning;
4. violates a known decoupling policy without a capacitor maximum;
5. confirms default and strict exit codes;
6. confirms ignore-category behavior; and
7. records executed core/checks versions.

This is the release gate for the version skew observed in the installed CLI.

## 18. Diagnostics and user experience

Every diagnostic MUST include:

- component refdes and target pin name/number;
- supply and reference domains;
- role;
- policy ID, version, source, confidence, and documentation;
- required count/value/sharing;
- candidate capacitor refdeses;
- measured and maximum metrics;
- return verification mode;
- why candidates were rejected;
- corrective suggestions; and
- stable waiver key.

Example:

```text
PCB decoupling path too long [supply_path_too_long]

U1.IOVDD3 is checked under project.example-layout-v1, an exact project-trusted
engineering policy. The shortest electrically eligible assignment is
C_IOVDD3: supply path 4.72 mm (project maximum 2.00 mm), 0 supply vias. Both
ends access one represented continuous GND region; in-plane return length was
not measured.

Move an eligible 100 nF capacitor closer to U1.IOVDD3, shorten its connected
copper path, or apply a scoped documented override. Policy source: component
project allowlist. This 2 mm example is not an RP2040 vendor requirement.
Waiver key: decoupling/U1/IOVDD3/supply_path_too_long/v1
```

Bank example:

```text
PCB decoupling bank cannot cover U1 IOVDD_LOCAL [bank_coverage_deficient]

6 dedicated local slots require 6 feasible capacitors. 6 electrically eligible
100 nF capacitors exist, but only 2 can be assigned within the physical policy.
Uncovered pins: IOVDD2, IOVDD4, IOVDD5, IOVDD6.
Candidates: C_IOVDD1..C_IOVDD6.
```

Ambiguity example:

```text
Decoupling relationship is ambiguous [assignment_ambiguous]

U1.VDD1 and U1.VDD2 share a supply domain with C1 and C2. No policy authorizes
sharing and source topology does not distinguish the pairs. Physical matching
will test whether complete coverage exists. Add explicit relationship metadata
only if the intended assignment matters.
```

## 19. Default policy

The goal is no per-capacitor maximum, not no policy.

### 19.1 Resolution order

Numeric and semantic policy is resolved from:

1. explicit relation/override;
2. component-library exact pin/group policy;
3. component-family/package policy;
4. project default policy;
5. versioned tscircuit fallback.

### 19.2 Normative generic behavior

There is no universal error-level millimetre limit.

The initial generic policy `tscircuit.digital-local-v1`:

- MAY identify a likely local bypass requirement only from structural metadata;
- uses existing recommended capacitance when present;
- requires supply-to-acceptable-reference topology;
- treats each target as dedicated unless sharing is authoritative;
- MAY provide a documented proximity threshold for advisory warnings;
- MUST NOT emit an error solely from that generic threshold; and
- MUST record its policy version and fallback confidence.

A `missing_capacitor` error is allowed only under §14.8 when role, candidate
definition, return domain, and every rejection criterion used are
authoritative. `should_have_decoupling_capacitor === true` alone remains a
warning/`unverifiable`; it cannot make inferred candidate or reference
semantics build-failing.

An authoritative component policy can automatically enforce a numeric physical
limit on every board using the part, with no capacitor annotation. A project
policy can do the same across a project.

### 19.3 Policy registry

Policies MUST be static validated data, not executable callbacks:

```ts
interface DecouplingPolicyDefinition {
  policyId: string
  policyVersion: string
  appliesTo?: {
    manufacturerPartNumbers?: string[]
    packageNames?: string[]
    targetGroups?: string[]
  }
  requirement: Omit<
    DecouplingRequirementProp,
    "policyId" | "documentationUrl" | "documentationRevision" |
      "documentationLocator" | "documentationDigest"
  >
  documentationUrl?: string
  documentationRevision?: string
  documentationLocator?: string
  documentationDigest?: string
  review?: {
    reviewedBy: string[]
    reviewedAt: string
  }
}
```

Builds MUST NOT fetch policy updates. The installed policy version determines
the result. A policy change requires a package/version change and changelog.
`review.reviewedBy` and documentation fields are provenance only. The resolver
computes trust from the external reviewed-registry manifest or the project's
exact trusted-policy allowlist; neither authoring props nor input Circuit JSON
may self-assert trust. Trust is evaluated per field, so a vendor-supported
100 nF recommendation cannot elevate a tscircuit- or project-authored geometry
limit. Fatal vendor-derived fields require document identifier, actual
revision/date when published, locator, and digest or immutable archive.

## 20. `maxDecouplingTraceLength` compatibility

`maxDecouplingTraceLength` is preserved but no longer recommended as the main
API.

### 20.1 Migration semantics

When the capacitor has an explicit or uniquely resolved relation:

- the value becomes an explicit
  `max_supply_path_length` constraint on that relation/requirement;
- it participates in strictest-constraint composition;
- the relation records provenance code `legacy_capacitor_max_length`; and
- during compatibility, core MUST continue assigning generic
  `source_trace.max_length` to preserve existing warnings.

When no target relation can be resolved:

- existing generic propagation MUST remain for the compatibility window;
- emit `legacy_limit_unbound` migration warning;
- do not claim the value validates decoupling; and
- suggest pin/library policy or explicit `decouplingFor`.

### 20.2 Deprecation policy

- The prop and legacy both-leg propagation remain accepted for at least two
  published CLI minor releases and no less than 180 days after authoritative
  decoupling enforcement first ships.
- Removal is not authorized by this RFC.
- Generic `<trace maxLength>` and `source_trace.max_length` are not deprecated.
- New documentation SHOULD teach pin/library policies.
- New generated components SHOULD NOT add per-capacitor maxima.
- A future breaking RFC MAY remove the generic capacitor-to-both-traces
  propagation after migration data shows it is safe.

## 21. Waivers and overrides

Illustrative config:

```json
{
  "drc": {
    "waivers": [
      {
        "waiverId": "waiver_DR_184",
        "waiverKey": "decoupling/U1/IOVDD3/supply_path_too_long/v1",
        "policyId": "project.example-layout-v1",
        "policyVersion": "1",
        "scope": {
          "sourceComponentId": "source_component_U1",
          "sourcePortIds": ["source_port_U1_IOVDD3"],
          "diagnosticCode": "supply_path_too_long"
        },
        "author": "board-review@example.invalid",
        "reason": "Vendor-reviewed shared capacitor layout, review DR-184",
        "expires": "2027-01-31"
      }
    ]
  }
}
```

A waiver MUST:

- match a stable waiver key;
- name an ID, author, exact policy ID/version, diagnostic code, and target scope;
- include a non-empty reason;
- be retained in the build report;
- not suppress unrelated diagnostics;
- optionally expire; and
- be invalidated on any exact policy-version change unless it explicitly names
  a policy-defined compatible version range.

Broad category ignores remain supported but SHOULD be reported as broad
suppression.

## 22. Backward compatibility

1. New Circuit JSON elements and fields require a coordinated schema upgrade;
   they are not backward compatible with old strict `AnyCircuitElement` unions.
2. Old Circuit JSON without requirement/relation records remains analyzable from
   existing source-port metadata.
3. Readers that accept `AnyCircuitElement` MUST be updated to accept and
   round-trip the new records before a producer emits them. Producers MUST
   capability-check schema versions rather than assume unknown types are
   ignored.
4. Existing `decouplingFor`/`decouplingTo` continue to create traces.
5. Existing capacitor maximum behavior remains during the compatibility window.
6. Existing generic trace and crystal checks remain unchanged.
7. Routing-disabled and PCB-disabled builds gain explicit `not_checked` state,
   not new false passes.
8. Legacy projects receive advisory diagnostics before new errors are enabled.
9. Policy IDs/versions make changed outcomes attributable.
10. CLI strict failure is opt-in initially.

### 22.1 Capability negotiation and partial upgrades

Build metadata MUST contain this machine-readable manifest before new records
are emitted or checked:

```json
{
  "decouplingCapabilities": {
    "schema": {
      "package": "circuit-json",
      "version": "resolved-version",
      "features": [
        "source_decoupling_requirement@1",
        "source_decoupling_relation@1",
        "decoupling_diagnostic@1"
      ]
    },
    "producer": {
      "package": "@tscircuit/core",
      "version": "resolved-version",
      "features": ["decoupling_materialization@1"]
    },
    "checker": {
      "package": "@tscircuit/checks",
      "version": "resolved-version",
      "features": ["decoupling_source@1", "decoupling_pcb@1"]
    },
    "cli": {
      "package": "@tscircuit/cli",
      "version": "resolved-version",
      "runtimeSource": "project-installed",
      "features": ["effective_drc_severity@1", "strict_drc_exit@1"]
    }
  }
}
```

The first package releases implementing each literal feature above form the
minimum compatible set and MUST be published together in the release manifest;
version comparison alone MUST NOT substitute for feature presence. Before
strict analysis, CLI validates the exact active project/fallback manifest:

| Combination | Required result |
| --- | --- |
| New core + schema lacking new element features | Core suppresses new record emission; explicit compatibility error; no compliance claim |
| New core + old checks | Compatibility error; strict/check exit 1; no compliance claim |
| Old core + new checks | Supported only through legacy ephemeral resolution, advisory; no physical compliance claim requiring missing records |
| New project runtime + old fallback CLI/checker | CLI must use the project runtime with all features or emit compatibility error; never silently fall back |
| Utility/parser without round-trip features | Release-blocking compatibility error before that utility can strip records |
| All required features present | Analysis may run at the trust/severity allowed by policy |

Compatibility errors are tool-integrity diagnostics outside netlist/routing
ignore categories. A strict build fails them before reporting decoupling
compliance. Packed-CLI tests MUST exercise every supported row and duplicate
installed Circuit JSON parsers. Verbose output MUST identify the actual
installed-artifact runtime; upstream-head lock provenance is reported
separately.

## 23. Rollout plan

### Phase 0: baseline and release alignment

Owners: `tscircuit/checks`, `tscircuit/cli`, `tscircuit/tscircuit`

- Lock a regression proving `checkPcbTraceLengths` is in aggregate routing DRC.
- Add packed-CLI tests for project and fallback runtimes.
- Expose executed core/checks versions in verbose output/build metadata.
- Align CLI's bundled libonly dependency with released checks/core.
- Publish current DRC exit behavior.

Exit criterion: source tests and packed CLI show the same aggregate behavior.

### Phase 1: Circuit JSON and props schema

Owners: `tscircuit/circuit-json`, `tscircuit/props`

- Add requirement, relation, optional PCB evaluation, and four diagnostic
  schemas.
- Extend `AnyCircuitElement`.
- Add structured pin decoupling and optional capacitor role props.
- Add Zod validation, generated docs, and compatibility type tests.
- Add policy/waiver data schemas.

Exit criterion: parse/serialize/round-trip golden tests pass and old fixtures
remain valid.

### Phase 2: core materialization and compatibility

Owner: `tscircuit/core`

- Serialize structured and legacy pin requirements.
- Serialize explicit relations for `decouplingFor`/`decouplingTo`.
- Implement bypass aliases or document their migration.
- Translate bound legacy maxima to relationship constraints while dual-writing
  generic max metadata during compatibility.
- Add stable IDs and provenance.

Exit criterion: explicit/legacy TSX produces deterministic new records without
changing existing traces.

### Phase 3: source resolver and ERC

Owner: `tscircuit/checks`

- Implement connectivity indexing and pure resolver.
- Implement role/value/reference/candidate logic.
- Implement source topology diagnostics.
- Add context sharing in aggregate checks.
- Keep new diagnostics advisory behind the feature mode initially.

Exit criterion: direct, named-net, nested-subcircuit, wrong-reference,
capacitance, dedicated/shared, and permutation tests pass.

### Phase 4: PCB graph and physical DRC

Owners: `tscircuit/checks`, with reusable geometry support from
`@tscircuit/circuit-json-util` or the relevant copper/connectivity package

- Build deterministic copper/reference region graph.
- Implement placement lower bound.
- Implement supply/return metrics and explicit unverifiable modes.
- Implement deterministic bank matching and deficient-subset diagnostics.
- Add checks to placement/routing aggregates.

Exit criterion: local, detoured, via, plane-access, disconnected, remote-bank,
and routing-disabled golden tests pass.

### Phase 5: CLI enforcement and reports

Owner: `tscircuit/cli`

- Add failure policy config/flags.
- Add `tsci check decoupling`.
- Add targeted waivers.
- Add JSON/human reports and diagnostic summaries.
- Add packed-artifact release test.
- Enable `"errors"` in new CI scaffolds.

Exit criterion: strict mode returns 1 for a definite unwaived decoupling error
and 0 after correction without adding a capacitor maximum.

### Phase 6: reference component policies

Owners: reviewed component libraries, including this `@tscircuit/common`
repository

- Add RP2040 pin/group policies as the reference implementation.
- Represent IOVDD, documented USB_VDD sharing, VREG input/output, and analog
  supply roles separately.
- Replace current source-trace-count-only regression with logical and physical
  decoupling assertions.
- Add positive distributed placement and negative remote-bank fixtures.

Exit criterion: the bad RP2040 bank fails and the corrected layout passes
without `maxDecouplingTraceLength`.

### Phase 7: placement/routing consumers

Owners: `tscircuit/matchpack`, autorouter packages

- Consume requirements/relations as placement priorities.
- Keep semantic satisfaction in checks, not placement.
- Optionally route decoupling branches before bulk distribution.

Relevant upstream issue:
[`matchpack#15`](https://github.com/tscircuit/matchpack/issues/15).

This phase is not required for v1 enforcement.

## 24. Observability

### 24.1 Local reports

`tsci build --verbose` SHOULD report:

- project `tscircuit`, core, checks, CLI, Circuit JSON, and policy versions;
- count of requirements by precedence/confidence;
- unique, candidate-group, ambiguous, unresolved relation counts;
- covered/deficient/unverifiable/not-checked counts;
- checker duration and graph sizes;
- ignored diagnostics and waivers by category; and
- whether the userland or fallback runtime executed.

`tsci check decoupling --json` SHOULD emit deterministic machine-readable
analysis suitable for CI artifacts.

### 24.2 Optional ecosystem telemetry

Telemetry MUST be opt-in and privacy-preserving. It MAY include:

- aggregate counts by policy ID/version and resolution state;
- diagnostic/waiver counts;
- checker time and memory buckets; and
- user-submitted false-positive categories.

It MUST NOT include source code, Circuit JSON, coordinates, component/net names,
manufacturer part numbers, project identity, or raw diagnostic text by default.

### 24.3 Rollout quality gates

Before authoritative errors become broadly enabled, evaluate a consented public
corpus for:

- requirement-discovery precision/recall;
- supply/return terminal-classification precision;
- unresolved/ambiguous bank rate;
- percentage with sufficient PCB geometry;
- p50/p95/p99 runtime and memory;
- waiver/suppression rate; and
- manually confirmed false positives.

Authoritative-policy error rollout requires near-zero known false positives.

## 25. Performance

Let:

- `V_s`, `E_s`: source connectivity graph size;
- `P`: requirement slots;
- `C`: eligible capacitors;
- `V_p`, `E_p`: PCB copper graph size;
- `E_c`: feasible requirement/candidate edges.

Expected complexity:

- source indexing: `O(V_s + E_s)`;
- candidate bucketing: expected `O(P + C)`;
- candidate compatibility: expected `O(E_c)`, worst `O(P*C)` on one rail;
- shortest paths: approximately
  `O(min(P,C) * (E_p + V_p log V_p))` before caching;
- unit matching: `O(E_c * sqrt(P + C))`;
- shared/value-aware coverage: bounded flow on a per-domain subgraph.

Required mitigations:

- partition by resolved connectivity domain and role; board/subcircuit
  boundaries are optimization hints only and MUST NOT sever explicitly exposed
  cross-boundary connectivity;
- reject role/value/domain mismatches before geometry;
- use spatial lower bounds to prune;
- cache shortest-path trees by PCB port/domain;
- cap candidate count and diagnostic list size;
- validate graph/flow capacities;
- emit a resource-limit/unverifiable diagnostic rather than hang; and
- benchmark large shared rails.

The checker SHOULD target less than 10% additional p95 build time on the public
corpus before default enablement. Exact budget may be revised from measured
baseline.

## 26. Security and reliability

1. Builds MUST remain offline and hermetic.
2. Policy data MUST be schema-validated and non-executable.
3. All numbers MUST be finite, non-negative, and within documented bounds.
4. Graph vertices/edges, matching capacities, candidate counts, evidence lists,
   and diagnostic text MUST be bounded.
5. Names and evidence rendered in terminals, HTML, or SVG MUST be escaped.
6. Build-failing inference MUST be deterministic and local; no remote service,
   LLM, or probabilistic model is permitted.
7. Malformed authoritative policy MUST fail closed as a schema/policy error.
8. Missing optional geometry MUST fail uncertain, not falsely safe.
9. A return path that was not measured MUST NOT be reported as passed.
10. Waivers and overrides MUST be auditable.
11. Policy/checker versions MUST be captured for reproducibility.
12. Fuzzed/malicious Circuit JSON MUST not cause unbounded work or crashes.

## 27. Test plan

### 27.1 Circuit JSON and props

- parse/serialize every new record and diagnostic;
- validate unit normalization;
- reject NaN, infinity, negatives, invalid ranges, invalid enums, and excessive
  counts;
- accept old Circuit JSON;
- preserve unknown additive fields where current conventions require;
- stable IDs survive unrelated element insertion;
- structured and legacy pin props normalize consistently;
- explicit false suppresses lower-tier inference.

### 27.2 Core

- pin policy serializes to exact source ports;
- pin-group policy is deterministic;
- `decouplingFor` produces old traces plus explicit relation;
- `bypassFor` behavior is defined;
- bound legacy maximum produces a relationship constraint;
- unbound legacy maximum retains generic behavior plus migration warning;
- no inferred relationship depends on PCB placement.

### 27.3 Source resolver/ERC

- direct port-to-port decoupling;
- separate pin-to-net and capacitor-to-net traces;
- exposed nets across nested subcircuits;
- internal power-port groups;
- correct non-polarized terminal orientation;
- polarized terminal correctness;
- wrong ground/reference domain;
- analog and digital domain separation;
- capacitor between two non-reference rails excluded;
- coupling, crystal-load, bootstrap, feedback, and filter capacitors excluded;
- local versus bulk roles;
- accepted range and recommendation behavior;
- explicit > library > structural > fallback precedence;
- waiver and negative-intent precedence;
- conflict diagnostic for equal authoritative policies;
- no pin metadata yields only fallback authoring advice;
- source array permutations produce identical output.

### 27.4 Matching

- one cap/one pin;
- six symmetric caps/six pins pass independent of array order;
- remote six-cap bank fails with deterministic deficient subset;
- one capacitor cannot cover six dedicated slots;
- exact library-authorized shared capacitor covers only permitted ports;
- shared capacitor does not cover another group;
- candidate capacity is bounded;
- mixed local and bulk requirements;
- equal candidates remain a source candidate group;
- unrelated closer capacitor on another rail has no effect;
- matching display tie-break does not change correctness.

### 27.5 PCB geometry

- same-layer path below, at, and above limit;
- detour longer than Euclidean lower bound;
- branches choose true shortest connected copper path;
- named but physically disconnected copper fails;
- one and multiple vias with stackup;
- missing stackup reports known via count/unavailable length;
- direct return trace;
- continuous reference pour access;
- split/disconnected reference region;
- missing pour geometry is unverifiable, not pass;
- through-hole and through-pad transitions;
- same-side constraint;
- PCB/routing disabled produce `not_checked`;
- distance epsilon boundary.

### 27.6 Aggregate and CLI

- source check included in `runAllNetlistChecks` and `runAllChecks`;
- placement advisory included under placement gates;
- PCB check included in `runAllRoutingChecks` and `runAllChecks`;
- category ignores affect only their category;
- targeted waiver suppresses only matching diagnostic;
- default legacy build exit behavior follows migration policy;
- strict mode exits 1 on errors;
- errors-and-warnings exits 1 on warnings;
- correction exits 0;
- packed CLI and project runtime agree;
- verbose output reports executed versions.

### 27.7 RP2040 golden tests

- normal 100 nF IOVDD coverage;
- documented USB_VDD/IOVDD sharing exception;
- VREG input/output 1 µF roles;
- analog supply/reference after the intended filter;
- vendor-supported value/sharing facts are checked separately from geometry;
- all local capacitors moved into a remote row: advisory under vendor metadata,
  or error only when the fixture opts into an exact trusted project geometry
  policy;
- distributed/short-path correction clears that same policy result;
- no test adds `maxDecouplingTraceLength`;
- existing crystal/generic trace checks remain unchanged.

### 27.8 Robustness/property testing

- randomized Circuit JSON ordering;
- repeated execution byte equality;
- malformed/fuzzed connectivity never crashes;
- large single rail stays within resource budget;
- adversarial names are safely escaped;
- policy version changes only expected IDs/results;
- graph construction cannot cross wrong nets;
- expired waivers are reported and not applied.

## 28. Acceptance criteria

The RFC is implemented when all of the following are true:

1. A marked power pin with a correctly valued local capacitor passes with no
   capacitor maximum prop.
2. A pin with a complete trusted role/candidate/reference policy and no
   eligible capacitor emits a source decoupling error; a legacy
   `shouldHave...`-only case remains warning/unverifiable.
3. A capacitor on the supply rail but wrong reference domain fails only when
   both domain and traversal semantics are authoritative; otherwise it is
   warning/unverifiable.
4. Capacitance outside an authoritative accepted range produces the specified
   diagnostic.
5. Shared named-net topology is recognized without direct pin-to-cap traces.
6. A symmetric many-to-many source topology remains a candidate group.
7. A feasible distributed bank passes through matching.
8. A remote bank fails because full physical matching is impossible.
9. An authorized exact shared capacitor passes; unauthorized sharing fails.
10. Missing routing/pour geometry is reported as not checked/unverifiable, not
    pass.
11. Existing `decouplingFor` gains explicit semantics without losing traces.
12. Existing `maxDecouplingTraceLength` remains functional as a compatibility
    override.
13. Correcting placement/routing clears the violation without adding
    `maxDecouplingTraceLength`.
14. New source and PCB checks run through normal aggregate DRC.
15. `tsci check decoupling` returns nonzero for definite unwaived errors.
16. `tsci build --strict-drc` returns nonzero for non-ignored errors.
17. Default build exit behavior follows the documented rollout mode.
18. The packed CLI artifact passes the same integration fixture as source.
19. Outputs are deterministic under input permutation.
20. RP2040 negative and positive golden fixtures pass the expected outcomes.

## 29. Open questions

No open question below may be used to enable a build-failing rule. Until
resolved by schema and tests, its affected result is advisory,
`unverifiable`, or `not_checked`.

1. Should inferred relations and PCB evaluations be serialized by default or
   only under `serializeAnalysis`?
2. Which package should own the long-term reusable resolver:
   `@tscircuit/checks`, `@tscircuit/circuit-json-util`, or a new
   `@tscircuit/decoupling` package?
3. Which existing package should expose copper-pour connected-region graphs?
4. What nominal capacitance tolerance is allowed when a library supplies only a
   recommendation, not a range?
5. What exact Circuit JSON schema should mounted modules use for the three
   already-defined states `satisfied_internally`, `required_externally`, and
   `not_exposed`?
6. How should regulator stability policies encode ESR/technology requirements
   without overpromising electrical validation?
7. What is the first generic advisory distance, if any, for
    `tscircuit.digital-local-v1`?
8. When may CLI `drcFailurePolicy: "errors"` become the default for ordinary
    builds rather than only new CI scaffolds?
9. When can the legacy propagation of a capacitor maximum to both generic
    traces be removed?

## 30. Rejected shortcuts and implementation guardrails

Implementers MUST NOT:

- match candidates by nearest PCB component before electrical qualification;
- enforce from `VDD`/`GND` spelling alone;
- constrain every trace on a shared power net;
- pick one arbitrary capacitor in a symmetric bank and call it truth;
- report a return loop as verified when only supply path was measured;
- make policy updates network-dependent;
- hide effective policy or version from the user;
- make an `_error` and assume current CLI will fail automatically;
- test only source repositories and not the packed CLI; or
- remove legacy props as part of the first implementation.

### 30.1 Final-review disposition

This table disposes every numbered blocker/major/minor finding in
`FINAL_RFC_TECHNICAL_REVIEW.md` (1–20) and the overlapping evidence-audit
findings. “Deferred” means the feature is outside enforcing v1 and MUST yield a
non-fatal `unverifiable`/`not_checked` result; it is not permission to guess.

| # | Disposition | Normative resolution |
| ---: | --- | --- |
| 1 | Resolved | Trust is resolver output from an external pinned registry/project allowlist; author metadata cannot self-promote. |
| 2 | Resolved | RP2040 vendor metadata is advisory and contains no invented range/2 mm/zero-via error rule; any example geometry is explicitly project-owned. |
| 3 | Resolved | Return domains and target reference ports are separate; missing endpoints/traversal make return/combined non-fatal `unverifiable`. |
| 4 | Resolved | Waivers run before classification; suppressed findings are not active `_error` records and do not affect exit status. |
| 5 | Resolved | §22.1 defines a feature manifest, partial-upgrade matrix, strict incompatibility failure, and packed-artifact gate. |
| 6 | Resolved | `shouldHave...` alone and tier-3 candidate/reference inference cannot hard-fail initial rollout. |
| 7 | Resolved | Relation candidates are validated ID tuples, not positional arrays. |
| 8 | Resolved | Namespaced authoring groups normalize to stable exact source-port IDs with merge/conflict/cardinality invariants. |
| 9 | Deferred | Common-trunk branch-order enforcement is excluded from v1; unsupported cases are non-fatal until a typed endpoint-based RFC exists. |
| 10 | Resolved | `return_verification` states whether explicit path, continuous-region access, or no return check is required. |
| 11 | Resolved | Relation provenance is `relation_source`; requirement policy provenance remains separate. |
| 12 | Resolved | Execution and coverage are separate; canonical disabled state is `not_checked`. |
| 13 | Resolved | Diagnostics carry original/effective severity, deficient targets, and bounded rejected-candidate evidence. |
| 14 | Resolved | Candidate overflow invalidates the whole result as resource-limit/unverifiable; truncated sets cannot fail coverage. |
| 15 | Resolved | Contradictory equally scoped explicit role/relation intent is a conflict, not precedence. |
| 16 | Resolved | §17 specifies artifact timing, check filtering, ignore behavior, compatibility categories, and exit truth table. |
| 17 | Deferred | Voltage-rating qualification is removed from normative v1; unknown voltage never rejects a candidate. |
| 18 | Resolved | Document revision, locator, and digest are separate; a section is never stored as a revision. |
| 19 | Resolved | Waivers bind exact policy versions and invalidate on any change unless an explicit compatible range is declared. |
| 20 | Resolved | Performance partitioning follows resolved connectivity and cannot sever exposed cross-subcircuit paths. |

Evidence-audit M1/M2 and m1–m3 are covered respectively by rows 2, 1/field
authority, §5.4 artifact-versus-head wording, row 18, and row 12. Accordingly,
18 findings are resolved and 2 are explicitly deferred outside build-failing
v1.

## 31. Primary-source index

### tscircuit implementation history

- Pin metadata intent:
  [`props` PR #603](https://github.com/tscircuit/props/pull/603)
- Pin attribute source:
  [`pinAttributeMap.ts`](https://github.com/tscircuit/props/blob/0aa7ff141dbda2fc7d1470f6919660035603dcfa/lib/common/pinAttributeMap.ts)
- Circuit JSON pin fields:
  [`circuit-json` PR #493](https://github.com/tscircuit/circuit-json/pull/493)
- Core pin serialization:
  [`core` PR #2120](https://github.com/tscircuit/core/pull/2120)
- Capacitor props:
  [`capacitor.ts`](https://github.com/tscircuit/props/blob/0aa7ff141dbda2fc7d1470f6919660035603dcfa/lib/components/capacitor.ts)
- Capacitor core behavior:
  [`Capacitor.ts`](https://github.com/tscircuit/core/blob/e6322181621fd8c13922fbea559504918cf415ae/lib/components/normal-components/Capacitor.ts)
- Trace maximum schema:
  [`source_trace.ts`](https://github.com/tscircuit/circuit-json/blob/836bcdf4af71a4cbcf6a2bad5d2ba7f51bedec55/src/source/source_trace.ts)
- Generic trace length warning:
  [`checks` PR #174](https://github.com/tscircuit/checks/pull/174)
- Generic trace checker:
  [`check-pcb-trace-lengths.ts`](https://github.com/tscircuit/checks/blob/efc69871888f2ff3f392f11070fb1b0ada9e2f19/lib/check-pcb-trace-lengths.ts)
- Aggregate checks:
  [`run-all-checks.ts`](https://github.com/tscircuit/checks/blob/efc69871888f2ff3f392f11070fb1b0ada9e2f19/lib/run-all-checks.ts)
- Metadata-driven ERC precedent:
  [`check-pin-must-be-connected.ts`](https://github.com/tscircuit/checks/blob/efc69871888f2ff3f392f11070fb1b0ada9e2f19/lib/check-pin-must-be-connected.ts)
- Component-owned constraint precedent:
  [`core` PR #2781](https://github.com/tscircuit/core/pull/2781)
- CLI reporting:
  [`build-file.ts`](https://github.com/tscircuit/cli/blob/38eb5ef5efdd30cf30c5b86102e5d3f7ea33da46/cli/build/build-file.ts)
- CLI exit policy:
  [`register.ts`](https://github.com/tscircuit/cli/blob/38eb5ef5efdd30cf30c5b86102e5d3f7ea33da46/cli/build/register.ts)
- CLI DRC-exit regression:
  [`build-with-drc-error.test.ts`](https://github.com/tscircuit/cli/blob/38eb5ef5efdd30cf30c5b86102e5d3f7ea33da46/tests/cli/build/build-with-drc-error.test.ts)
- Original trace-constraint issue:
  [`tscircuit/tscircuit#476`](https://github.com/tscircuit/tscircuit/issues/476)
- Decoupling placement issue:
  [`tscircuit/matchpack#15`](https://github.com/tscircuit/matchpack/issues/15)

### Electrical primary sources

- [Hardware design with RP2040](https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf)
- [RP2040 datasheet](https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf)
- [TI TAS2xxx PCB layout guidelines](https://www.ti.com/lit/pdf/slaa902)
- [TI high-speed layout guidelines](https://www.ti.com/lit/an/scaa082a/scaa082a.pdf)
- [Microchip AN5603](https://ww1.microchip.com/downloads/aemDocuments/documents/TCG/ApplicationNotes/ApplicationNotes/AN5603-Power-Supply-Decoupling-and-Layout-Considerations-DS00005603.pdf)
- [Microchip family decoupling guidance](https://onlinedocs.microchip.com/oxy/GUID-04B5982F-17EC-4A6E-B7FE-72DF0A5463B9-en-US-3/GUID-F15B709B-5112-4669-BAE9-9DBAC5DA209C.html)

## 32. Final recommendation

Adopt the first-class requirement/relation and path-aware DRC architecture in
phases.

The correct general fix is not to invent and attach
`maxDecouplingTraceLength` to every capacitor. The component definition states
which pins require which decoupling policy. The toolchain automatically finds
electrically eligible capacitors, preserves ambiguity instead of guessing,
checks actual routed coverage through deterministic matching, and emits typed
source and PCB diagnostics. Strict CLI policy makes definite authoritative
violations fail CI.

This design catches missing, wrong-value, wrong-reference, unauthorized-shared,
remote, and banked decoupling failures while preserving existing designs and
keeping low-confidence heuristics non-fatal.
