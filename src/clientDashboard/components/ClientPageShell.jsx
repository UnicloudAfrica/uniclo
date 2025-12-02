import React from "react";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";

const ClientPageShell = (props) => (
  <DashboardPageShell
    homeHref="/client-dashboard"
    mainClassName="client-dashboard-shell"
    backgroundColor="#F9FAFB"
    {...props}
  />
);

export default ClientPageShell;
