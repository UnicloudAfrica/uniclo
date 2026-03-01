import React from "react";
import SubheaderBlock from "../../shared/components/SubheaderBlock";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  subHeaderContent?: React.ReactNode;
  icon?: React.ReactNode;
  onOpenMobileMenu?: () => void;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  breadcrumbs = [],
  title,
  description,
  actions,
  subHeaderContent,
  icon,
  onOpenMobileMenu,
}) => {
  const subheaderProps = {
    breadcrumbs,
    title,
    description,
    actions,
    subHeaderContent,
    icon,
    ...(onOpenMobileMenu ? { onOpenMobileMenu } : {}),
  };

  return <SubheaderBlock {...subheaderProps} />;
};

export default AdminPageHeader;
