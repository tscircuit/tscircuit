import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const dtsPath = join(process.cwd(), "dist", "index.d.ts");
const content = readFileSync(dtsPath, "utf-8");
const reference = '/// <reference path="../globals.d.ts" />\n';

if (!content.includes(reference)) {
    writeFileSync(dtsPath, reference + content);
    console.log("Added globals reference to index.d.ts");
}
