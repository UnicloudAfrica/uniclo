import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import DnsManagementContainer from "../../../shared/components/infrastructure/dns/DnsManagementContainer";

const TenantDnsManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  // Default to lagos-1 if not specified, though ideally we'd get this from project settings
  const region = searchParams.get("region") || "lagos-1";

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          DNS Management
        </span>
      }
      description="Manage your domain names and resource record sets"
    >
      <DnsManagementContainer projectId={projectId} region={region} />
    </TenantPageShell>
  );
};

export default TenantDnsManagement;
