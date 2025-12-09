// @ts-nocheck
import React from "react";
// @ts-ignore
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";

interface ClientPageShellProps {
  [key: string]: any;
}

const ClientPageShell: React.FC<ClientPageShellProps> = (props: any) => (
  <DashboardPageShell
    homeHref="/client-dashboard"
    mainClassName="client-dashboard-shell"
    backgroundColor="#F9FAFB"
    {...props}
  />
);

export default ClientPageShell;
