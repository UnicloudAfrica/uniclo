import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocNavProps {
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}

const DocNav: React.FC<DocNavProps> = ({ prev, next }) => (
  <nav className="mt-12 pt-6 border-t flex justify-between" style={{ borderColor: "var(--theme-border-color, #e5e7eb)" }}>
    {prev ? (
      <Link to={prev.href} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: "var(--theme-color, #288DD1)" }}>
        <ChevronLeft size={16} /> {prev.label}
      </Link>
    ) : <span />}
    {next ? (
      <Link to={next.href} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: "var(--theme-color, #288DD1)" }}>
        {next.label} <ChevronRight size={16} />
      </Link>
    ) : <span />}
  </nav>
);

export default DocNav;
