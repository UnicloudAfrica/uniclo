import React from "react";
import { useSearchParams } from "react-router-dom";
import { GitMerge } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useVpcPeering } from "../../hooks/adminHooks/vpcInfraHooks";

interface VpcPeeringConnection {
  id: string;
  name?: string;
  status?: string;
  requester_vpc_id?: string;
  accepter_vpc_id?: string;
}

const ClientVpcPeering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: peeringConnections = [], isLoading } = useVpcPeering(projectId);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending-acceptance":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-violet-600" />
          VPC Peering
        </span>
      }
      description="VPC connections for private communication"
    >
      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <GitMerge className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{peeringConnections.length}</div>
            <div className="text-sm text-gray-500">Peering Connections</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : peeringConnections.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <GitMerge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No VPC peering connections found</div>
        </ModernCard>
      ) : (
        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Requester VPC
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Accepter VPC
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {peeringConnections.map((pc: VpcPeeringConnection) => (
                <tr key={pc.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{pc.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{pc.id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">
                    {pc.requester_vpc_id}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">
                    {pc.accepter_vpc_id}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pc.status)}`}
                    >
                      {pc.status || "unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModernCard>
      )}
    </ClientPageShell>
  );
};

export default ClientVpcPeering;
