import React from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import ModernButton from "../../adminDashboard/components/ModernButton";
import CreateLead from "./leadComps/createLead";

const DashboardLeadCreate = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/dashboard/leads");

  return (
    <TenantPageShell
      title="Create Lead"
      description="Qualify and onboard a new lead into your partner pipeline."
      subHeaderContent={
        <ModernButton variant="outline" onClick={goBack}>
          Back to leads
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <CreateLead mode="page" onClose={goBack} />
    </TenantPageShell>
  );
};

export default DashboardLeadCreate;
