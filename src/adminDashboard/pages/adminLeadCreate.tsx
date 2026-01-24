// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernButton } from "../../shared/components/ui";
import CreateLead from "./leadComps/createLead";

const AdminLeadCreate = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/admin-dashboard/leads");

  return (
    <>
      <AdminPageShell
        title="Create Lead"
        description="Qualify and onboard a new lead into the revenue pipeline."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Leads
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <CreateLead mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};
export default AdminLeadCreate;
