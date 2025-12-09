// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import SharedCreateInvoice from "../../shared/components/billing/SharedCreateInvoice";

const TenantCreateInvoice = () => {
  const navigate = useNavigate();

  return (
    <TenantPageShell title="Generate Invoice" description="Create and send invoices to your users.">
      <SharedCreateInvoice mode="tenant" onExit={() => navigate("/dashboard")} />
    </TenantPageShell>
  );
};

export default TenantCreateInvoice;
