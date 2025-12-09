// @ts-nocheck
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const toTitleCase = (value = "") =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const buildBreadcrumbs = (pathname = "") => {
  const segments = pathname.split("/").filter(Boolean);
  // Remove 'dashboard' or 'tenant-dashboard' from the beginning if present,
  // but keep it for the Home link

  const crumbs = segments.map((segment, index) => {
    const label = toTitleCase(segment);
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return { label, href };
  });

  // Ensure Home is first
  if (crumbs.length > 0 && crumbs[0].label.toLowerCase().includes("dashboard")) {
    crumbs[0].label = "Home";
  } else {
    crumbs.unshift({ label: "Home", href: "/dashboard" });
  }

  return crumbs;
};

const BreadcrumbNav = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`font-medium transition-colors ${
                  isLast ? "text-gray-900 font-semibold" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default BreadcrumbNav;
