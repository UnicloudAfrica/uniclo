import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
const DEFAULT_BREADCRUMB_COLOR = "var(--theme-color, #288DD1)";

const BreadcrumbTrail = ({ breadcrumbs, color = DEFAULT_BREADCRUMB_COLOR, className = "" }) => {
  if (!breadcrumbs?.length) return null;

  return (
    <nav className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={`${item?.label}-${index}`}>
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4"
                color={isLast ? color : `${color}66`}
                style={{ opacity: 0.6 }}
              />
            )}
            {item?.href && !isLast ? (
              <Link
                to={item.href}
                className="font-medium transition-colors hover:opacity-80"
                style={{ color }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium transition-colors"
                style={{
                  color,
                  fontWeight: isLast ? 600 : 500,
                  opacity: isLast ? 1 : 0.65,
                }}
              >
                {item?.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default BreadcrumbTrail;
