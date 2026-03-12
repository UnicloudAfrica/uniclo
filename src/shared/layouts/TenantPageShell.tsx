import React from "react";
import DashboardPageShell from "./DashboardPageShell";

interface TenantPageShellProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  subHeaderContent?: React.ReactNode;
  mainClassName?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const TenantPageShell: React.FC<TenantPageShellProps> = ({
  title,
  description,
  subHeaderContent,
  mainClassName,
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
      mainClassName={mainClassName}
      {...shellProps}
    >
      {children}
    </DashboardPageShell>
  );
};

export default TenantPageShell;
