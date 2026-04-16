import AdminPageShell from "../components/AdminPageShell";
import { DeveloperPortalContent } from "@/shared/components/developer";

const AdminDeveloperPortal = () => {
  return (
    <AdminPageShell
      title="Developer Portal"
      description="Manage API keys, webhooks, and usage analytics."
    >
      <DeveloperPortalContent context="admin" />
    </AdminPageShell>
  );
};

export default AdminDeveloperPortal;
