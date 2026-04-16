import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import CloudAccountCreateForm from "@/shared/components/databases/CloudAccountCreateForm";

const TenantCloudAccountCreate: React.FC = () => (
  <TenantPageShell
    title="Connect Cloud Account"
    description="Add your cloud provider credentials to enable BYOC (Bring Your Own Cloud) database deployments"
    contentClassName="space-y-6"
  >
    <CloudAccountCreateForm listPath="/dashboard/cloud-accounts" />
  </TenantPageShell>
);

export default TenantCloudAccountCreate;
