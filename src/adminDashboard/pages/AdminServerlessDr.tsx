import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";
import { ResilienceHero } from "@/shared/components/orbit";

export default function AdminServerlessDr() {
  const navigate = useNavigate();
  return (
    <AdminPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero
        topic="serverless-dr"
        role="admin"
        primaryCta={{
          label: "Set up a policy",
          onClick: () => navigate("/admin-dashboard/serverless-dr/new"),
        }}
      />
      <ServerlessDrPoliciesList
        context="admin"
        detailBasePath="/admin-dashboard/serverless-dr"
        createPath="/admin-dashboard/serverless-dr/new"
      />
    </AdminPageShell>
  );
}
