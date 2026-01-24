import React from "react";
import { useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import ModernCard from "../../shared/components/ui/ModernCard";
import { useSecurityGroupRules } from "../../shared/hooks/vpcInfraHooks";

interface SecurityRule {
  protocol?: string;
  port_range_min?: number;
  port_range_max?: number;
  cidr?: string;
}

const ClientSecurityGroupRules: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";
  const sgId = searchParams.get("sg") || "";
  const sgName = searchParams.get("name") || "Security Group";

  const { data: rules, isLoading } = useSecurityGroupRules(projectId, sgId, region);

  const ingressRules = rules?.ingress_rules || [];
  const egressRules = rules?.egress_rules || [];

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          {sgName} - Rules
        </span>
      }
      description={`View rules for security group ${sgId}`}
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Inbound Rules */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Inbound Rules ({ingressRules.length})
            </h3>
            {ingressRules.length === 0 ? (
              <ModernCard className="p-6 text-center text-gray-500">No inbound rules</ModernCard>
            ) : (
              <ModernCard className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Protocol
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Port Range
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ingressRules.map((rule: SecurityRule, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">
                          {rule.protocol?.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {rule.port_range_min === rule.port_range_max
                            ? rule.port_range_min
                            : `${rule.port_range_min} - ${rule.port_range_max}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{rule.cidr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ModernCard>
            )}
          </div>

          {/* Outbound Rules */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Outbound Rules ({egressRules.length})
            </h3>
            {egressRules.length === 0 ? (
              <ModernCard className="p-6 text-center text-gray-500">No outbound rules</ModernCard>
            ) : (
              <ModernCard className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Protocol
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Port Range
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Destination
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {egressRules.map((rule: SecurityRule, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">
                          {rule.protocol?.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {rule.port_range_min === rule.port_range_max
                            ? rule.port_range_min
                            : `${rule.port_range_min} - ${rule.port_range_max}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{rule.cidr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ModernCard>
            )}
          </div>
        </div>
      )}
    </ClientPageShell>
  );
};

export default ClientSecurityGroupRules;
