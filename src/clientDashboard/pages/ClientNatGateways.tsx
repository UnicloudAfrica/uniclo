import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useNatGateways } from "../../hooks/adminHooks/vpcInfraHooks";

interface NatGateway {
  id: string;
  name?: string;
  subnet_id?: string;
  public_ip?: string;
  state?: string;
}

const ClientNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: natGateways = [], isLoading } = useNatGateways(projectId);

  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "deleting":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          NAT Gateways
        </span>
      }
      description="Outbound internet access for private subnets"
    >
      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{natGateways.length}</div>
            <div className="text-sm text-gray-500">Total NAT Gateways</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : natGateways.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No NAT gateways found</div>
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
                  Public IP
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  State
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {natGateways.map((nat: NatGateway) => (
                <tr key={nat.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{nat.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{nat.id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{nat.public_ip || "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(nat.state)}`}
                    >
                      {nat.state || "unknown"}
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

export default ClientNatGateways;
