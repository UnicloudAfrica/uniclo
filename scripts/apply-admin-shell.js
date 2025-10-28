const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const pagesDir = path.join(projectRoot, 'src', 'adminDashboard', 'pages');
const shellPath = path.join(projectRoot, 'src', 'adminDashboard', 'components', 'AdminPageShell');

const baseClass = 'dashboard-content-shell';
const simpleString = /^(?:"[^"]*"|'[^']*'|`[^`]*`)$/;

const skippedFiles = new Set();

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(filePath);
    }
    if (/\.(js|jsx)$/.test(entry.name)) {
      return [filePath];
    }
    return [];
  });
}

function findNextMain(source) {
  const regex = /<main([^>]*)>([\s\S]*?)<\/main>/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    if (match[1].includes(baseClass)) {
      return {
        index: match.index,
        length: match[0].length,
        attrs: match[1],
        inner: match[2],
      };
    }
  }
  return null;
}

function extractAttribute(attrs, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*(\\{[^}]*\\}|"[^"]*"|'[^']*'|` + '`[^`]*`' + `)`);
  const match = attrs.match(pattern);
  if (!match) return null;
  return match[1].trim();
}

function parseClassList(value) {
  if (!value) return null;
  let working = value;
  if (working.startsWith('{') && working.endsWith('}')) {
    working = working.slice(1, -1).trim();
  }
  if (!simpleString.test(working)) {
    return null;
  }
  working = working.slice(1, -1);
  if (working.includes('${')) {
    return null;
  }
  return working.split(/\s+/).filter(Boolean);
}

function removeAttribute(attrs, name) {
  const pattern = new RegExp(`\\s*${name}\\s*=\\s*(\\{[^}]*\\}|"[^"]*"|'[^']*'|` + '`[^`]*`' + `)`);
  return attrs.replace(pattern, '');
}

function ensureImport(code, filePath) {
  if (/import\s+AdminPageShell/.test(code)) return code;
  let relative = path.relative(path.dirname(filePath), shellPath).replace(/\\/g, '/');
  if (!relative.startsWith('.')) {
    relative = './' + relative;
  }
  const importLine = `import AdminPageShell from "${relative}";\n`;
  const importRegex = /^import[^;]+;\n?/gm;
  let lastMatch = null;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    lastMatch = match;
  }
  if (lastMatch) {
    const insertPos = lastMatch.index + lastMatch[0].length;
    return code.slice(0, insertPos) + importLine + code.slice(insertPos);
  }
  return importLine + code;
}

function replaceBlock(source, block, props, extraAttrs) {
  const { index, length, inner } = block;
  let indentStart = index;
  while (indentStart > 0 && source[indentStart - 1] !== '\n' && source[indentStart - 1] !== '\r') {
    indentStart--;
  }
  const indent = source.slice(indentStart, index);
  const attrsStr = extraAttrs ? ` ${extraAttrs.trim()}` : '';
  const openTag = `${indent}<AdminPageShell${attrsStr}${props}>`;
  const closeTag = `${indent}</AdminPageShell>`;
  return source.slice(0, index) + openTag + inner + closeTag + source.slice(index + length);
}

function convertFile(filePath) {
  let source = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  while (true) {
    const block = findNextMain(source);
    if (!block) break;
    const classAttr = extractAttribute(block.attrs, 'className');
    const classes = parseClassList(classAttr);
    if (!classes) {
      skippedFiles.add(filePath);
      break;
    }
    const filtered = classes.filter((cls) => cls !== baseClass);
    const classProp = filtered.length ? ` contentClassName="${filtered.join(' ')}"` : '';
    const styleAttr = extractAttribute(block.attrs, 'style');
    const styleProp = styleAttr ? ` contentStyle=${styleAttr}` : '';
    const props = `${classProp}${styleProp}`;
    const remainingAttrs = removeAttribute(removeAttribute(block.attrs, 'className'), 'style');
    source = replaceBlock(source, block, props, remainingAttrs);
    changed = true;
  }

  if (!changed) return;
  source = ensureImport(source, filePath);
  fs.writeFileSync(filePath, source);
}

const files = walk(pagesDir);
files.forEach((file) => convertFile(file));

if (skippedFiles.size) {
  console.warn('Skipped files (manual review needed):');
  skippedFiles.forEach((file) => console.warn(` - ${path.relative(projectRoot, file)}`));
}
