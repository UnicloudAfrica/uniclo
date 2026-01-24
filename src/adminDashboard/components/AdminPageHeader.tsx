// @ts-nocheck
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
  onOpenMobileMenu?: () => void;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  breadcrumbs = [],
  title,
  description,
  actions,
  subHeaderContent,
  onOpenMobileMenu,
}) => {
  return (
    <SubheaderBlock
      breadcrumbs={breadcrumbs}
      title={title}
      description={description}
      actions={actions}
      subHeaderContent={subHeaderContent}
      onOpenMobileMenu={onOpenMobileMenu}
    />
  );
};

export default AdminPageHeader;
