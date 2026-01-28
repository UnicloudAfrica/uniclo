import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import LeadsDashboard from "../../shared/components/customer-management/LeadsDashboard";

const Leads = () => {
  return (
    <TenantPageShell
      title="Leads"
      description="Track prospects through outreach, qualification, and conversion."
      contentClassName="space-y-8"
    >
      <LeadsDashboard context="tenant" />
    </TenantPageShell>
  );
};

export default Leads;
