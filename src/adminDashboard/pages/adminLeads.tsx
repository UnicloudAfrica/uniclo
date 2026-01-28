// @ts-nocheck
import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import LeadsDashboard from "../../shared/components/customer-management/LeadsDashboard";

const AdminLeads = () => {
  return (
    <AdminPageShell
      title="Leads"
      description="Stay on top of every inquiry—from first contact to close—and spot which prospects need attention next."
      contentClassName="space-y-8"
    >
      <LeadsDashboard context="admin" />
    </AdminPageShell>
  );
};

export default AdminLeads;
