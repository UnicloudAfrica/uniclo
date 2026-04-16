import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import CloudAccountList from "@/shared/components/databases/CloudAccountList";

const ClientCloudAccounts: React.FC = () => (
  <ClientPageShell
    title="Cloud Accounts"
    description="Connect your cloud provider credentials for BYOC database deployments"
    contentClassName="space-y-6"
  >
    <CloudAccountList
      context="client"
      createPath="/client-dashboard/cloud-accounts/create"
    />
  </ClientPageShell>
);

export default ClientCloudAccounts;
