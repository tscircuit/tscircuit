import { mkdir, copyFile } from 'fs/promises';
import { join } from 'node:path';

const src = join(import.meta.dirname, '../node_modules/@tscircuit/eval/dist/webworker/entrypoint.js');
const destDir = join(import.meta.dirname, '../dist');
const dest = join(destDir, 'webworker.min.js');

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);