import React from "react";
import { designTokens } from "../../../styles/designTokens";

const ProductSideMenu = ({ items = [], activeTab, onTabChange, className = "" }) => {
  return (
    <aside
      className={[
        "w-full max-w-full rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-72 lg:overflow-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4 px-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Inventory Categories
        </h3>
      </div>
      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.id === activeTab;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={[
                "group flex items-center justify-between rounded-2xl px-3 py-2 text-left transition-all",
                isActive
                  ? "bg-primary-500/10 text-primary-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/90",
              ].join(" ")}
              style={{
                border: `1px solid ${
                  isActive
                    ? designTokens.colors.primary[200]
                    : "rgba(148, 163, 184, 0.2)"
                }`,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    isActive
                      ? "bg-primary-500/15 text-primary-600"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500",
                  ].join(" ")}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight">
                    {item.name}
                  </span>
                  {item.caption && (
                    <span className="text-[11px] text-slate-400">
                      {item.caption}
                    </span>
                  )}
                </div>
              </div>
              {item.badge && (
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default ProductSideMenu;
