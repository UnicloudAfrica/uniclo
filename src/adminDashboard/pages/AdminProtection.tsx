import AdminPageShell from "../components/AdminPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";

export default function AdminProtection() {
  return (
    <ProtectionLanding
      PageShell={AdminPageShell}
      context="admin"
      basePath="/admin-dashboard"
      description="Manage replication policies, bidirectional sync, quorum, and traffic control across all tenants"
    />
  );
}
