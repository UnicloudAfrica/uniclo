import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu } from "lucide-react";

const BREADCRUMB_COLOR = "#288DD1";

const AdminPageHeader = ({
  breadcrumbs = [],
  title,
  description,
  actions,
  subHeaderContent,
  onOpenMobileMenu,
}) => {
  const items = Array.isArray(breadcrumbs)
    ? breadcrumbs.filter(Boolean)
    : [];

  const renderBreadcrumbLabel = (item, isLast) => {
    const baseClasses = "font-medium transition-colors";
    if (item?.href && !isLast) {
      return (
        <Link
          to={item.href}
          className={`${baseClasses} text-[#288DD1] hover:text-[#0F75B5]`}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <span
        className={baseClasses}
        style={{
          color: BREADCRUMB_COLOR,
          fontWeight: isLast ? 600 : 500,
          opacity: isLast ? 1 : 0.65,
        }}
      >
        {item?.label}
      </span>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-6 space-y-4">
      <div className="flex items-center gap-4">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden -ml-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        {items.length > 0 && (
          <nav className="flex flex-wrap items-center text-sm gap-2">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <React.Fragment key={`${item?.label}-${index}`}>
                  {index > 0 && (
                    <ChevronRight
                      className="w-4 h-4"
                      color={`${BREADCRUMB_COLOR}66`}
                    />
                  )}
                  {renderBreadcrumbLabel(item, isLast)}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {(title || description || actions || subHeaderContent) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {description &&
              (typeof description === "string" ? (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              ) : (
                <div className="mt-1">{description}</div>
              ))}
            {subHeaderContent && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {subHeaderContent}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;
