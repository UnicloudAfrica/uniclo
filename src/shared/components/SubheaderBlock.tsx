import React, { memo } from "react";
import { Menu } from "lucide-react";
import BreadcrumbTrail from "./BreadcrumbTrail";

const DEFAULT_BREADCRUMB_COLOR = "var(--theme-color, var(--theme-color))";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface SubheaderBlockProps {
  breadcrumbs?: Breadcrumb[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  subHeaderContent?: React.ReactNode;
  icon?: React.ReactNode;
  onOpenMobileMenu?: () => void;
  className?: string;
  breadcrumbColor?: string;
}

const SubheaderBlock: React.FC<SubheaderBlockProps> = ({
  breadcrumbs = [],
  title,
  description,
  actions,
  subHeaderContent,
  icon,
  onOpenMobileMenu,
  className = "",
  breadcrumbColor = DEFAULT_BREADCRUMB_COLOR,
}) => {
  const items = Array.isArray(breadcrumbs) ? breadcrumbs.filter(Boolean) : [];

  return (
    <header
      className={["bg-white border-b border-gray-200 px-6 md:px-8 py-6 space-y-4", className]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      {(onOpenMobileMenu || items.length > 0) && (
        <div className="flex items-center gap-4">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden -ml-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          {items.length > 0 && <BreadcrumbTrail breadcrumbs={items} color={breadcrumbColor} />}
        </div>
      )}

      {(title || description || actions || subHeaderContent) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  {icon}
                </div>
              )}
              <div>
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {description &&
                  (typeof description === "string" ? (
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                  ) : (
                    <div className="mt-1">{description}</div>
                  ))}
              </div>
            </div>
            {subHeaderContent ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {subHeaderContent}
              </div>
            ) : null}
          </div>
          {actions && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div>
          )}
        </div>
      )}
    </header>
  );
};

export default memo(SubheaderBlock);
