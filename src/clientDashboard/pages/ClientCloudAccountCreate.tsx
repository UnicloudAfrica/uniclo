import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import CloudAccountCreateForm from "@/shared/components/databases/CloudAccountCreateForm";

const ClientCloudAccountCreate: React.FC = () => (
  <ClientPageShell
    title="Connect Cloud Account"
    description="Add your cloud provider credentials to enable BYOC database deployments"
    contentClassName="space-y-6"
  >
    <CloudAccountCreateForm listPath="/client-dashboard/cloud-accounts" />
  </ClientPageShell>
);

export default ClientCloudAccountCreate;
