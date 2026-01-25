// @ts-nocheck
import React from "react";
/**
 * @typedef {Object} PricingMenuItem
 * @property {string} id
 * @property {string} name
 * @property {string} [caption]
 * @property {any} [icon]
 */

/**
 * @typedef {Object} PricingSideMenuProps
 * @property {string} activeTab
 * @property {(tabId: string) => void} onTabChange
 * @property {PricingMenuItem[]} [items]
 * @property {string} [className]
 */

/**
 * @param {PricingSideMenuProps} props
 */
const PricingSideMenu = ({ activeTab, onTabChange, items = [], className = "" }) => {
  const menuItems =
    Array.isArray(items) && items.length
      ? items
      : [
          {
            id: "catalog",
            name: "Pricing catalogue",
            caption: "Platform rates",
          },
        ];

  const resolvedActiveTab = menuItems.find((item) => item.id === activeTab)?.id || menuItems[0].id;

  return (
    <aside
      className={[
        "w-full max-w-full rounded-3xl border border-[--theme-border-color] bg-[--theme-card-bg] p-4 shadow-sm backdrop-blur lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-72 lg:overflow-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4 px-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[--theme-muted-color]">
          Pricing
        </h3>
      </div>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item: any) => {
          const isActive = item.id === resolvedActiveTab;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange?.(item.id)}
              className={[
                "group flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition-all",
                isActive
                  ? "bg-primary-500/10 text-primary-600 shadow-sm border-primary-200"
                  : "text-[--theme-muted-color] border-[--theme-border-color] hover:bg-[--theme-color-10] hover:text-[--theme-heading-color]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    isActive
                      ? "bg-primary-500/15 text-primary-600"
                      : "bg-[--theme-surface-alt] text-[--theme-muted-color] group-hover:bg-[--theme-color-10] group-hover:text-[--theme-heading-color]",
                  ].join(" ")}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight">{item.name}</span>
                  {item.caption && (
                    <span className="text-[11px] text-[--theme-muted-color]">{item.caption}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default PricingSideMenu;
