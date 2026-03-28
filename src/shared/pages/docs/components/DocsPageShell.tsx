import React from "react";

interface DocsPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const DocsPageShell: React.FC<DocsPageShellProps> = ({ title, subtitle, children }) => (
  <article className="max-w-4xl">
    <header className="mb-8">
      <h1 className="text-3xl font-bold" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-lg" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          {subtitle}
        </p>
      )}
    </header>
    <div className="space-y-2">{children}</div>
  </article>
);

export default DocsPageShell;
