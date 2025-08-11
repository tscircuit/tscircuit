import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'node:path';

const src = join(import.meta.dirname, '../node_modules/@tscircuit/runframe/dist/standalone.min.js');
const destDir = join(import.meta.dirname, '../dist');
const dest = join(destDir, 'browser.min.js');

const content = await readFile(src, 'utf-8');

const packageVersion = JSON.parse(await readFile(join(import.meta.dirname, '../package.json'), 'utf-8')).version;

// Fetch the standalone web-worker from cdnjs, then build a runtime expression
// that constructs a Blob URL from the worker source. This avoids CORS issues
// that some environments have with cross-origin workers.
async function getWorkerBlobUrl(version: string) {
  const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/tscircuit/${version}/webworker.min.js`;

  const response = await fetch(cdnUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch worker script from ${cdnUrl} → ${response.status} ${response.statusText}`);
  }

  const workerJs = await response.text();

  // Build a runtime expression that constructs a Blob URL from the worker
  // source.
  const base64Worker = Buffer.from(workerJs).toString('base64');
  const expression = `URL.createObjectURL(new Blob([atob(\"${base64Worker}\")], { type: 'application/javascript' }))`;
  return expression;
}

const workerBlobUrl = await getWorkerBlobUrl(packageVersion);

// Replace the quoted placeholder (including the surrounding quotes) with the JS expression
const modifiedContent = content.replace(
  /"<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"/g,
  workerBlobUrl
);

await mkdir(destDir, { recursive: true });
await writeFile(dest, modifiedContent);