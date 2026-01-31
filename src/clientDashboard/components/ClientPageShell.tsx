import React from "react";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import { ComponentProps } from "react";

type DashboardPageShellProps = ComponentProps<typeof DashboardPageShell>;

type ClientPageShellProps = DashboardPageShellProps;

const ClientPageShell: React.FC<ClientPageShellProps> = (props) => (
  <DashboardPageShell
    homeHref="/client-dashboard"
    mainClassName="client-dashboard-shell"
    backgroundColor="var(--theme-surface-alt)"
    {...props}
  />
);

export default ClientPageShell;
