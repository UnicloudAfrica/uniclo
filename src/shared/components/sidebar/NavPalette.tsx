import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import type { MenuEntry, MenuGroup, MenuItem } from "./CollapsibleMenu";
import { isMenuGroup } from "./CollapsibleMenu";
import RegionStatusFooter, { type RegionStatus } from "./RegionStatusFooter";

/**
 * 72px icon-only palette rail.
 *
 * The minimum-chrome variant — pair with `⌘K` command palette for
 * keyboard-driven navigation. No labels, no expansion, no hover
 * dropdowns; users either know where they're going or use search.
 *
 * Groups are flattened — the first child of each group becomes the
 * representative click target, since there's no room to disclose
 * children.
 *
 * Region status is shown as a single coloured dot at the bottom because
 * a 72px-wide footer can't carry copy.
 */

export interface NavPaletteProps {
  menuItems: MenuEntry[];
  onLogout?: () => void;
  onItemClick?: () => void;
  regionStatus?: {
    code: string;
    label: string;
    detail?: string;
    status?: RegionStatus;
  };
}

const flatten = (entry: MenuEntry): MenuItem => {
  if (isMenuGroup(entry)) {
    // Use the group's icon but route to its first child.
    return {
      name: entry.name,
      icon: entry.icon,
      isLucide: entry.isLucide,
      path: entry.children[0]?.path ?? "#",
    };
  }
  return entry;
};

const NavPalette: React.FC<NavPaletteProps> = ({
  menuItems,
  onLogout,
  onItemClick,
  regionStatus,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const handleClick = (item: MenuItem) => {
    navigate(item.path);
    onItemClick?.();
  };

  const isActive = (item: MenuItem | MenuGroup): boolean => {
    if (isMenuGroup(item)) {
      return item.children.some(
        (child) => activePath === child.path || activePath.startsWith(child.path + "/"),
      );
    }
    return activePath === item.path || activePath.startsWith(item.path + "/");
  };

  return (
    <aside
      className="hidden md:flex fixed top-[74px] left-0 z-[1000] h-full w-[72px] flex-col items-center border-r"
      style={{
        background: "var(--theme-card-bg)",
        borderColor: "var(--theme-border-color)",
      }}
    >
      <nav className="flex flex-1 flex-col items-center gap-1 py-3 overflow-y-auto">
        {menuItems.map((entry) => {
          const flat = flatten(entry);
          const active = isActive(entry);
          const Icon = flat.icon as LucideIcon;
          const isLucideIcon = flat.isLucide !== false && typeof flat.icon !== "string";
          return (
            <button
              key={flat.name}
              type="button"
              onClick={() => handleClick(flat)}
              title={flat.name}
              aria-label={flat.name}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition"
              style={{
                background: active ? "var(--theme-color-10)" : "transparent",
                color: active ? "var(--theme-color)" : "var(--theme-muted-color)",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--theme-color-10)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Active indicator stripe on the left edge */}
              {active ? (
                <span
                  aria-hidden
                  className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r"
                  style={{ background: "var(--theme-color)" }}
                />
              ) : null}
              {isLucideIcon ? (
                <Icon size={18} />
              ) : (
                <img
                  src={flat.icon as string}
                  alt={flat.name}
                  className="h-[18px] w-[18px]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls: region pulse + logout */}
      <div className="flex flex-col items-center gap-2 pb-4">
        {regionStatus ? (
          <RegionStatusFooter
            regionCode={regionStatus.code}
            regionLabel={regionStatus.label}
            detail={regionStatus.detail}
            status={regionStatus.status ?? "operational"}
            collapsed
          />
        ) : null}
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-[--theme-badge-failed-bg]"
            style={{ color: "var(--theme-badge-failed-text)" }}
          >
            <LogOut size={18} />
          </button>
        ) : null}
      </div>
    </aside>
  );
};

export default NavPalette;
