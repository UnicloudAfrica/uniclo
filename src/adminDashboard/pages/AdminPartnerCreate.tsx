// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import AddPartner from "../components/partnersComponent/AddPartner";
import { ModernButton } from "../../shared/components/ui";

const AdminPartnerCreate = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/admin-dashboard/partners");

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Add Partner"
        description="Capture partner business information and onboarding documents."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Partners
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu activeTab="partners" {...({} as any)} />
        <AddPartner isOpen mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminPartnerCreate;
