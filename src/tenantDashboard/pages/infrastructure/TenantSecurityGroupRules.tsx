import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield, Plus, Trash2, ArrowLeft } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import {
  useSecurityGroupRules,
  useAddSecurityGroupRule,
  useRemoveSecurityGroupRule,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface SecurityRule {
  protocol?: string;
  port_range_min?: number;
  port_range_max?: number;
  cidr?: string;
  direction?: string;
}

const TenantSecurityGroupRules: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const sgId = searchParams.get("sg") || "";
  const sgName = searchParams.get("name") || "Security Group";

  const { data: rules, isLoading } = useSecurityGroupRules(projectId, sgId);
  const addRuleMutation = useAddSecurityGroupRule();
  const removeRuleMutation = useRemoveSecurityGroupRule();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    direction: "ingress" as "ingress" | "egress",
    protocol: "tcp",
    port_range_min: 22,
    port_range_max: 22,
    cidr: "0.0.0.0/0",
  });

  const handleAddRule = async () => {
    await addRuleMutation.mutateAsync({
      projectId,
      securityGroupId: sgId,
      payload: newRule,
    });
    setShowAddForm(false);
    setNewRule({
      direction: "ingress",
      protocol: "tcp",
      port_range_min: 22,
      port_range_max: 22,
      cidr: "0.0.0.0/0",
    });
  };

  const handleRemoveRule = async (rule: SecurityRule) => {
    await removeRuleMutation.mutateAsync({
      projectId,
      securityGroupId: sgId,
      payload: {
        direction: rule.direction as "ingress" | "egress",
        protocol: rule.protocol || "tcp",
        port_range_min: rule.port_range_min,
        port_range_max: rule.port_range_max,
        cidr: rule.cidr,
      },
    });
  };

  const ingressRules = rules?.ingress_rules || [];
  const egressRules = rules?.egress_rules || [];

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          {sgName} - Rules
        </span>
      }
      description={`Manage inbound and outbound rules for ${sgId}`}
      actions={
        <div className="flex gap-2">
          <ModernButton variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </ModernButton>
          <ModernButton variant="primary" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
            Add Rule
          </ModernButton>
        </div>
      }
    >
      {/* Add Rule Form */}
      {showAddForm && (
        <ModernCard className="p-4 mb-6 bg-blue-50 border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3">Add Security Rule</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={newRule.direction}
              onChange={(e) =>
                setNewRule({ ...newRule, direction: e.target.value as "ingress" | "egress" })
              }
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ingress">Inbound</option>
              <option value="egress">Outbound</option>
            </select>
            <select
              value={newRule.protocol}
              onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="icmp">ICMP</option>
              <option value="-1">All</option>
            </select>
            <input
              type="number"
              placeholder="From Port"
              value={newRule.port_range_min}
              onChange={(e) => setNewRule({ ...newRule, port_range_min: parseInt(e.target.value) })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="To Port"
              value={newRule.port_range_max}
              onChange={(e) => setNewRule({ ...newRule, port_range_max: parseInt(e.target.value) })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="CIDR (e.g. 0.0.0.0/0)"
              value={newRule.cidr}
              onChange={(e) => setNewRule({ ...newRule, cidr: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <ModernButton
              variant="primary"
              size="sm"
              onClick={handleAddRule}
              disabled={addRuleMutation.isPending}
            >
              {addRuleMutation.isPending ? "Adding..." : "Add Rule"}
            </ModernButton>
            <ModernButton variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </ModernButton>
          </div>
        </ModernCard>
      )}

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
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Actions
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
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveRule({ ...rule, direction: "ingress" })}
                            className="text-red-600 hover:text-red-800"
                            disabled={removeRuleMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
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
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Actions
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
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveRule({ ...rule, direction: "egress" })}
                            className="text-red-600 hover:text-red-800"
                            disabled={removeRuleMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ModernCard>
            )}
          </div>
        </div>
      )}
    </TenantPageShell>
  );
};

export default TenantSecurityGroupRules;
