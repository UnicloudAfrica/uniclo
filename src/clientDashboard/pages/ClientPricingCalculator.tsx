// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import SharedPricingCalculator from "../../shared/components/billing/SharedPricingCalculator";

const ClientPricingCalculator: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DashboardPageShell
      title="Pricing Calculator"
      description="Estimate costs for your infrastructure."
      homeHref="/client-dashboard"
      mainClassName="client-dashboard-shell"
    >
      <SharedPricingCalculator mode="client" onExit={() => navigate("/client-dashboard")} />
    </DashboardPageShell>
  );
};

export default ClientPricingCalculator;
