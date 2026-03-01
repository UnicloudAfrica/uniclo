import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { parseTscOutput, printRankSummary } from "./ts-error-rank.mjs";

const args = process.argv.slice(2);

let project = "tsconfig.json";
let label = "full";
let cacheDir = ".cache";
let verbose = false;
let extra = [];

while (args.length > 0) {
  const arg = args.shift();
  if (arg === "--project" && args[0]) {
    project = args.shift();
    continue;
  }
  if (arg === "--label" && args[0]) {
    label = args.shift();
    continue;
  }
  if (arg === "--cache-dir" && args[0]) {
    cacheDir = args.shift();
    continue;
  }
  if (arg === "--verbose") {
    verbose = true;
    continue;
  }
  extra.push(arg);
}

const cwd = process.cwd();
const resolvedProject = path.resolve(cwd, project);
if (!fs.existsSync(resolvedProject)) {
  console.error(`Project file not found: ${resolvedProject}`);
  process.exit(1);
}

const resolvedCacheDir = path.resolve(cwd, cacheDir);
const tsBuildInfo = path.join(resolvedCacheDir, `tsc.${label}.tsbuildinfo`);
const errorsDir = path.join(resolvedCacheDir, "ts-errors");
const logFile = path.join(errorsDir, `${label}.log`);

fs.mkdirSync(errorsDir, { recursive: true });

const tscBin = path.resolve(cwd, "node_modules/typescript/bin/tsc");
const tscArgs = [
  tscBin,
  "--project",
  resolvedProject,
  "--noEmit",
  "--pretty",
  "false",
  "--incremental",
  "--tsBuildInfoFile",
  tsBuildInfo,
  ...extra,
];

const result = spawnSync(process.execPath, tscArgs, {
  cwd,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 200,
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
fs.writeFileSync(logFile, output, "utf8");

if (verbose && output.trim()) {
  process.stdout.write(output);
}

const summary = parseTscOutput(output);
if (!verbose && summary.total > 0) {
  console.log(
    `TypeScript emitted ${summary.total} errors. Showing the first ${summary.samples.length}:`
  );
  for (const sample of summary.samples) {
    console.log(sample);
  }
  console.log("");
}

console.log("");

console.log(`Build cache: ${path.relative(cwd, tsBuildInfo)}`);
printRankSummary(summary, { codeLimit: 12, fileLimit: 12, folderLimit: 12 });

if (typeof result.status === "number") {
  process.exit(result.status);
}

if (result.error) {
  console.error(result.error.message);
}
process.exit(1);
