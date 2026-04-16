import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import CloudAccountList from "@/shared/components/databases/CloudAccountList";

const TenantCloudAccounts: React.FC = () => (
  <TenantPageShell
    title="Cloud Accounts"
    description="Connect your cloud provider credentials to deploy databases on your own infrastructure (BYOC)"
    contentClassName="space-y-6"
  >
    <CloudAccountList
      context="tenant"
      createPath="/dashboard/cloud-accounts/create"
    />
  </TenantPageShell>
);

export default TenantCloudAccounts;
