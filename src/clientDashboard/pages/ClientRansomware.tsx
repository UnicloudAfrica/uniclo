import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import RansomwarePanel from "@/shared/components/integrations/RansomwarePanel";

export default function ClientRansomware() {
  return (
    <ClientPageShell
      title="Ransomware Detection"
      description="View backup integrity status, ransomware threat alerts, and recovery options"
      contentClassName="space-y-6"
    >
      <RansomwarePanel integrationKey="anycloudflow" />
    </ClientPageShell>
  );
}
