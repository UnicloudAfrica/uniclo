import React from "react";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";

interface TenantPageShellProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  subHeaderContent?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

const TenantPageShell: React.FC<TenantPageShellProps> = ({
  title,
  description,
  subHeaderContent,
  children,
  ...shellProps
}) => {
  return (
    <DashboardPageShell
      homeHref="/dashboard"
      title={title}
      description={description}
      subHeaderContent={subHeaderContent}
      backgroundColor="var(--theme-surface-alt)"
      {...shellProps}
    >
      {children}
    </DashboardPageShell>
  );
};

export default TenantPageShell;
