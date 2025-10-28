import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import AdminPageHeader from "./AdminPageHeader";
import { designTokens } from "../../styles/designTokens";

const friendlyPathMap = {
  "admin-dashboard": "Home",
  modules: "Modules",
  partners: "Partners",
  clients: "Clients",
  payment: "Payments",
  "support-ticket": "Support",
  overview: "Overview",
  details: "Details",
  products: "Products",
  calculator: "Calculator",
  "calculator-new": "Calculator",
  instances: "Instances",
  pricing: "Pricing",
  product: "Product",
  inventory: "Inventory",
  leads: "Leads",
  quote: "Generate Quote",
  regions: "Regions",
  "region-approvals": "Region Approvals",
  "tax-configuration": "Tax Configuration",
  projects: "Projects",
  "project-details": "Project Details",
  "admin-users": "Admin Users",
  "key-pairs": "Key Pairs",
  "country-pricing": "Country Pricing",
  colocation: "Colocation",
  "add-instance": "Add Instance",
  approvals: "Approvals",
  create: "Create",
  edit: "Edit",
};

const toTitleCase = (value = "") =>
  value
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const buildBreadcrumbs = (pathname = "") => {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) {
    return [{ label: "Home", href: "/admin-dashboard" }];
  }

  const crumbs = segments.map((segment, index) => {
    const label = friendlyPathMap[segment] || toTitleCase(segment);
    const href =
      index === segments.length - 1
        ? undefined
        : `/${segments.slice(0, index + 1).join("/")}`;
    return { label, href };
  });

  if (crumbs.length) {
    crumbs[0] = { label: "Home", href: "/admin-dashboard" };
  } else {
    crumbs.unshift({ label: "Home", href: "/admin-dashboard" });
  }

  return crumbs;
};

const AdminPageShell = ({
  title,
  description,
  breadcrumbs,
  actions,
  subHeaderContent,
  children,
  className = "",
  mainClassName = "",
  contentClassName = "space-y-6",
  contentStyle = {},
  contentBackground,
  disableContentPadding = false,
  contentWrapper = "section",
}) => {
  const location = useLocation();
  const autoBreadcrumbs = useMemo(
    () => buildBreadcrumbs(location?.pathname),
    [location?.pathname]
  );

  const resolvedBreadcrumbs =
    breadcrumbs && breadcrumbs.length
      ? breadcrumbs
      : autoBreadcrumbs;

  const headerTitle =
    title ||
    (resolvedBreadcrumbs.length
      ? resolvedBreadcrumbs[resolvedBreadcrumbs.length - 1].label
      : "Dashboard");

  const sectionClasses = [
    !disableContentPadding && "p-6 md:p-8",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const MainTag = "main";
  const ContentTag = contentWrapper;

  return (
    <MainTag
      className={[
        "dashboard-content-shell",
        "admin-dashboard-shell",
        mainClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
    >
      <AdminPageHeader
        breadcrumbs={resolvedBreadcrumbs}
        title={headerTitle}
        description={description}
        actions={actions}
        subHeaderContent={subHeaderContent}
      />
      <ContentTag
        className={sectionClasses}
        style={{
          backgroundColor: contentBackground ?? designTokens.colors.neutral[25],
          ...contentStyle,
        }}
      >
        {children}
      </ContentTag>
    </MainTag>
  );
};

export default AdminPageShell;
