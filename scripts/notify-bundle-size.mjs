import { appendFileSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { compare, formatBytes, readMeasurement, renderReport } from "./bundle-size.mjs"

export async function notify({ event, repository, slackWebhook, request = fetch }) {
  const run = event.workflow_run
  if (run.event !== "push" || run.head_branch !== "main" || run.conclusion === "cancelled") {
    console.log("Skipping notification: only completed main-branch pushes can notify.")
    return
  }
  const repoUrl = `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${repository}`
  const runUrl = `${repoUrl}/actions/runs/${run.id}`

  const rows = compare(
    readMeasurement("measurements/base.json"),
    readMeasurement("measurements/head.json"),
  )
  const regressions = rows.filter((row) => row.exceeded)
  const report = renderReport(rows)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)

  if (!regressions.length) return
  if (!slackWebhook) {
    console.log("::warning::Slack alert skipped: configure SLACK_AUTOMERGE_ALERT_WEBHOOK_URL.")
    return
  }
  // Only fixed labels and validated numbers from artifacts enter the message.
  const message = [
    `Large bundle size increase in ${repository} on main`,
    ...regressions.map((row) =>
      `${row.label}: ${formatBytes(row.before)} → ${formatBytes(row.after)} (+${formatBytes(row.delta)}, +${row.percent.toFixed(2)}%)`),
    `${repoUrl}/commit/${run.head_sha}`,
    `Full report: ${runUrl}`,
  ].join("\n")
  const response = await request(slackWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The existing repo secret is a Slack Workflow webhook with a MESSAGE input.
    body: JSON.stringify({ MESSAGE: message }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Slack notification failed (${response.status})`)
  console.log("Bundle size alert sent to Slack.")
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await notify({
    event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
    repository: process.env.GITHUB_REPOSITORY,
    slackWebhook: process.env.SLACK_AUTOMERGE_ALERT_WEBHOOK_URL,
  })
}
