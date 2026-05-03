import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import type { MenuEntry, MenuItem } from "./CollapsibleMenu";
import { isMenuGroup } from "./CollapsibleMenu";
import RegionStatusFooter, { type RegionStatus } from "./RegionStatusFooter";

/**
 * 284px breathable rail with eyebrow section headers.
 *
 * Compared to the pinned variant, NavRail trades collapsibility for
 * always-on group context: every group renders its label as an
 * uppercase eyebrow with its children listed beneath. Reads top-to-bottom
 * like a Linear or AWS Console sidebar — best when the user is doing
 * exploratory work across many groups in a single session.
 *
 * No collapse toggle and no hover dropdowns — a flat, scrollable list.
 */

export interface NavRailProps {
  menuItems: MenuEntry[];
  sidebarLabel?: string;
  onLogout?: () => void;
  onItemClick?: () => void;
  regionStatus?: {
    code: string;
    label: string;
    detail?: string;
    status?: RegionStatus;
  };
}

interface RailItemProps {
  item: MenuItem;
  active: boolean;
  onClick: () => void;
}

const RailItem: React.FC<RailItemProps> = ({ item, active, onClick }) => {
  const Icon = item.icon as LucideIcon;
  const isLucideIcon = item.isLucide !== false && typeof item.icon !== "string";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition"
      style={{
        background: active ? "var(--theme-color-10)" : "transparent",
        color: active ? "var(--theme-heading-color)" : "var(--theme-muted-color)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--theme-color-10)";
          e.currentTarget.style.color = "var(--theme-heading-color)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--theme-muted-color)";
        }
      }}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r"
          style={{ background: "var(--theme-color)" }}
        />
      ) : null}
      <span className="flex h-5 w-5 items-center justify-center">
        {isLucideIcon ? (
          <Icon size={16} />
        ) : (
          <img src={item.icon as string} alt={item.name} className="h-4 w-4" />
        )}
      </span>
      <span className="text-sm font-medium">{item.name}</span>
    </button>
  );
};

const NavRail: React.FC<NavRailProps> = ({
  menuItems,
  sidebarLabel,
  onLogout,
  onItemClick,
  regionStatus,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const handleNavigate = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const isItemActive = (path: string) =>
    activePath === path || activePath.startsWith(path + "/");

  return (
    <aside
      className="hidden md:flex fixed top-[74px] left-0 z-[1000] h-full w-[284px] flex-col border-r"
      style={{
        background: "var(--theme-card-bg)",
        borderColor: "var(--theme-border-color)",
      }}
    >
      {sidebarLabel ? (
        <div
          className="flex items-center justify-between border-b px-5 py-4 t-eyebrow"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          {sidebarLabel}
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {menuItems.map((entry) => {
          if (isMenuGroup(entry)) {
            return (
              <section key={entry.name} className="mb-5">
                <div className="t-eyebrow mb-1 px-3">{entry.name}</div>
                <ul className="space-y-0.5">
                  {entry.children.map((child) => (
                    <li key={child.name}>
                      <RailItem
                        item={child}
                        active={isItemActive(child.path)}
                        onClick={() => handleNavigate(child.path)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return (
            <ul key={entry.name} className="mb-1">
              <li>
                <RailItem
                  item={entry}
                  active={isItemActive(entry.path)}
                  onClick={() => handleNavigate(entry.path)}
                />
              </li>
            </ul>
          );
        })}

        {onLogout ? (
          <div
            className="mt-4 border-t pt-3"
            style={{ borderColor: "var(--theme-border-color)" }}
          >
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-[--theme-badge-failed-bg]"
              style={{ color: "var(--theme-badge-failed-text)" }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        ) : null}
      </nav>

      {regionStatus ? (
        <RegionStatusFooter
          regionCode={regionStatus.code}
          regionLabel={regionStatus.label}
          detail={regionStatus.detail}
          status={regionStatus.status ?? "operational"}
        />
      ) : null}
    </aside>
  );
};

export default NavRail;
