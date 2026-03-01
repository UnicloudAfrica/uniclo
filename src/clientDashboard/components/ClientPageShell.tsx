import React, { ComponentProps } from "react";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";

type DashboardPageShellProps = ComponentProps<typeof DashboardPageShell>;

const ClientPageShell: React.FC<DashboardPageShellProps> = (props) => (
  <DashboardPageShell
    homeHref="/client-dashboard"
    mainClassName="client-dashboard-shell"
    backgroundColor="var(--theme-surface-alt)"
    {...props}
  />
);

export default ClientPageShell;
