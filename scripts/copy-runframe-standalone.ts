import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'node:path';

const src = join(import.meta.dirname, '../node_modules/@tscircuit/runframe/dist/standalone.min.js');
const destDir = join(import.meta.dirname, '../dist');
const dest = join(destDir, 'browser.min.js');

const content = await readFile(src, 'utf-8');

const workerPath = join(import.meta.dirname, '../node_modules/@tscircuit/eval/dist/webworker/entrypoint.js');
const workerJs = await readFile(workerPath, 'utf-8');
const base64Worker = Buffer.from(workerJs).toString('base64');
const workerBlobUrl = `URL.createObjectURL(new Blob([atob(\"${base64Worker}\")], { type: 'application/javascript' }))`;

// Replace the quoted placeholder (including the surrounding quotes) with the JS expression
const modifiedContent = content.replace(
  /"<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"/g,
  workerBlobUrl
);

await mkdir(destDir, { recursive: true });
await writeFile(dest, modifiedContent);
