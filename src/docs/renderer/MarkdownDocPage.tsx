import React, { useMemo } from "react";
import { parseDocMarkdown } from "./parseDocMarkdown";
import DocBlockRenderer from "./DocBlockRenderer";
import DocsPageShell from "@/shared/pages/docs/components/DocsPageShell";
import DocTableOfContents from "@/shared/pages/docs/components/DocTableOfContents";
import DocNav from "@/shared/pages/docs/components/DocNav";

interface MarkdownDocPageProps {
  /** Raw markdown string (imported with ?raw) */
  content: string;
}

const MarkdownDocPage: React.FC<MarkdownDocPageProps> = ({ content }) => {
  const { frontmatter, blocks } = useMemo(() => parseDocMarkdown(content), [content]);

  return (
    <DocsPageShell title={frontmatter.title} subtitle={frontmatter.subtitle}>
      {frontmatter.tocItems && frontmatter.tocItems.length > 0 && (
        <DocTableOfContents items={frontmatter.tocItems} />
      )}

      {blocks.map((block, i) => (
        <DocBlockRenderer key={i} block={block} />
      ))}

      {(frontmatter.prev || frontmatter.next) && (
        <DocNav prev={frontmatter.prev} next={frontmatter.next} />
      )}
    </DocsPageShell>
  );
};

export default MarkdownDocPage;
