import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import RansomwarePanel from "@/shared/components/integrations/RansomwarePanel";
import { ResilienceHero } from "@/shared/components/orbit";

export default function AdminRansomware() {
  return (
    <AdminPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="ransomware" role="admin" />
      <RansomwarePanel integrationKey="anycloudflow" />
    </AdminPageShell>
  );
}
