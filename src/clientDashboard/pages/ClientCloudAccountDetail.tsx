import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import CloudAccountDetail from "@/shared/components/databases/CloudAccountDetail";

const ClientCloudAccountDetail: React.FC = () => (
  <ClientPageShell
    title="Cloud Account"
    description="View and manage cloud account credentials"
    contentClassName="space-y-6"
  >
    <CloudAccountDetail listPath="/client-dashboard/cloud-accounts" />
  </ClientPageShell>
);

export default ClientCloudAccountDetail;
