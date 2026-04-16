import React from "react";
import Markdown from "react-markdown";
import type { DocBlock } from "./parseDocMarkdown";
import DocStep from "@/shared/pages/docs/components/DocStep";
import DocScreenshot from "@/shared/pages/docs/components/DocScreenshot";
import DocCallout from "@/shared/pages/docs/components/DocCallout";
import DocMermaid from "@/shared/pages/docs/components/DocMermaid";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Resolve a Lucide icon by name string (e.g. "LogIn" → LogIn icon component) */
function resolveIcon(name: string): LucideIcon {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === "function") return icon as LucideIcon;
  return LucideIcons.HelpCircle; // fallback
}

interface DocBlockRendererProps {
  block: DocBlock;
}

const DocBlockRenderer: React.FC<DocBlockRendererProps> = ({ block }) => {
  switch (block.type) {
    case "step": {
      const number = parseInt(block.attrs.number || "1", 10);
      const icon = resolveIcon(block.attrs.icon || "HelpCircle");
      return (
        <DocStep
          number={number}
          icon={icon}
          title={block.attrs.title || ""}
          navigation={block.attrs.navigation}
        >
          <MarkdownContent content={block.content} />
        </DocStep>
      );
    }

    case "screenshot":
      return (
        <DocScreenshot
          caption={block.attrs.caption || ""}
          src={block.attrs.src}
          alt={block.attrs.alt}
        />
      );

    case "callout":
      return (
        <DocCallout
          type={(block.attrs.type as "tip" | "warning" | "info") || "tip"}
          title={block.attrs.title}
        >
          <MarkdownContent content={block.content} />
        </DocCallout>
      );

    case "mermaid":
      return <DocMermaid chart={block.content} caption={block.attrs.caption} />;

    case "markdown":
      return <MarkdownContent content={block.content} />;

    default:
      return null;
  }
};

/** Render standard markdown content with themed styles */
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  return (
    <div
      className="doc-markdown-content text-base leading-relaxed"
      style={{ color: "var(--theme-text-color, #374151)" }}
    >
      <Markdown
        components={{
          h2: ({ children, ...props }) => (
            <h2
              className="text-2xl font-bold mt-8 mb-4"
              style={{ color: "var(--theme-heading-color, #1f2937)" }}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-xl font-semibold mt-6 mb-3"
              style={{ color: "var(--theme-heading-color, #1f2937)" }}
              {...props}
            >
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-3" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-1 mb-3" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3" {...props}>
              {children}
            </ol>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold" {...props}>
              {children}
            </strong>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="underline"
              style={{ color: "var(--theme-color, #288DD1)" }}
              {...props}
            >
              {children}
            </a>
          ),
          code: ({ children, ...props }) => (
            <code
              className="px-1.5 py-0.5 rounded text-sm font-mono"
              style={{
                backgroundColor: "var(--theme-surface-alt, #f3f4f6)",
                color: "var(--theme-text-color, #374151)",
              }}
              {...props}
            >
              {children}
            </code>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

export default DocBlockRenderer;
