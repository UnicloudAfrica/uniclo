import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const lanes = [
  { label: "admin", project: "tsconfig.typecheck.admin.json" },
  { label: "dashboards", project: "tsconfig.typecheck.dashboard.json" },
  { label: "core", project: "tsconfig.typecheck.core.json" },
];

const prefixStream = (stream, prefix) => {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line) continue;
      process.stdout.write(`[${prefix}] ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer.trim().length > 0) {
      process.stdout.write(`[${prefix}] ${buffer}\n`);
    }
  });
};

const runLane = (lane) =>
  new Promise((resolve) => {
    const runner = path.resolve("scripts/typecheck-runner.mjs");
    const child = spawn(
      process.execPath,
      [runner, "--label", lane.label, "--project", lane.project],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    prefixStream(child.stdout, lane.label);
    prefixStream(child.stderr, lane.label);

    child.on("close", (code) => {
      resolve({ lane, code: code ?? 1 });
    });
  });

const main = async () => {
  const results = await Promise.all(lanes.map(runLane));
  process.stdout.write("\nParallel typecheck summary:\n");

  let hasFailure = false;
  for (const result of results) {
    const ok = result.code === 0;
    if (!ok) hasFailure = true;
    process.stdout.write(
      `${ok ? "  PASS" : "  FAIL"} ${result.lane.label} (${result.lane.project}) -> exit ${
        result.code
      }\n`
    );
  }

  process.exit(hasFailure ? 1 : 0);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
