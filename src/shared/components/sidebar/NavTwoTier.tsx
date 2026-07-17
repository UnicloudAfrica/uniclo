import React, { useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import type { MenuEntry, MenuGroup, MenuItem } from "./CollapsibleMenu";
import { isMenuGroup } from "./CollapsibleMenu";
import RegionStatusFooter, { type RegionStatus } from "./RegionStatusFooter";

/**
 * 60px icon strip + 200px label column (260px total) — VS Code-style nav.
 *
 * The left strip shows every top-level entry (groups + items) as an icon.
 * The right column lists ALL groups' children at once (each under its group
 * name), so nothing is hidden behind the strip. Clicking a group icon scrolls
 * that group's section into view; clicking a direct item navigates. Ungrouped
 * items appear in a "Quick links" section at the end.
 */

export interface NavTwoTierProps {
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

const renderIcon = (entry: MenuEntry | MenuItem, size = 18) => {
  const Icon = entry.icon as LucideIcon;
  const isLucideIcon = entry.isLucide !== false && typeof entry.icon !== "string";
  if (isLucideIcon) return <Icon size={size} />;
  return (
    <img
      src={entry.icon as string}
      alt={entry.name}
      style={{ width: size, height: size }}
    />
  );
};

const NavTwoTier: React.FC<NavTwoTierProps> = ({
  menuItems,
  onLogout,
  onItemClick,
  regionStatus,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const groups = useMemo(() => menuItems.filter(isMenuGroup) as MenuGroup[], [menuItems]);
  const ungrouped = useMemo(
    () => menuItems.filter((entry) => !isMenuGroup(entry)) as MenuItem[],
    [menuItems],
  );

  // Refs per group so the icon strip can scroll a group's section into view
  // (all groups are listed in the right column simultaneously).
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isItemActive = (path: string) =>
    activePath === path || activePath.startsWith(path + "/");

  const handleStripClick = (entry: MenuEntry) => {
    if (isMenuGroup(entry)) {
      sectionRefs.current[entry.name]?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(entry.path);
      onItemClick?.();
    }
  };

  const handleChildClick = (item: MenuItem) => {
    navigate(item.path);
    onItemClick?.();
  };

  const renderItemButton = (item: MenuItem) => {
    const active = isItemActive(item.path);
    return (
      <li key={item.name}>
        <button
          type="button"
          onClick={() => handleChildClick(item)}
          className="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition"
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
          <span className="text-sm font-medium">{item.name}</span>
        </button>
      </li>
    );
  };

  return (
    <aside
      className="hidden md:flex fixed top-[48px] left-0 z-[1000] h-full w-[260px] border-r"
      style={{
        background: "var(--theme-card-bg)",
        borderColor: "var(--theme-border-color)",
      }}
    >
      {/* Left icon strip (60px) */}
      <div
        className="flex w-[60px] flex-col items-center gap-1 border-r py-3"
        style={{ borderColor: "var(--theme-border-color)" }}
      >
        {menuItems.map((entry) => {
          const isActive = isMenuGroup(entry)
            ? entry.children.some((child) => isItemActive(child.path))
            : isItemActive(entry.path);

          return (
            <button
              key={entry.name}
              type="button"
              onClick={() => handleStripClick(entry)}
              title={entry.name}
              aria-label={entry.name}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition"
              style={{
                background: isActive ? "var(--theme-color-10)" : "transparent",
                color: isActive ? "var(--theme-color)" : "var(--theme-muted-color)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--theme-color-10)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r"
                  style={{ background: "var(--theme-color)" }}
                />
              ) : null}
              {renderIcon(entry, 16)}
            </button>
          );
        })}

        {onLogout ? (
          <div className="mt-auto pb-2">
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-[--theme-badge-failed-bg]"
              style={{ color: "var(--theme-badge-failed-text)" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Right label column (200px) — every group, listed in full */}
      <div className="flex w-[200px] flex-col">
        <div
          className="border-b px-4 py-4"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <div className="t-eyebrow">Menu</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {groups.map((group) => (
            <div
              key={group.name}
              ref={(el) => {
                sectionRefs.current[group.name] = el;
              }}
              className="mb-3"
            >
              <div className="t-eyebrow mb-1 px-3">{group.name}</div>
              <ul className="space-y-0.5">{group.children.map(renderItemButton)}</ul>
            </div>
          ))}

          {ungrouped.length > 0 ? (
            <div className="mb-2">
              <div className="t-eyebrow mb-1 px-3">Quick links</div>
              <ul className="space-y-0.5">{ungrouped.map(renderItemButton)}</ul>
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
      </div>
    </aside>
  );
};

export default NavTwoTier;
