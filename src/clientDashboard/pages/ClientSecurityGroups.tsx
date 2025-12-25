import React from "react";
import { useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useSecurityGroups } from "../../hooks/adminHooks/vpcInfraHooks";

interface SecurityGroup {
  id: string;
  name?: string;
  description?: string;
  vpc_id?: string;
  inbound_rules_count?: number;
  outbound_rules_count?: number;
}

const ClientSecurityGroups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: securityGroups = [], isLoading } = useSecurityGroups(projectId);

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Security Groups
        </span>
      }
      description="Virtual firewalls controlling inbound and outbound traffic"
    >
      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{securityGroups.length}</div>
            <div className="text-sm text-gray-500">Total Security Groups</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : securityGroups.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No security groups found</div>
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
                  Description
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Inbound
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Outbound
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {securityGroups.map((sg: SecurityGroup) => (
                <tr key={sg.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{sg.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{sg.id}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{sg.description || "-"}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {sg.inbound_rules_count ?? 0} rules
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {sg.outbound_rules_count ?? 0} rules
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

export default ClientSecurityGroups;
