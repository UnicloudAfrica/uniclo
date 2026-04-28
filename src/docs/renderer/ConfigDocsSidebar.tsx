import React from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, PenSquare } from "lucide-react";
import type { DocSection } from "../config/adminDocs";

interface ConfigDocsSidebarProps {
  sections: DocSection[];
  baseHref: string;
  label: string;
  /** Show "Manage Docs" editor link (admin only) */
  showEditor?: boolean;
}

const ConfigDocsSidebar: React.FC<ConfigDocsSidebarProps> = ({ sections, baseHref, label, showEditor }) => (
  <aside
    className="w-[280px] flex-shrink-0 overflow-y-auto border-r py-6 px-4"
    style={{
      borderColor: "var(--theme-border-color, #e5e7eb)",
      backgroundColor: "var(--theme-card-bg, #fff)",
    }}
  >
    <div className="flex items-center gap-2 px-2 mb-5">
      <BookOpen size={18} style={{ color: "var(--theme-color, #0A5E3E)" }} />
      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
        {label}
      </span>
    </div>

    {showEditor && (
      <div className="mb-5">
        <NavLink
          to={`${baseHref}/edit`}
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors"
          style={({ isActive }) => ({
            backgroundColor: isActive
              ? "color-mix(in srgb, var(--theme-color, #0A5E3E) 10%, transparent)"
              : "transparent",
            color: isActive
              ? "var(--theme-color, #0A5E3E)"
              : "var(--theme-text-color, #374151)",
          })}
        >
          <PenSquare size={16} />
          Manage Docs
        </NavLink>
      </div>
    )}

    {sections.map((section) => (
      <div key={section.heading} className="mb-5">
        <h3
          className="text-xs font-semibold uppercase tracking-wider px-2 mb-2"
          style={{ color: "var(--theme-muted-color, #9ca3af)" }}
        >
          {section.heading}
        </h3>
        <ul className="space-y-0.5">
          {section.links.map((link) => {
            const Icon = link.icon;
            const href = link.slug ? `${baseHref}/${link.slug}` : baseHref;
            return (
              <li key={link.slug}>
                <NavLink
                  to={href}
                  end={!link.slug}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors"
                  style={({ isActive }) => ({
                    backgroundColor: isActive
                      ? "color-mix(in srgb, var(--theme-color, #0A5E3E) 10%, transparent)"
                      : "transparent",
                    color: isActive
                      ? "var(--theme-color, #0A5E3E)"
                      : "var(--theme-text-color, #374151)",
                  })}
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </aside>
);

export default ConfigDocsSidebar;
