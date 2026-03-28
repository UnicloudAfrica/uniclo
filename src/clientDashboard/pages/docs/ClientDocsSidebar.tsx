import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Rocket,
  Server,
  Network,
  HardDrive,
  Database,
  Receipt,
  Zap,
  LifeBuoy,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PREFIX = "/client-dashboard/docs";

interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarSection {
  heading: string;
  links: SidebarLink[];
}

const sections: SidebarSection[] = [
  {
    heading: "Getting Started",
    links: [
      { label: "Home", href: PREFIX, icon: Home },
      { label: "Getting Started", href: `${PREFIX}/getting-started`, icon: Rocket },
    ],
  },
  {
    heading: "Infrastructure",
    links: [
      { label: "Compute & Instances", href: `${PREFIX}/compute`, icon: Server },
      { label: "Networking", href: `${PREFIX}/networking`, icon: Network },
      { label: "Storage", href: `${PREFIX}/storage`, icon: HardDrive },
      { label: "Databases", href: `${PREFIX}/databases`, icon: Database },
    ],
  },
  {
    heading: "Billing",
    links: [
      { label: "Billing & Payments", href: `${PREFIX}/billing`, icon: Receipt },
    ],
  },
  {
    heading: "Advanced",
    links: [
      { label: "Advanced Services", href: `${PREFIX}/advanced`, icon: Zap },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Support", href: `${PREFIX}/support`, icon: LifeBuoy },
    ],
  },
  {
    heading: "Settings",
    links: [
      { label: "Account Settings", href: `${PREFIX}/settings`, icon: Settings },
    ],
  },
];

const ClientDocsSidebar: React.FC = () => (
  <aside
    className="w-[280px] flex-shrink-0 overflow-y-auto border-r py-6 px-4"
    style={{
      borderColor: "var(--theme-border-color, #e5e7eb)",
      backgroundColor: "var(--theme-card-bg, #fff)",
    }}
  >
    <h2
      className="text-sm font-bold uppercase tracking-wider mb-5 px-2"
      style={{ color: "var(--theme-muted-color, #6b7280)" }}
    >
      Client Docs
    </h2>

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
            return (
              <li key={link.href}>
                <NavLink
                  to={link.href}
                  end={link.href === PREFIX}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors"
                  style={({ isActive }) => ({
                    backgroundColor: isActive
                      ? "var(--theme-color-alpha-10, rgba(40,141,209,0.1))"
                      : "transparent",
                    color: isActive
                      ? "var(--theme-color, #288DD1)"
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

export default ClientDocsSidebar;
