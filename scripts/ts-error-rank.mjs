import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ERROR_RE =
  /^(?<file>[^(]+)\((?<line>\d+),(?<col>\d+)\): error TS(?<code>\d+): (?<message>.*)$/;

const topEntries = (counter, limit = 15) =>
  [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

const folderFromFile = (file) => {
  const clean = file.replace(/\\/g, "/");
  if (clean.startsWith("src/")) {
    const parts = clean.split("/");
    return parts.slice(0, Math.min(3, parts.length)).join("/");
  }
  return path.dirname(clean);
};

export const parseTscOutput = (text) => {
  const byCode = new Map();
  const byFile = new Map();
  const byFolder = new Map();
  const samples = [];

  let total = 0;
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(ERROR_RE);
    if (!match?.groups) continue;
    total += 1;

    const code = `TS${match.groups.code}`;
    const file = match.groups.file;
    const folder = folderFromFile(file);

    byCode.set(code, (byCode.get(code) ?? 0) + 1);
    byFile.set(file, (byFile.get(file) ?? 0) + 1);
    byFolder.set(folder, (byFolder.get(folder) ?? 0) + 1);

    if (samples.length < 8) {
      samples.push(line);
    }
  }

  return {
    total,
    fileCount: byFile.size,
    folderCount: byFolder.size,
    codeCount: byCode.size,
    byCode,
    byFile,
    byFolder,
    samples,
  };
};

export const printRankSummary = (summary, options = {}) => {
  const codeLimit = options.codeLimit ?? 15;
  const fileLimit = options.fileLimit ?? 15;
  const folderLimit = options.folderLimit ?? 15;

  console.log(`Total TS errors: ${summary.total}`);
  console.log(`Unique files: ${summary.fileCount}`);
  console.log(`Unique folders: ${summary.folderCount}`);
  console.log(`Unique TS codes: ${summary.codeCount}`);

  if (!summary.total) return;

  console.log("");
  console.log("Top TS codes:");
  for (const [code, count] of topEntries(summary.byCode, codeLimit)) {
    console.log(`${String(count).padStart(5, " ")} ${code}`);
  }

  console.log("");
  console.log("Top files:");
  for (const [file, count] of topEntries(summary.byFile, fileLimit)) {
    console.log(`${String(count).padStart(5, " ")} ${file}`);
  }

  console.log("");
  console.log("Top folders:");
  for (const [folder, count] of topEntries(summary.byFolder, folderLimit)) {
    console.log(`${String(count).padStart(5, " ")} ${folder}`);
  }
};

const readInput = (inputPath) => {
  if (inputPath) {
    return fs.readFileSync(inputPath, "utf8");
  }

  if (!process.stdin.isTTY) {
    const stdinData = fs.readFileSync(0, "utf8");
    if (stdinData.trim().length > 0) {
      return stdinData;
    }
  }

  const errorsDir = path.resolve(".cache/ts-errors");
  if (fs.existsSync(errorsDir)) {
    const logs = fs
      .readdirSync(errorsDir)
      .filter((file) => file.endsWith(".log"))
      .map((file) => {
        const fullPath = path.join(errorsDir, file);
        return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (logs.length > 0) {
      return fs.readFileSync(logs[0].fullPath, "utf8");
    }
  }

  throw new Error(
    "No input provided. Pass a log file path, pipe tsc output, or run any typecheck:* script first."
  );
};

const main = () => {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const inputPath = args.find((arg) => !arg.startsWith("--"));
  const input = readInput(inputPath);
  const summary = parseTscOutput(input);

  if (json) {
    const toObject = (map) => Object.fromEntries(topEntries(map, 1000));
    console.log(
      JSON.stringify(
        {
          total: summary.total,
          fileCount: summary.fileCount,
          folderCount: summary.folderCount,
          codeCount: summary.codeCount,
          byCode: toObject(summary.byCode),
          byFile: toObject(summary.byFile),
          byFolder: toObject(summary.byFolder),
          samples: summary.samples,
        },
        null,
        2
      )
    );
    return;
  }

  printRankSummary(summary);
};

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
