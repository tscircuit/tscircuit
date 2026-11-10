# Bundle size checks and Slack alerts

The **Bundle Size** workflow builds both revisions on every pull request and
every push to `main`, including direct dependency updates from tscircuitbot.
Each revision uses its own frozen lockfile, the same pinned Bun runtime, Node 24,
and a Linux x64 runner. The **Bundle size budget** check fails on a large increase
and includes a before/after table in its job summary. Failed builds or missing
measurements also fail the check.

The check measures the actual browser and worker bundles (raw and gzip), the
compressed and unpacked npm package, and a separate production `node_modules`
installation. The latter catches dependencies such as `tsx` and its `esbuild`
binary even if they never appear in the browser bundle. Production installs
include peer and optional dependencies for Linux x64, exclude dev dependencies,
use Bun's hoisted linker, and disable lifecycle scripts. This is a reproducible
logical-file-size comparison, not a measurement of every platform's disk usage
or installation side effects.

## Budgets

`bundle-size.config.json` defines the minimum byte increase, percentage increase,
and absolute growth cap for each metric. An increase fails if it reaches both
the minimum byte and percentage thresholds **or** reaches the absolute cap:

| Metric | Minimum increase | Percentage | Absolute growth cap |
| --- | ---: | ---: | ---: |
| Browser / worker, each | 100 KiB | 5% | 1 MiB |
| Browser / worker gzip, each | 25 KiB | 5% | 256 KiB |
| npm tarball | 100 KiB | 5% | 1 MiB |
| npm unpacked / production install, each | 1 MiB | 5% | 5 MiB |

The absolute cap catches a large addition even when the existing installation is
already large. Reductions and small fluctuations pass. Review the dependency
diff and the generated bundles when a check fails. If growth is intentional,
adjust the relevant budget with an explanation in the PR; do not regenerate a
checked-in baseline. Each run compares against the PR base SHA or the previous
push SHA, so it needs no baseline cache or manually maintained size snapshot.

## Notifications and enforcement

The separate **Bundle Size Notifications** workflow sends Slack alerts only when
a completed push to `main` exceeds a size budget. This covers merged PRs and
direct dependency updates to `main`. Alerts include the affected metrics, sizes,
changes, and links to the landed commit and full report. Creating or updating a
PR never sends a Slack alert or posts a PR comment; PR comparisons remain visible
in the CI job summary. Unchanged sizes, decreases, and increases below the budgets
do not notify. A build failure without size reports remains a failed CI check;
it does not produce a misleading size regression alert.

Slack routing uses repository Actions secrets:

- **Default:** reuse `SLACK_AUTOMERGE_ALERT_WEBHOOK_URL`, the existing Slack
  Workflow webhook, with its `MESSAGE` input.
- **Optional dedicated channel:** set `SLACK_BUNDLE_SIZE_ALERT_WEBHOOK_URL` to a
  Slack **Incoming Webhook** for that channel. This takes priority and uses the
  standard `text` payload. Do not paste webhook URLs into source control.

Without either secret, CI comparisons still work and the notification job
logs a warning. Slack HTTP errors fail the notification job. The notification
workflow becomes active after these files land on the default branch. It runs
only trusted default-branch code with a read-only token and webhook secrets; PR code
runs with read-only permissions and never receives them. Downloaded artifacts
are read as bounded JSON containing positive integer sizes, never executed.

To block merges, make **Bundle size budget** a required status check in the
`main` branch ruleset. Restrict direct pushes if every change must pass before
landing: push alerts report changes after the push and do not gate the existing
npm publishing workflow. These repository settings are separate from this code
change.

## Local comparison

Build two checkouts with their respective frozen dependencies, then run the
measurement script from the checkout containing these scripts:

```sh
# In each checkout:
bun install --frozen-lockfile --ignore-scripts --linker=hoisted
bun run build

# From the checkout containing these scripts (bun and npm must be on PATH):
node scripts/bundle-size.mjs measure /path/to/base /tmp/base-size.json
node scripts/bundle-size.mjs measure /path/to/head /tmp/head-size.json
node scripts/bundle-size.mjs compare /tmp/base-size.json /tmp/head-size.json
```

The comparison exits with status 1 for a regression. Run the focused checks with
`bun test tests/bundle-size.test.ts`.
