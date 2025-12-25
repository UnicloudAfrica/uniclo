import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import { useNetworkAcls } from "../../../hooks/adminHooks/vpcInfraHooks";

interface NetworkAcl {
  id: string;
  name?: string;
  vpc_id?: string;
  is_default?: boolean;
  entries?: Array<{
    rule_number?: number;
    protocol?: string;
    rule_action?: string;
    cidr_block?: string;
    egress?: boolean;
  }>;
}

const TenantNetworkAcls: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";

  const { data: networkAcls = [], isLoading } = useNetworkAcls(projectId);

  const handleManageRules = (acl: NetworkAcl) => {
    navigate(
      `/tenant-dashboard/infrastructure/network-acl-rules?project=${projectId}&acl=${acl.id}&name=${encodeURIComponent(acl.name || "ACL")}`
    );
  };

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          Network ACLs
        </span>
      }
      description="Stateless firewall rules for subnet traffic control"
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
        <ModernCard className="p-12 text-center text-gray-500">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          No network ACLs found for this project.
        </ModernCard>
      ) : (
        <ModernCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name / ID
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  VPC ID
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Default
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Entries
                </th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {networkAcls.map((acl: NetworkAcl) => (
                <tr key={acl.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{acl.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{acl.id}</div>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-gray-500">{acl.vpc_id}</td>
                  <td className="py-4 px-6">
                    {acl.is_default ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase border border-blue-200">
                        Default
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase border border-gray-200">
                      {acl.entries?.length ?? 0} rules
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleManageRules(acl)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      Manage Rules
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModernCard>
      )}
    </TenantPageShell>
  );
};

export default TenantNetworkAcls;
