import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useSubnets } from "../../hooks/adminHooks/vpcInfraHooks";

interface Subnet {
  id: string;
  name?: string;
  cidr?: string;
  cidr_block?: string;
  vpc_id?: string;
  state?: string;
  available_ips?: number;
}

const ClientSubnets: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: subnets = [], isLoading } = useSubnets(projectId);

  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-600" />
          Subnets
        </span>
      }
      description="Network segments within your VPC"
    >
      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{subnets.length}</div>
            <div className="text-sm text-gray-500">Total Subnets</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : subnets.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No subnets found</div>
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
                  CIDR Block
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  State
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Available IPs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subnets.map((subnet: Subnet) => (
                <tr key={subnet.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{subnet.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{subnet.id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {subnet.cidr_block || subnet.cidr}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(subnet.state)}`}
                    >
                      {subnet.state || "unknown"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{subnet.available_ips ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModernCard>
      )}
    </ClientPageShell>
  );
};

export default ClientSubnets;
