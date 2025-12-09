// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import SharedPricingCalculator from "../../shared/components/billing/SharedPricingCalculator";

const TenantPricingCalculator = () => {
  const navigate = useNavigate();

  return (
    <TenantPageShell
      title="Pricing Calculator"
      description="Calculate pricing for infrastructure resources."
    >
      <SharedPricingCalculator mode="tenant" onExit={() => navigate("/dashboard")} />
    </TenantPageShell>
  );
};

export default TenantPricingCalculator;
