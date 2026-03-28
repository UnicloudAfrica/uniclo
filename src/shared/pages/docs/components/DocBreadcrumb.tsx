import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface DocBreadcrumbProps {
  crumbs: Crumb[];
}

const DocBreadcrumb: React.FC<DocBreadcrumbProps> = ({ crumbs }) => (
  <nav className="flex items-center gap-1 text-sm mb-4" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
    {crumbs.map((crumb, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight size={14} />}
        {crumb.href && i < crumbs.length - 1 ? (
          <Link to={crumb.href} className="hover:underline" style={{ color: "var(--theme-color, #288DD1)" }}>
            {crumb.label}
          </Link>
        ) : (
          <span className={i === crumbs.length - 1 ? "font-medium" : ""} style={i === crumbs.length - 1 ? { color: "var(--theme-heading-color, #1f2937)" } : undefined}>
            {crumb.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default DocBreadcrumb;
