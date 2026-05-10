import React from "react";
import TenantPageShell from "../../tenantDashboard/components/TenantPageShell";
import RansomwarePanel from "@/shared/components/integrations/RansomwarePanel";
import { ResilienceHero } from "@/shared/components/orbit";

export default function TenantRansomware() {
  return (
    <TenantPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="ransomware" role="tenant" />
      <RansomwarePanel integrationKey="anycloudflow" />
    </TenantPageShell>
  );
}
