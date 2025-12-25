import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, Plus, Trash2, ArrowLeft } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernButton from "../../../shared/components/ui/ModernButton";
import {
  useNetworkAclRules,
  useAddNetworkAclRule,
  useRemoveNetworkAclRule,
} from "../../../hooks/adminHooks/vpcInfraHooks";

interface NaclRule {
  rule_number: number;
  protocol: string;
  rule_action: "allow" | "deny";
  egress: boolean;
  cidr_block: string;
  port_range?: {
    from: number;
    to: number;
  };
}

const TenantNetworkAclRules: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const aclId = searchParams.get("acl") || "";
  const aclName = searchParams.get("name") || "Network ACL";

  const { data: aclData, isLoading } = useNetworkAclRules(projectId, aclId);
  const addRuleMutation = useAddNetworkAclRule();
  const removeRuleMutation = useRemoveNetworkAclRule();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_number: 100,
    protocol: "tcp",
    rule_action: "allow" as "allow" | "deny",
    egress: false,
    cidr_block: "0.0.0.0/0",
    port_range_min: 0,
    port_range_max: 65535,
  });

  const handleAddRule = async () => {
    await addRuleMutation.mutateAsync({
      projectId,
      networkAclId: aclId,
      payload: newRule,
    });
    setShowAddForm(false);
  };

  const handleRemoveRule = async (ruleNumber: number, egress: boolean) => {
    if (window.confirm(`Remove rule #${ruleNumber}?`)) {
      await removeRuleMutation.mutateAsync({
        projectId,
        networkAclId: aclId,
        payload: { rule_number: ruleNumber, egress },
      });
    }
  };

  const ingressRules =
    aclData?.entries
      ?.filter((r: NaclRule) => !r.egress)
      .sort((a: NaclRule, b: NaclRule) => a.rule_number - b.rule_number) || [];
  const egressRules =
    aclData?.entries
      ?.filter((r: NaclRule) => r.egress)
      .sort((a: NaclRule, b: NaclRule) => a.rule_number - b.rule_number) || [];

  const getActionBadge = (action: string) => {
    return action === "allow"
      ? "bg-green-100 text-green-700 border border-green-200"
      : "bg-red-100 text-red-700 border border-red-200";
  };

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          {aclName} - Rules
        </span>
      }
      description={`Manage inbound and outbound rules for ${aclId}`}
      headerAction={
        <div className="flex gap-2">
          <ModernButton variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </ModernButton>
          <ModernButton variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" />
            {showAddForm ? "Cancel" : "Add Rule"}
          </ModernButton>
        </div>
      }
    >
      {showAddForm && (
        <ModernCard className="p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4 text-lg">Add Network ACL Rule</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Rule #</label>
              <input
                type="number"
                value={newRule.rule_number}
                onChange={(e) => setNewRule({ ...newRule, rule_number: parseInt(e.target.value) })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Direction</label>
              <select
                value={newRule.egress ? "egress" : "ingress"}
                onChange={(e) => setNewRule({ ...newRule, egress: e.target.value === "egress" })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ingress">Inbound</option>
                <option value="egress">Outbound</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Protocol</label>
              <select
                value={newRule.protocol}
                onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
                <option value="-1">All Protocols</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Action</label>
              <select
                value={newRule.rule_action}
                onChange={(e) =>
                  setNewRule({ ...newRule, rule_action: e.target.value as "allow" | "deny" })
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Port Range (Min)</label>
              <input
                type="number"
                placeholder="Port Min"
                value={newRule.port_range_min}
                onChange={(e) =>
                  setNewRule({ ...newRule, port_range_min: parseInt(e.target.value) })
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Port Range (Max)</label>
              <input
                type="number"
                placeholder="Port Max"
                value={newRule.port_range_max}
                onChange={(e) =>
                  setNewRule({ ...newRule, port_range_max: parseInt(e.target.value) })
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">CIDR Block</label>
              <input
                type="text"
                placeholder="0.0.0.0/0"
                value={newRule.cidr_block}
                onChange={(e) => setNewRule({ ...newRule, cidr_block: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <ModernButton variant="secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </ModernButton>
            <ModernButton
              variant="primary"
              onClick={handleAddRule}
              disabled={addRuleMutation.isPending}
            >
              {addRuleMutation.isPending ? "Adding..." : "Save Rule Entry"}
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Inbound Rules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm shadow-green-200" />
                Inbound Rules ({ingressRules.length})
              </h3>
            </div>
            {ingressRules.length === 0 ? (
              <ModernCard className="p-8 text-center text-gray-500 border-dashed">
                No inbound rules defined. Traffic will be blocked by default.
              </ModernCard>
            ) : (
              <ModernCard className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Rule #
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Protocol
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Port Range
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Source
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Action
                      </th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ingressRules.map((rule: NaclRule) => (
                      <tr
                        key={`in-${rule.rule_number}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-gray-900">{rule.rule_number}</td>
                        <td className="py-4 px-6 uppercase font-mono">
                          {rule.protocol === "-1" ? "ALL" : rule.protocol}
                        </td>
                        <td className="py-4 px-6">
                          {rule.port_range
                            ? `${rule.port_range.from} - ${rule.port_range.to}`
                            : "ALL"}
                        </td>
                        <td className="py-4 px-6 font-mono">{rule.cidr_block}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionBadge(rule.rule_action)}`}
                          >
                            {rule.rule_action}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleRemoveRule(rule.rule_number, false)}
                            className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-200" />
                Outbound Rules ({egressRules.length})
              </h3>
            </div>
            {egressRules.length === 0 ? (
              <ModernCard className="p-8 text-center text-gray-500 border-dashed">
                No outbound rules defined. Traffic will be blocked by default.
              </ModernCard>
            ) : (
              <ModernCard className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Rule #
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Protocol
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Port Range
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Destination
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Action
                      </th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {egressRules.map((rule: NaclRule) => (
                      <tr
                        key={`out-${rule.rule_number}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-gray-900">{rule.rule_number}</td>
                        <td className="py-4 px-6 uppercase font-mono">
                          {rule.protocol === "-1" ? "ALL" : rule.protocol}
                        </td>
                        <td className="py-4 px-6">
                          {rule.port_range
                            ? `${rule.port_range.from} - ${rule.port_range.to}`
                            : "ALL"}
                        </td>
                        <td className="py-4 px-6 font-mono">{rule.cidr_block}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionBadge(rule.rule_action)}`}
                          >
                            {rule.rule_action}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleRemoveRule(rule.rule_number, true)}
                            className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
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

export default TenantNetworkAclRules;
