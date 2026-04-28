import AdminPageShell from "../components/AdminPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";
import type React from "react";

export default function AdminProtection() {
  return (
    <ProtectionLanding
      PageShell={AdminPageShell as React.ComponentType<{ title: string; description?: string; children?: React.ReactNode }>}
      context="admin"
      basePath="/admin-dashboard"
      description="Manage replication policies, bidirectional sync, quorum, and traffic control across all tenants"
    />
  );
}
