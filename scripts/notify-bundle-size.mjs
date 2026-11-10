import { appendFileSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { compare, formatBytes, readMeasurement, renderReport } from "./bundle-size.mjs"

const marker = "<!-- tscircuit-bundle-size -->"

export async function notify({ event, repository, token, slackWebhook, slackWorkflowWebhook, request = fetch }) {
  const run = event.workflow_run
  const apiRoot = `${process.env.GITHUB_API_URL || "https://api.github.com"}/repos/${repository}`
  const repoUrl = `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${repository}`
  const runUrl = `${repoUrl}/actions/runs/${run.id}`
  const api = async (path, method = "GET", body) => {
    const response = await request(`${apiRoot}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) throw new Error(`GitHub ${method} ${path} failed (${response.status})`)
    return response.json()
  }

  let pr
  if (run.event === "pull_request") {
    // GitHub can omit pull_requests for fork runs. Resolve those via the commit.
    const candidates = run.pull_requests?.length ? run.pull_requests :
      await api(`/commits/${run.head_sha}/pulls`)
    for (const candidate of candidates) {
      const current = await api(`/pulls/${candidate.number}`)
      if (current.state === "open" && current.head.sha === run.head_sha &&
          current.base.repo.full_name === repository) {
        pr = current
        break
      }
    }
    if (!pr) {
      console.log("Skipping closed or superseded PR run.")
      return
    }
  }

  const rows = compare(
    readMeasurement("measurements/base.json"),
    readMeasurement("measurements/head.json"),
  )
  const regressions = rows.filter((row) => row.exceeded)
  const report = renderReport(rows)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)

  if (pr) {
    let existing
    for (let page = 1; ; page++) {
      const comments = await api(`/issues/${pr.number}/comments?per_page=100&page=${page}`)
      existing = comments.find((comment) =>
        comment.user?.login === "github-actions[bot]" && comment.body?.startsWith(marker))
      if (existing || comments.length < 100) break
    }
    const body = `${marker}\n${report}\n[Workflow run](${runUrl}) · Head: \`${run.head_sha}\``
    // Create a comment on the first regression; update it when fixed, too.
    if (existing) await api(`/issues/comments/${existing.id}`, "PATCH", { body })
    else if (regressions.length) await api(`/issues/${pr.number}/comments`, "POST", { body })
  }

  if (!regressions.length) return
  const webhook = slackWebhook || slackWorkflowWebhook
  if (!webhook) {
    console.log("::warning::Slack alert skipped: configure SLACK_BUNDLE_SIZE_ALERT_WEBHOOK_URL or SLACK_AUTOMERGE_ALERT_WEBHOOK_URL.")
    return
  }
  // Only fixed labels and validated numbers from artifacts enter the message.
  const message = [
    `Large bundle size increase in ${repository}${pr ? ` PR #${pr.number}` : " on main"}`,
    ...regressions.map((row) =>
      `${row.label}: ${formatBytes(row.before)} → ${formatBytes(row.after)} (+${formatBytes(row.delta)}, +${row.percent.toFixed(2)}%)`),
    pr ? `${repoUrl}/pull/${pr.number}` : `${repoUrl}/commit/${run.head_sha}`,
    `Full report: ${runUrl}`,
  ].join("\n")
  const response = await request(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The existing repo secret is a Slack Workflow webhook with a MESSAGE input.
    body: JSON.stringify(slackWebhook ? { text: message } : { MESSAGE: message }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Slack notification failed (${response.status})`)
  console.log("Bundle size alert sent to Slack.")
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await notify({
    event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GH_TOKEN,
    slackWebhook: process.env.SLACK_BUNDLE_SIZE_ALERT_WEBHOOK_URL,
    slackWorkflowWebhook: process.env.SLACK_AUTOMERGE_ALERT_WEBHOOK_URL,
  })
}
