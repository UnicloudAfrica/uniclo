import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import ServerlessDrPolicyWizard from "@/shared/components/integrations/serverless-dr/ServerlessDrPolicyWizard";
import { RESILIENCE } from "@/shared/branding";

/** Admin variant of "Set up a Serverless DR policy". */
export default function AdminServerlessDrNew() {
  const navigate = useNavigate();
  return (
    <AdminPageShell
      title={`Set up Serverless DR · ${RESILIENCE}`}
      description="Walk through four quick steps and we'll save your policy as a draft."
      contentClassName="py-6"
    >
      <ServerlessDrPolicyWizard
        onSuccess={(id) => navigate(`/admin-dashboard/serverless-dr/${id}`)}
        onCancel={() => navigate("/admin-dashboard/serverless-dr")}
      />
    </AdminPageShell>
  );
}
