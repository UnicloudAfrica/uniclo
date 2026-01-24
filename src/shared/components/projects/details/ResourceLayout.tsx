import React from "react";
import type { LucideIcon } from "lucide-react";

export interface ResourceNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  category?: string;
  description?: string;
  disabled?: boolean;
}

interface ResourceIndexPanelProps {
  title?: string;
  items: ResourceNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

interface ResourceGroup {
  name: string;
  items: ResourceNavItem[];
}

const buildGroups = (items: ResourceNavItem[]): ResourceGroup[] => {
  const groups: ResourceGroup[] = [];

  items.forEach((item) => {
    const groupName = item.category || "Resources";
    const existing = groups.find((group) => group.name === groupName);
    if (existing) {
      existing.items.push(item);
      return;
    }
    groups.push({ name: groupName, items: [item] });
  });

  return groups;
};

const ResourceIndexPanel: React.FC<ResourceIndexPanelProps> = ({
  title = "Resources",
  items,
  activeId,
  onSelect,
}) => {
  const groups = buildGroups(items);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-2 space-y-4">
        {groups.map((group) => (
          <div key={group.name} className="space-y-1">
            {groups.length > 1 && (
              <div className="px-2 pt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {group.name}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = activeId === item.id;
              const Icon = item.icon;
              const countValue = typeof item.count === "number" ? item.count : null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  disabled={item.disabled}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-blue-100 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
                  } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`p-1.5 rounded-md ${
                        isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    {item.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {countValue ?? "--"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ResourceCanvasProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ResourceCanvas: React.FC<ResourceCanvasProps> = ({
  title,
  description,
  icon: Icon,
  count,
  actions,
  children,
  className,
}) => {
  const countLabel = typeof count === "number" ? `${count} total` : null;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 ${className || ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Icon size={22} />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {countLabel && (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  {countLabel}
                </span>
              )}
            </div>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
};

interface ResourceSplitLayoutProps {
  navTitle?: string;
  items: ResourceNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

const ResourceSplitLayout: React.FC<ResourceSplitLayoutProps> = ({
  navTitle,
  items,
  activeId,
  onSelect,
  children,
  className,
}) => {
  return (
    <div className={`grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-8 ${className || ""}`}>
      <div className="xl:sticky xl:top-24 self-start">
        <ResourceIndexPanel
          title={navTitle}
          items={items}
          activeId={activeId}
          onSelect={onSelect}
        />
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export { ResourceCanvas, ResourceIndexPanel, ResourceSplitLayout };
