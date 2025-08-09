import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'node:path';

const src = join(import.meta.dirname, '../node_modules/@tscircuit/runframe/dist/standalone.min.js');
const destDir = join(import.meta.dirname, '../dist');
const dest = join(destDir, 'browser.min.js');

const content = await readFile(src, 'utf-8');

const packageVersion = JSON.parse(await readFile(join(import.meta.dirname, '../package.json'), 'utf-8')).version;
const modifiedContent = content.replace(
  '<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->',
  `https://cdnjs.cloudflare.com/ajax/libs/tscircuit/${packageVersion}/webworker.min.js`
);

await mkdir(destDir, { recursive: true });
await writeFile(dest, modifiedContent);