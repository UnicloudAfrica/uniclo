import React from "react";

interface TocItem {
  id: string;
  label: string;
}

interface DocTableOfContentsProps {
  items: TocItem[];
}

const DocTableOfContents: React.FC<DocTableOfContentsProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <nav
      className="rounded-lg border p-4 mb-8"
      style={{ borderColor: "var(--theme-border-color, #e5e7eb)", backgroundColor: "var(--theme-card-bg, #fff)" }}
    >
      <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
        On this page
      </h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-sm hover:underline" style={{ color: "var(--theme-color, #288DD1)" }}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DocTableOfContents;
