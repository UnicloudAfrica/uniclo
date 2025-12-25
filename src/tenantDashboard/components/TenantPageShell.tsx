// @ts-nocheck
import React from "react";
// @ts-ignore
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";

interface TenantPageShellProps {
  [key: string]: any;
}

const TenantPageShell: React.FC<TenantPageShellProps> = (props: any) => (
  <DashboardPageShell
    homeHref="/dashboard"
    mainClassName="tenant-dashboard-shell"
    backgroundColor="#F9FAFB"
    {...props}
  />
);

export default TenantPageShell;
