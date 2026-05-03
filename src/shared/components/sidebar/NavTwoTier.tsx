import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";
import type { MenuEntry, MenuGroup, MenuItem } from "./CollapsibleMenu";
import { isMenuGroup } from "./CollapsibleMenu";
import RegionStatusFooter, { type RegionStatus } from "./RegionStatusFooter";

/**
 * 60px icon strip + 200px label column (260px total) — VS Code-style nav.
 *
 * The left strip shows every top-level entry (groups + items) as an icon.
 * Hovering or clicking a group icon promotes that group into the right
 * column, where its children are listed with full labels. Direct items
 * (no children) navigate immediately on click.
 *
 * The right column also shows the active group's name as an eyebrow at
 * the top, so the user always knows which set of links they're looking
 * at. Ungrouped items appear in a "Quick links" section.
 *
 * Keeps the shell narrow (260px) while still giving full label legibility
 * — a good middle-ground between Pinned and Rail.
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

  // The "active" group = the one whose child matches the current route.
  // Falls back to the first group, otherwise null.
  const routeActiveGroup = useMemo(() => {
    return (
      groups.find((g) =>
        g.children.some(
          (child) => activePath === child.path || activePath.startsWith(child.path + "/"),
        ),
      ) ?? groups[0]
    );
  }, [groups, activePath]);

  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(
    routeActiveGroup?.name ?? null,
  );

  // Re-sync the selected group when the route changes (so navigating from
  // Quick Links back into a group surfaces that group on the right).
  React.useEffect(() => {
    if (routeActiveGroup && routeActiveGroup.name !== selectedGroupName) {
      setSelectedGroupName(routeActiveGroup.name);
    }
  }, [routeActiveGroup, selectedGroupName]);

  const selectedGroup = groups.find((g) => g.name === selectedGroupName) ?? routeActiveGroup;

  const handleStripClick = (entry: MenuEntry) => {
    if (isMenuGroup(entry)) {
      setSelectedGroupName(entry.name);
      // Navigate to the first child so the right column has live state.
      const firstChild = entry.children[0];
      if (firstChild) {
        navigate(firstChild.path);
        onItemClick?.();
      }
    } else {
      navigate(entry.path);
      onItemClick?.();
    }
  };

  const handleChildClick = (item: MenuItem) => {
    navigate(item.path);
    onItemClick?.();
  };

  const isItemActive = (path: string) =>
    activePath === path || activePath.startsWith(path + "/");

  return (
    <aside
      className="hidden md:flex fixed top-[74px] left-0 z-[1000] h-full w-[260px] border-r"
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
            ? selectedGroupName === entry.name ||
              entry.children.some((child) => isItemActive(child.path))
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

      {/* Right label column (200px) */}
      <div className="flex w-[200px] flex-col">
        <div
          className="border-b px-4 py-4"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <div className="t-eyebrow">{selectedGroup?.name ?? "Menu"}</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {selectedGroup ? (
            <ul className="space-y-0.5">
              {selectedGroup.children.map((child) => {
                const active = isItemActive(child.path);
                return (
                  <li key={child.name}>
                    <button
                      type="button"
                      onClick={() => handleChildClick(child)}
                      className="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition"
                      style={{
                        background: active ? "var(--theme-color-10)" : "transparent",
                        color: active
                          ? "var(--theme-heading-color)"
                          : "var(--theme-muted-color)",
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
                      <span className="text-sm font-medium">{child.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {ungrouped.length > 0 ? (
            <div className="mt-4">
              <div className="t-eyebrow mb-1 px-3">Quick links</div>
              <ul className="space-y-0.5">
                {ungrouped.map((item) => {
                  const active = isItemActive(item.path);
                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => handleChildClick(item)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition"
                        style={{
                          background: active ? "var(--theme-color-10)" : "transparent",
                          color: active
                            ? "var(--theme-heading-color)"
                            : "var(--theme-muted-color)",
                        }}
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
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
