import React from "react";
import TenantPageShell from "../../tenantDashboard/components/TenantPageShell";
import RansomwarePanel from "@/shared/components/integrations/RansomwarePanel";

export default function TenantRansomware() {
  return (
    <TenantPageShell
      title="Ransomware Detection"
      description="Monitor backup integrity, detect ransomware threats, and manage recovery actions"
      contentClassName="space-y-6"
    >
      <RansomwarePanel integrationKey="anycloudflow" />
    </TenantPageShell>
  );
}
