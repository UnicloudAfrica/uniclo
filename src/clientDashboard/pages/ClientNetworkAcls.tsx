import React from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useNetworkAcls } from "../../hooks/adminHooks/vpcInfraHooks";

interface NetworkAcl {
  id: string;
  name?: string;
  vpc_id?: string;
  is_default?: boolean;
  entries?: Array<any>;
}

const ClientNetworkAcls: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const { data: networkAcls = [], isLoading } = useNetworkAcls(projectId);

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          Network ACLs
        </span>
      }
      description="Stateless firewall rules for subnet traffic"
    >
      <ModernCard className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{networkAcls.length}</div>
            <div className="text-sm text-gray-500">Total Network ACLs</div>
          </div>
        </div>
      </ModernCard>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : networkAcls.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">No network ACLs found</div>
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
                  Default
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Entries
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {networkAcls.map((acl: NetworkAcl) => (
                <tr key={acl.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{acl.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-500 font-mono">{acl.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    {acl.is_default ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        Default
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {acl.entries?.length ?? 0} rules
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

export default ClientNetworkAcls;
