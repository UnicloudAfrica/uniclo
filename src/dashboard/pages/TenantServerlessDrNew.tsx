import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import ServerlessDrPolicyWizard from "@/shared/components/integrations/serverless-dr/ServerlessDrPolicyWizard";

/** Tenant variant of "Set up a Serverless DR policy". */
export default function TenantServerlessDrNew() {
  const navigate = useNavigate();
  return (
    <TenantPageShell
      title="Set up a safety net"
      description="Walk through four quick steps and we'll save your policy as a draft."
      contentClassName="py-6"
    >
      <ServerlessDrPolicyWizard
        onSuccess={(id) => navigate(`/dashboard/serverless-dr/${id}`)}
        onCancel={() => navigate("/dashboard/serverless-dr")}
      />
    </TenantPageShell>
  );
}
