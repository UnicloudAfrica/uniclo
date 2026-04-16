import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import CloudAccountDetail from "@/shared/components/databases/CloudAccountDetail";

const TenantCloudAccountDetail: React.FC = () => (
  <TenantPageShell
    title="Cloud Account"
    description="View and manage cloud account credentials"
    contentClassName="space-y-6"
  >
    <CloudAccountDetail listPath="/dashboard/cloud-accounts" />
  </TenantPageShell>
);

export default TenantCloudAccountDetail;
