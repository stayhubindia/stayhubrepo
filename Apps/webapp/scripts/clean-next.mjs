import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const isDev = process.argv.includes("--dev");

const targets = isDev ? [".next-dev"] : [".next", ".next-dev"];

for (const target of targets) {
  const targetPath = path.join(cwd, target);
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } catch {
    // Non-fatal cleanup best effort.
  }
}
