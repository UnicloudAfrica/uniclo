import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { designTokens } from "../../styles/designTokens";

const DEFAULT_BREADCRUMB_COLOR = designTokens.colors.primary[500];

const toTitleCase = (value = "") =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const buildBreadcrumbs = (pathname = "", homeHref = "/") => {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return [{ label: "Home", href: homeHref }];
  }

  const crumbs = segments.map((segment, index) => {
    const label = toTitleCase(segment);
    const href =
      index === segments.length - 1
        ? undefined
        : `/${segments.slice(0, index + 1).join("/")}`;
    return { label, href };
  });

  if (crumbs.length) {
    crumbs[0] = { label: "Home", href: homeHref };
  } else {
    crumbs.unshift({ label: "Home", href: homeHref });
  }

  return crumbs;
};

const BreadcrumbTrail = ({
  breadcrumbs,
  color = DEFAULT_BREADCRUMB_COLOR,
}) => {
  if (!breadcrumbs?.length) return null;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={`${item?.label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4" color={`${color}66`} />
            )}
            {item?.href && !isLast ? (
              <Link
                to={item.href}
                className="font-medium text-[#288DD1] transition-colors hover:text-[#0F75B5]"
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

const DashboardPageShell = ({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  subHeaderContent,
  homeHref = "/",
  mainClassName = "",
  headerClassName = "",
  contentClassName = "space-y-6",
  contentWrapper: ContentWrapper = "section",
  contentStyle = {},
  disableContentPadding = false,
  backgroundColor = designTokens.colors.neutral[25],
}) => {
  const location = useLocation();
  const computedBreadcrumbs = useMemo(() => {
    if (breadcrumbs && breadcrumbs.length) {
      return breadcrumbs;
    }
    return buildBreadcrumbs(location?.pathname, homeHref);
  }, [breadcrumbs, location?.pathname, homeHref]);

  const headerTitle =
    title ||
    (computedBreadcrumbs.length
      ? computedBreadcrumbs[computedBreadcrumbs.length - 1].label
      : "Dashboard");

  const sectionClasses = [
    !disableContentPadding && "p-6 md:p-8",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <main
      className={[
        "dashboard-content-shell",
        mainClassName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      <header
        className={[
          "bg-white border-b border-gray-200 px-6 md:px-8 py-6 space-y-4",
          headerClassName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()}
      >
        <BreadcrumbTrail breadcrumbs={computedBreadcrumbs} />

        {(headerTitle || description || actions || subHeaderContent) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3">
              {headerTitle && (
                <h1 className="text-2xl font-bold text-gray-900">
                  {headerTitle}
                </h1>
              )}
              {description &&
                (typeof description === "string" ? (
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                ) : (
                  <div className="mt-1">{description}</div>
                ))}
              {subHeaderContent ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {subHeaderContent}
                </div>
              ) : null}
            </div>
            {actions && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {actions}
              </div>
            )}
          </div>
        )}
      </header>

      <ContentWrapper
        className={sectionClasses}
        style={{
          backgroundColor,
          ...contentStyle,
        }}
      >
        {children}
      </ContentWrapper>
    </main>
  );
};

export default DashboardPageShell;
