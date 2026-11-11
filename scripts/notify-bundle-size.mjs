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
  const tarball = rows.find((row) => row.key === "package")
  const report = renderReport(rows)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)

  if (!tarball?.exceeded) return
  if (!slackWebhook) {
    console.log("::warning::Slack alert skipped: configure SLACK_AUTOMERGE_ALERT_WEBHOOK_URL.")
    return
  }
  // Only fixed labels and validated numbers from artifacts enter the message.
  const message = [
    `Large npm tarball size increase in ${repository} on main`,
    `${tarball.label}: ${formatBytes(tarball.before)} → ${formatBytes(tarball.after)} (+${formatBytes(tarball.delta)})`,
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
  console.log("npm tarball size alert sent to Slack.")
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await notify({
    event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
    repository: process.env.GITHUB_REPOSITORY,
    slackWebhook: process.env.SLACK_AUTOMERGE_ALERT_WEBHOOK_URL,
  })
}
