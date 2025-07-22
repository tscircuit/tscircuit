import { mkdir, copyFile } from 'fs/promises';
import { join } from 'node:path';

const src = join(import.meta.dirname, '../node_modules/@tscircuit/runframe/dist/standalone.min.js');
const destDir = join(import.meta.dirname, '../dist');
const dest = join(destDir, 'browser.min.js');

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);