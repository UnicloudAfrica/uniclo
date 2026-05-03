import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { createElement } from "react";
import type { MenuEntry, MenuItem, MenuGroup } from "@/shared/components/sidebar";
import type { CommandPaletteItem } from "./CommandPalette";

const isMenuGroup = (entry: MenuEntry): entry is MenuGroup =>
  "children" in entry && Array.isArray((entry as MenuGroup).children);

const renderIcon = (icon: MenuItem["icon"] | undefined): React.ReactNode => {
  if (!icon) return null;
  if (typeof icon === "string") return null; // Material/iconify name — skip in palette.
  // Lucide component reference.
  return createElement(icon as LucideIcon, { size: 14 });
};

/**
 * Flatten the role-specific sidebar menu config into a flat list of
 * `CommandPaletteItem`s for the global ⌘K search.
 *
 * Group entries become the `category`; menu items are the navigable
 * targets. Leaf groups (no children) are skipped.
 */
export const useMenuPaletteItems = (menu: MenuEntry[]): CommandPaletteItem[] => {
  return useMemo(() => {
    const out: CommandPaletteItem[] = [];

    for (const entry of menu) {
      if (isMenuGroup(entry)) {
        for (const child of entry.children) {
          out.push({
            id: `${entry.name}::${child.path}`,
            title: child.name,
            category: entry.name,
            path: child.path,
            icon: renderIcon(child.icon),
          });
        }
      } else {
        out.push({
          id: entry.path,
          title: entry.name,
          category: "General",
          path: entry.path,
          icon: renderIcon(entry.icon),
        });
      }
    }

    return out;
  }, [menu]);
};

export default useMenuPaletteItems;
