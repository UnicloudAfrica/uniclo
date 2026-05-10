import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import RansomwarePanel from "@/shared/components/integrations/RansomwarePanel";
import { ResilienceHero } from "@/shared/components/orbit";

export default function ClientRansomware() {
  return (
    <ClientPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="ransomware" role="client" />
      <RansomwarePanel integrationKey="anycloudflow" />
    </ClientPageShell>
  );
}
