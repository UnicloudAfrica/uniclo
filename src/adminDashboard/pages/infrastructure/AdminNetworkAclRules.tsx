import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Plus, Trash2, ArrowLeft, RefreshCw, ChevronLeft } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useNetworkAclRules,
  useAddNetworkAclRule,
  useRemoveNetworkAclRule,
} from "../../../shared/hooks/vpcInfraHooks";

interface AclRule {
  rule_number: number;
  protocol: string;
  rule_action: "allow" | "deny";
  egress: boolean;
  cidr_block: string;
  port_range_min?: number;
  port_range_max?: number;
}

const AdminNetworkAclRules: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";
  const aclId = searchParams.get("acl") || "";
  const aclName = searchParams.get("name") || "Network ACL";

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState<AclRule>({
    rule_number: 100,
    protocol: "all",
    rule_action: "allow",
    egress: false,
    cidr_block: "0.0.0.0/0",
  });

  const { data: rulesData, isLoading, refetch } = useNetworkAclRules(projectId, aclId, region);
  const addRuleMutation = useAddNetworkAclRule();
  const removeRuleMutation = useRemoveNetworkAclRule();

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRuleMutation.mutateAsync({
      projectId,
      region,
      networkAclId: aclId,
      payload: newRule,
    });
    setShowAddForm(false);
    setNewRule({ ...newRule, rule_number: newRule.rule_number + 10 });
  };

  const handleRemoveRule = async (ruleNumber: number, egress: boolean) => {
    if (window.confirm(`Remove rule #${ruleNumber}?`)) {
      await removeRuleMutation.mutateAsync({
        projectId,
        region,
        networkAclId: aclId,
        payload: { rule_number: ruleNumber, egress },
      });
    }
  };

  const rules = rulesData?.entries || [];
  const inboundRules = rules
    .filter((r: AclRule) => !r.egress)
    .sort((a: AclRule, b: AclRule) => a.rule_number - b.rule_number);
  const outboundRules = rules
    .filter((r: AclRule) => r.egress)
    .sort((a: AclRule, b: AclRule) => a.rule_number - b.rule_number);

  return (
    <>
      <AdminPageShell
        title={`Rules: ${aclName}`}
        description="Manage stateless traffic filtering rules"
        icon={<ShieldCheck className="w-6 h-6 text-teal-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          {
            label: "Network ACLs",
            href: `/admin-dashboard/infrastructure/network-acls?project=${projectId}&region=${region}`,
          },
          { label: "Rules" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <ModernButton variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </ModernButton>
            <ModernButton variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4" /> Add Rule
            </ModernButton>
          </div>
        }
      >
        {showAddForm && (
          <ModernCard className="p-6 mb-6 bg-teal-50 border-teal-200">
            <form
              onSubmit={handleAddRule}
              className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4"
            >
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Rule #
                </label>
                <input
                  required
                  type="number"
                  value={newRule.rule_number}
                  onChange={(e) =>
                    setNewRule({ ...newRule, rule_number: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Direction
                </label>
                <select
                  value={newRule.egress ? "egress" : "ingress"}
                  onChange={(e) => setNewRule({ ...newRule, egress: e.target.value === "egress" })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ingress">Inbound</option>
                  <option value="egress">Outbound</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Protocol
                </label>
                <select
                  value={newRule.protocol}
                  onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">All Traffic</option>
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="icmp">ICMP</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Action
                </label>
                <select
                  value={newRule.rule_action}
                  onChange={(e) =>
                    setNewRule({ ...newRule, rule_action: e.target.value as "allow" | "deny" })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                >
                  <option value="allow">Allow</option>
                  <option value="deny">Deny</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  CIDR Block
                </label>
                <input
                  required
                  type="text"
                  value={newRule.cidr_block}
                  onChange={(e) => setNewRule({ ...newRule, cidr_block: e.target.value })}
                  placeholder="0.0.0.0/0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <ModernButton
                  type="submit"
                  variant="primary"
                  className="w-full py-2"
                  disabled={addRuleMutation.isPending}
                >
                  {addRuleMutation.isPending ? "..." : "Save"}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        <div className="space-y-8">
          {/* Inbound Rules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Inbound Rules
              </span>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </div>
            <ModernCard className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      #
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Protocol
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Port Range
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Source
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Allow / Deny
                    </th>
                    <th className="text-right py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inboundRules.map((rule: AclRule) => (
                    <tr key={rule.rule_number} className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-bold text-gray-400">{rule.rule_number}</td>
                      <td className="py-3 px-6 uppercase font-mono text-xs">{rule.protocol}</td>
                      <td className="py-3 px-6 text-xs text-gray-600">
                        {rule.port_range_min
                          ? `${rule.port_range_min}-${rule.port_range_max}`
                          : "ALL"}
                      </td>
                      <td className="py-3 px-6 font-mono text-xs">{rule.cidr_block}</td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rule.rule_action === "allow"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {rule.rule_action}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {rule.rule_number !== 32767 && (
                          <button
                            onClick={() => handleRemoveRule(rule.rule_number, false)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ModernCard>
          </div>

          {/* Outbound Rules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Outbound Rules
              </span>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </div>
            <ModernCard className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      #
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Protocol
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Port Range
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Destination
                    </th>
                    <th className="text-left py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Allow / Deny
                    </th>
                    <th className="text-right py-3 px-6 text-[10px] font-bold text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {outboundRules.map((rule: AclRule) => (
                    <tr key={rule.rule_number} className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-bold text-gray-400">{rule.rule_number}</td>
                      <td className="py-3 px-6 uppercase font-mono text-xs">{rule.protocol}</td>
                      <td className="py-3 px-6 text-xs text-gray-600">
                        {rule.port_range_min
                          ? `${rule.port_range_min}-${rule.port_range_max}`
                          : "ALL"}
                      </td>
                      <td className="py-3 px-6 font-mono text-xs">{rule.cidr_block}</td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rule.rule_action === "allow"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {rule.rule_action}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {rule.rule_number !== 32767 && (
                          <button
                            onClick={() => handleRemoveRule(rule.rule_number, true)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ModernCard>
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminNetworkAclRules;
