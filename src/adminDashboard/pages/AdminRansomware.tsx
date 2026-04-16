import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import RansomwarePanel from "@/shared/components/integrations/RansomwarePanel";

export default function AdminRansomware() {
  return (
    <AdminPageShell
      title="Ransomware Detection"
      description="Monitor backup integrity, detect ransomware threats, and manage recovery actions"
      contentClassName="space-y-6"
    >
      <RansomwarePanel integrationKey="anycloudflow" />
    </AdminPageShell>
  );
}
