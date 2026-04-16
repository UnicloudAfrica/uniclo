export interface DocFrontmatter {
  title: string;
  subtitle?: string;
  tocItems?: { id: string; label: string }[];
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}

export type BlockType = "step" | "screenshot" | "callout" | "mermaid" | "markdown";

export interface DocBlock {
  type: BlockType;
  attrs: Record<string, string>;
  content: string;
}

/**
 * Parse a doc markdown string into frontmatter + blocks.
 *
 * Custom block syntax:
 *   :::step{number=1 icon=LogIn title="Sign in" navigation="Sidebar > Home"}
 *   Body text here...
 *   :::
 *
 *   :::callout{type=tip title="Helpful hint"}
 *   Some tip text.
 *   :::
 *
 *   :::screenshot{caption="Your dashboard" src="/images/dash.png"}
 *   :::
 *
 *   :::mermaid{caption="Auth flow"}
 *   graph TD
 *     A --> B
 *   :::
 *
 * Everything outside custom blocks is treated as standard markdown.
 */
export function parseDocMarkdown(raw: string): {
  frontmatter: DocFrontmatter;
  blocks: DocBlock[];
} {
  const { data, content } = parseFrontmatter(raw);
  const frontmatter = data as unknown as DocFrontmatter;
  const blocks: DocBlock[] = [];

  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for opening custom block: :::type{attrs}
    const openMatch = line.match(/^:::(step|screenshot|callout|mermaid)\{(.+?)\}\s*$/);
    if (openMatch) {
      const type = openMatch[1] as BlockType;
      const attrsRaw = openMatch[2];
      const attrs = parseAttrs(attrsRaw);

      // Collect content until closing :::
      i++;
      const bodyLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== ":::") {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::

      blocks.push({ type, attrs, content: bodyLines.join("\n").trim() });
      continue;
    }

    // Check for self-closing custom block: :::type{attrs}:::
    const selfCloseMatch = line.match(/^:::(step|screenshot|callout|mermaid)\{(.+?)\}:::\s*$/);
    if (selfCloseMatch) {
      const type = selfCloseMatch[1] as BlockType;
      const attrs = parseAttrs(selfCloseMatch[2]);
      blocks.push({ type, attrs, content: "" });
      i++;
      continue;
    }

    // Regular markdown — collect consecutive lines until next custom block
    const mdLines: string[] = [];
    while (
      i < lines.length &&
      !lines[i].match(/^:::(step|screenshot|callout|mermaid)\{/)
    ) {
      mdLines.push(lines[i]);
      i++;
    }

    const md = mdLines.join("\n").trim();
    if (md) {
      blocks.push({ type: "markdown", attrs: {}, content: md });
    }
  }

  return { frontmatter, blocks };
}

/**
 * Parse attribute string like:
 *   number=1 icon=LogIn title="Sign in to the dashboard" navigation="Sidebar > Home"
 * into { number: "1", icon: "LogIn", title: "Sign in to the dashboard", ... }
 */
function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]*?)"|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(raw)) !== null) {
    attrs[m[1]] = m[2] ?? m[3];
  }
  return attrs;
}

/**
 * Simple browser-compatible YAML frontmatter parser.
 * Extracts the YAML block between leading `---` fences and parses
 * basic key: value, key: { ... }, and key: [ ... ] patterns.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) {
    return { data: {}, content: raw };
  }

  const endIdx = trimmed.indexOf("---", 3);
  if (endIdx === -1) {
    return { data: {}, content: raw };
  }

  const yamlBlock = trimmed.slice(3, endIdx).trim();
  const content = trimmed.slice(endIdx + 3).trim();
  const data: Record<string, unknown> = {};

  for (const line of yamlBlock.split("\n")) {
    const trimLine = line.trim();
    if (!trimLine || trimLine.startsWith("#")) continue;

    const colonIdx = trimLine.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimLine.slice(0, colonIdx).trim();
    let value: string = trimLine.slice(colonIdx + 1).trim();

    if (!value) continue;

    // Inline object: { label: Foo, href: /bar }
    if (value.startsWith("{") && value.endsWith("}")) {
      const inner = value.slice(1, -1).trim();
      const obj: Record<string, string> = {};
      for (const pair of inner.split(",")) {
        const pairColon = pair.indexOf(":");
        if (pairColon === -1) continue;
        obj[pair.slice(0, pairColon).trim()] = pair.slice(pairColon + 1).trim();
      }
      data[key] = obj;
      continue;
    }

    // Inline array: [{ ... }, { ... }]  — skip, handle multi-line below
    if (value.startsWith("[")) {
      // Try to parse as JSON-like array of objects
      try {
        // Convert YAML-ish to JSON: { id: foo, label: bar } → {"id":"foo","label":"bar"}
        const jsonStr = value
          .replace(/(\w+)\s*:/g, '"$1":')
          .replace(/:\s*([^",}\]]+)/g, (_, v) => `: "${v.trim()}"`)
          .replace(/"{2,}/g, '"');
        data[key] = JSON.parse(jsonStr);
      } catch {
        data[key] = value;
      }
      continue;
    }

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, content };
}
