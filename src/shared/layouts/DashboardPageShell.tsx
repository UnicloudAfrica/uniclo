import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import SubheaderBlock from "../components/SubheaderBlock";

const toTitleCase = (value: string = ""): string =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

interface Breadcrumb {
  label: string;
  href?: string;
}

const buildBreadcrumbs = (pathname: string = "", homeHref: string = "/"): Breadcrumb[] => {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return [{ label: "Home", href: homeHref }];
  }

  const crumbs: Breadcrumb[] = segments.map((segment, index) => {
    const label = toTitleCase(segment);
    const href =
      index === segments.length - 1 ? undefined : `/${segments.slice(0, index + 1).join("/")}`;
    return { label, href };
  });

  if (crumbs.length) {
    crumbs[0] = { label: "Home", href: homeHref };
  } else {
    crumbs.unshift({ label: "Home", href: homeHref });
  }

  return crumbs;
};

interface DashboardPageShellProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  subHeaderContent?: React.ReactNode;
  homeHref?: string;
  mainClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  contentWrapper?: React.ElementType;
  contentStyle?: React.CSSProperties;
  disableContentPadding?: boolean;
  backgroundColor?: string;
  customHeader?: React.ReactNode;
}

const DashboardPageShell: React.FC<DashboardPageShellProps> = ({
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
  backgroundColor = "var(--theme-surface-alt, #f9fafb)",
  customHeader,
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

  const sectionClasses = [!disableContentPadding && "p-6 md:p-8", contentClassName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <main className={["dashboard-content-shell", mainClassName].filter(Boolean).join(" ").trim()}>
      {customHeader ? (
        customHeader
      ) : (
        <SubheaderBlock
          breadcrumbs={computedBreadcrumbs}
          title={headerTitle}
          description={description}
          actions={actions}
          subHeaderContent={subHeaderContent}
          className={headerClassName}
        />
      )}

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
