#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const srcRoot = path.join(cwd, "src");
const baselinePath = path.join(cwd, "scripts", "theme-audit-baseline.json");

const args = new Set(process.argv.slice(2));
const writeBaseline = args.has("--write-baseline");
const strict = args.has("--strict");

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const allowedColorLiteralFiles = new Set([
  "src/index.css",
  "src/styles/designTokens.ts",
  "src/hooks/useBrandingTheme.ts",
]);
const allowedFontLiteralFiles = new Set(["src/index.css", "src/styles/designTokens.ts"]);

const requiredThemeTokens = [
  "--theme-on-color",
  "--theme-on-secondary",
  "--theme-focus-ring",
  "--surface-page",
  "--surface-card",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--border-default",
];

const scanFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFiles(absolutePath));
      continue;
    }
    if (!sourceExtensions.has(path.extname(entry.name))) {
      continue;
    }
    files.push(absolutePath);
  }
  return files;
};

const getRelative = (absolutePath) => path.relative(cwd, absolutePath).split(path.sep).join("/");

const countMatches = (content, pattern) => (content.match(pattern) ?? []).length;
const countHardcodedColorFunctions = (content) => {
  const colorFunctionPattern = /\b(?:rgb|rgba|hsl|hsla)\s*\(/gi;
  const isTokenFallbackLiteral = (startIndex) => {
    const prefix = content.slice(Math.max(0, startIndex - 120), startIndex);
    return /var\s*\(\s*--[\w-]+\s*,\s*$/i.test(prefix);
  };
  let count = 0;
  let match = colorFunctionPattern.exec(content);

  while (match) {
    const argsStart = colorFunctionPattern.lastIndex;
    let cursor = argsStart;
    let depth = 1;

    while (cursor < content.length && depth > 0) {
      const char = content[cursor];
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      }
      cursor += 1;
    }

    if (depth !== 0) {
      break;
    }

    const args = content.slice(argsStart, cursor - 1);
    const hasTokenVarReference = /\bvar\s*\(\s*--[\w-]+/i.test(args);
    const hasNumericLiteral = /\d/.test(args);
    const tokenFallbackLiteral = isTokenFallbackLiteral(match.index);

    if (!hasTokenVarReference && !tokenFallbackLiteral && hasNumericLiteral) {
      count += 1;
    }

    match = colorFunctionPattern.exec(content);
  }

  return count;
};

const fileMetrics = [];
const files = scanFiles(srcRoot);

let hardcodedHexTotal = 0;
let arbitraryTailwindHexTotal = 0;
let cssVariableUsageTotal = 0;
let hardcodedFontFamilyTotal = 0;
let hardcodedColorFunctionTotal = 0;

const hardcodedHexPattern = /#[0-9a-fA-F]{3,8}\b/g;
const arbitraryTailwindHexPattern =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill)-\[#(?:[0-9a-fA-F]{3,8})\]\b/g;
const cssVariablePattern = /var\(--[\w-]+\)|\[\-\-[\w-]+\]/g;
const hardcodedCssFontPattern =
  /font-family\s*:(?!\s*(?:var\(--font-(?:sans|brand|mono)(?:\s*,[^)]*)?\)|inherit|monospace))\s*[^;]+;/g;
const hardcodedJsFontPattern =
  /fontFamily\s*:\s*(["'`])(?!var\(--font-(?:sans|brand|mono)(?:\s*,[^)]*)?\)|inherit|monospace)[^"'`]+\1/g;

for (const absolutePath of files) {
  const relativePath = getRelative(absolutePath);
  const content = fs.readFileSync(absolutePath, "utf8");

  const arbitraryHexCount = countMatches(content, arbitraryTailwindHexPattern);
  const variableCount = countMatches(content, cssVariablePattern);
  const hardcodedCssFontCount = allowedFontLiteralFiles.has(relativePath)
    ? 0
    : countMatches(content, hardcodedCssFontPattern);
  const hardcodedJsFontCount = allowedFontLiteralFiles.has(relativePath)
    ? 0
    : countMatches(content, hardcodedJsFontPattern);
  const hardcodedFontCount = hardcodedCssFontCount + hardcodedJsFontCount;
  const rawHexCount = allowedColorLiteralFiles.has(relativePath)
    ? 0
    : countMatches(content, hardcodedHexPattern) - arbitraryHexCount;
  const hardcodedHexCount = Math.max(0, rawHexCount);
  const hardcodedColorFunctionCount = allowedColorLiteralFiles.has(relativePath)
    ? 0
    : countHardcodedColorFunctions(content);

  hardcodedHexTotal += hardcodedHexCount;
  arbitraryTailwindHexTotal += arbitraryHexCount;
  cssVariableUsageTotal += variableCount;
  hardcodedFontFamilyTotal += hardcodedFontCount;
  hardcodedColorFunctionTotal += hardcodedColorFunctionCount;

  if (
    hardcodedHexCount > 0 ||
    arbitraryHexCount > 0 ||
    hardcodedFontCount > 0 ||
    hardcodedColorFunctionCount > 0
  ) {
    fileMetrics.push({
      path: relativePath,
      hardcodedHexCount,
      arbitraryTailwindHexCount: arbitraryHexCount,
      hardcodedFontFamilyCount: hardcodedFontCount,
      hardcodedColorFunctionCount,
    });
  }
}

fileMetrics.sort(
  (a, b) =>
    b.hardcodedHexCount +
    b.arbitraryTailwindHexCount +
    b.hardcodedFontFamilyCount +
    b.hardcodedColorFunctionCount -
    (a.hardcodedHexCount +
      a.arbitraryTailwindHexCount +
      a.hardcodedFontFamilyCount +
      a.hardcodedColorFunctionCount)
);

const topOffenders = fileMetrics.slice(0, 12);

const tailwindConfigPath = path.join(cwd, "tailwind.config.js");
const indexCssPath = path.join(cwd, "src", "index.css");
const brandingHookPath = path.join(cwd, "src", "hooks", "useBrandingTheme.ts");

const tailwindConfig = fs.readFileSync(tailwindConfigPath, "utf8");
const indexCss = fs.readFileSync(indexCssPath, "utf8");
const brandingHook = fs.readFileSync(brandingHookPath, "utf8");

const hasDarkModeConfig = /darkMode:\s*\[/.test(tailwindConfig);
const hasRuntimeBrandingApply = /applyBrandingToCss/.test(brandingHook);
const hasSemanticThemeTokens = requiredThemeTokens.every((token) => indexCss.includes(token));
const hasContrastAwareBranding = /contrastRatio|resolveOnColor|normalizeTextColor/.test(brandingHook);

const architecturePoints = [
  hasDarkModeConfig,
  hasRuntimeBrandingApply,
  hasSemanticThemeTokens,
  hasContrastAwareBranding,
].filter(Boolean).length;
const architectureScore = (architecturePoints / 4) * 8;
const adoptionScore =
  cssVariableUsageTotal +
    hardcodedHexTotal +
    arbitraryTailwindHexTotal +
    hardcodedFontFamilyTotal +
    hardcodedColorFunctionTotal ===
  0
    ? 2
    : Math.max(
        0,
        Math.min(
          2,
          (cssVariableUsageTotal /
            (cssVariableUsageTotal +
              hardcodedHexTotal +
              arbitraryTailwindHexTotal +
              hardcodedFontFamilyTotal +
              hardcodedColorFunctionTotal)) *
            2
        )
      );
const score = Number((architectureScore + adoptionScore).toFixed(2));

const report = {
  scoreOutOf10: score,
  metrics: {
    filesScanned: files.length,
    cssVariableUsageTotal,
    hardcodedHexTotal,
    arbitraryTailwindHexTotal,
    hardcodedFontFamilyTotal,
    hardcodedColorFunctionTotal,
  },
  architecture: {
    hasDarkModeConfig,
    hasRuntimeBrandingApply,
    hasSemanticThemeTokens,
    hasContrastAwareBranding,
  },
  topOffenders,
};

const printReport = () => {
  console.log("Theme Audit");
  console.log("===========");
  console.log(`Score: ${report.scoreOutOf10}/10`);
  console.log(`Files scanned: ${report.metrics.filesScanned}`);
  console.log(`CSS variable usages: ${report.metrics.cssVariableUsageTotal}`);
  console.log(`Hardcoded hex literals: ${report.metrics.hardcodedHexTotal}`);
  console.log(`Hardcoded rgb/rgba/hsl/hsla literals: ${report.metrics.hardcodedColorFunctionTotal}`);
  console.log(`Tailwind arbitrary hex classes: ${report.metrics.arbitraryTailwindHexTotal}`);
  console.log(`Hardcoded font-family literals: ${report.metrics.hardcodedFontFamilyTotal}`);
  console.log("");
  console.log("Architecture checks:");
  console.log(`- Dark mode config: ${report.architecture.hasDarkModeConfig ? "yes" : "no"}`);
  console.log(`- Runtime branding apply: ${report.architecture.hasRuntimeBrandingApply ? "yes" : "no"}`);
  console.log(`- Semantic theme tokens: ${report.architecture.hasSemanticThemeTokens ? "yes" : "no"}`);
  console.log(
    `- Contrast-aware theme logic: ${report.architecture.hasContrastAwareBranding ? "yes" : "no"}`
  );
  if (report.topOffenders.length > 0) {
    console.log("");
    console.log("Top offenders:");
    for (const offender of report.topOffenders) {
      const total =
        offender.hardcodedHexCount +
        offender.arbitraryTailwindHexCount +
        offender.hardcodedFontFamilyCount +
        offender.hardcodedColorFunctionCount;
      console.log(
        `- ${offender.path} (total=${total}, hex=${offender.hardcodedHexCount}, colorFn=${offender.hardcodedColorFunctionCount}, arbitraryTailwind=${offender.arbitraryTailwindHexCount}, fontFamily=${offender.hardcodedFontFamilyCount})`
      );
    }
  }
};

if (writeBaseline) {
  fs.writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        hardcodedHexTotal,
        arbitraryTailwindHexTotal,
        hardcodedFontFamilyTotal,
        hardcodedColorFunctionTotal,
      },
      null,
      2
    ) + "\n"
  );
  printReport();
  console.log("");
  console.log(`Baseline written: ${getRelative(baselinePath)}`);
  process.exit(0);
}

let baseline = null;
if (fs.existsSync(baselinePath)) {
  baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
}

printReport();

if (!baseline) {
  console.log("");
  console.log("No baseline found. Run with --write-baseline to create one.");
  process.exit(strict ? 1 : 0);
}

const exceedsHex = hardcodedHexTotal > (baseline.hardcodedHexTotal ?? 0);
const exceedsArbitrary = arbitraryTailwindHexTotal > (baseline.arbitraryTailwindHexTotal ?? 0);
const exceedsFontFamilies = hardcodedFontFamilyTotal > (baseline.hardcodedFontFamilyTotal ?? 0);
const exceedsColorFunctions =
  hardcodedColorFunctionTotal > (baseline.hardcodedColorFunctionTotal ?? 0);

if (exceedsHex || exceedsArbitrary || exceedsFontFamilies || exceedsColorFunctions) {
  console.log("");
  console.log("Theme regression detected against baseline.");
  console.log(
    `- hardcodedHexTotal: ${hardcodedHexTotal} (baseline ${baseline.hardcodedHexTotal ?? 0})`
  );
  console.log(
    `- hardcodedColorFunctionTotal: ${hardcodedColorFunctionTotal} (baseline ${baseline.hardcodedColorFunctionTotal ?? 0})`
  );
  console.log(
    `- arbitraryTailwindHexTotal: ${arbitraryTailwindHexTotal} (baseline ${baseline.arbitraryTailwindHexTotal ?? 0})`
  );
  console.log(
    `- hardcodedFontFamilyTotal: ${hardcodedFontFamilyTotal} (baseline ${baseline.hardcodedFontFamilyTotal ?? 0})`
  );
  process.exit(1);
}

if (strict && score < 8.5) {
  console.log("");
  console.log(`Strict mode failed: score ${score}/10 is below 8.5.`);
  process.exit(1);
}

process.exit(0);
