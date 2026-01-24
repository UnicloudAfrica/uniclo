import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Shield,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import ModernButton from "../../../shared/components/ui/ModernButton";
import ModernCard from "../../../shared/components/ui/ModernCard";
import {
  useSecurityGroupRules,
  useAddSecurityGroupRule,
  useRemoveSecurityGroupRule,
} from "../../../shared/hooks/vpcInfraHooks";

interface SecurityGroupRule {
  ip_protocol: string;
  from_port?: number;
  to_port?: number;
  ip_ranges?: Array<{ cidr_ip: string }>;
  description?: string;
}

const COMMON_PROTOCOLS = [
  { value: "tcp", label: "TCP" },
  { value: "udp", label: "UDP" },
  { value: "icmp", label: "ICMP" },
  { value: "-1", label: "All Traffic" },
];

const COMMON_PORTS = [
  { port: 22, name: "SSH" },
  { port: 80, name: "HTTP" },
  { port: 443, name: "HTTPS" },
  { port: 3306, name: "MySQL" },
  { port: 5432, name: "PostgreSQL" },
  { port: 6379, name: "Redis" },
  { port: 27017, name: "MongoDB" },
];

const AdminSecurityGroupRules: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";
  const securityGroupId = searchParams.get("sg") || "";
  const securityGroupName = searchParams.get("name") || "Security Group";

  const [showAddModal, setShowAddModal] = useState(false);
  const [direction, setDirection] = useState<"ingress" | "egress">("ingress");
  const [protocol, setProtocol] = useState("tcp");
  const [portMin, setPortMin] = useState("");
  const [portMax, setPortMax] = useState("");
  const [cidr, setCidr] = useState("0.0.0.0/0");
  const [description, setDescription] = useState("");

  const {
    data: rulesData,
    isLoading,
    refetch,
  } = useSecurityGroupRules(projectId, securityGroupId, region);
  const { mutate: addRule, isPending: isAdding } = useAddSecurityGroupRule();
  const { mutate: removeRule, isPending: isRemoving } = useRemoveSecurityGroupRule();

  const ingressRules = rulesData?.ingress_rules || [];
  const egressRules = rulesData?.egress_rules || [];

  const handleAddRule = () => {
    addRule(
      {
        projectId,
        region,
        securityGroupId,
        payload: {
          direction,
          protocol,
          port_range_min: portMin ? parseInt(portMin) : undefined,
          port_range_max: portMax ? parseInt(portMax) : undefined,
          cidr: cidr || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          resetForm();
        },
      }
    );
  };

  const handleRemoveRule = (rule: SecurityGroupRule, direction: "ingress" | "egress") => {
    if (confirm("Are you sure you want to remove this rule?")) {
      removeRule({
        projectId,
        region,
        securityGroupId,
        payload: {
          direction,
          protocol: rule.ip_protocol,
          port_range_min: rule.from_port,
          port_range_max: rule.to_port,
          cidr: rule.ip_ranges?.[0]?.cidr_ip,
        },
      });
    }
  };

  const resetForm = () => {
    setDirection("ingress");
    setProtocol("tcp");
    setPortMin("");
    setPortMax("");
    setCidr("0.0.0.0/0");
    setDescription("");
  };

  const handleQuickPort = (port: number) => {
    setPortMin(port.toString());
    setPortMax(port.toString());
  };

  const formatPortRange = (from?: number, to?: number) => {
    if (from === -1 || from === undefined) return "All";
    if (from === to) return from.toString();
    return `${from}-${to}`;
  };

  const RuleTable = ({
    rules,
    direction,
    title,
    icon: Icon,
  }: {
    rules: SecurityGroupRule[];
    direction: "ingress" | "egress";
    title: string;
    icon: React.ReactNode;
  }) => (
    <ModernCard className="overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {rules.length} rules
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                Protocol
              </th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                Port Range
              </th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                Source/Destination
              </th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  No {direction} rules
                </td>
              </tr>
            ) : (
              rules.map((rule, idx) => {
                const rawProtocol = rule.ip_protocol;
                const protocol =
                  typeof rawProtocol === "string" || typeof rawProtocol === "number"
                    ? String(rawProtocol)
                    : "";
                const protocolLabel =
                  protocol === "-1" ? "ALL" : protocol ? protocol.toUpperCase() : "—";

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        {protocolLabel}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono text-sm">
                      {formatPortRange(rule.from_port, rule.to_port)}
                    </td>
                    <td className="py-2 px-4">
                      <span className="text-sm font-mono text-gray-600">
                        {rule.ip_ranges?.[0]?.cidr_ip || "All"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleRemoveRule(rule, direction)}
                        disabled={isRemoving}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ModernCard>
  );

  return (
    <>
      <AdminPageShell
        title="Security Group Rules"
        description={`${securityGroupName} (${securityGroupId})`}
        icon={<Shield className="w-6 h-6 text-purple-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "Security Group Rules" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </ModernButton>
            <ModernButton variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              Add Rule
            </ModernButton>
          </div>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{ingressRules.length}</div>
                <div className="text-sm text-gray-500">Inbound Rules</div>
              </div>
            </div>
          </ModernCard>
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowUpFromLine className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{egressRules.length}</div>
                <div className="text-sm text-gray-500">Outbound Rules</div>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Rules Tables */}
        <div className="space-y-6">
          <RuleTable
            rules={ingressRules}
            direction="ingress"
            title="Inbound Rules"
            icon={<ArrowDownToLine className="w-5 h-5 text-green-600" />}
          />
          <RuleTable
            rules={egressRules}
            direction="egress"
            title="Outbound Rules"
            icon={<ArrowUpFromLine className="w-5 h-5 text-blue-600" />}
          />
        </div>

        {/* Add Rule Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Security Group Rule</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDirection("ingress")}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        direction === "ingress"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <ArrowDownToLine className="w-4 h-4 mx-auto mb-1" />
                      Inbound
                    </button>
                    <button
                      onClick={() => setDirection("egress")}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        direction === "egress"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <ArrowUpFromLine className="w-4 h-4 mx-auto mb-1" />
                      Outbound
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {COMMON_PROTOCOLS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {protocol !== "-1" && protocol !== "icmp" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quick Select Port
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_PORTS.map((p) => (
                          <button
                            key={p.port}
                            onClick={() => handleQuickPort(p.port)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                              portMin === p.port.toString()
                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300"
                            }`}
                          >
                            {p.name} ({p.port})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port From
                        </label>
                        <input
                          type="number"
                          value={portMin}
                          onChange={(e) => setPortMin(e.target.value)}
                          placeholder="22"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port To
                        </label>
                        <input
                          type="number"
                          value={portMax}
                          onChange={(e) => setPortMax(e.target.value)}
                          placeholder="22"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {direction === "ingress" ? "Source CIDR" : "Destination CIDR"}
                  </label>
                  <input
                    type="text"
                    value={cidr}
                    onChange={(e) => setCidr(e.target.value)}
                    placeholder="0.0.0.0/0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Use 0.0.0.0/0 for anywhere, or specify a specific IP/range
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <ModernButton
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </ModernButton>
                <ModernButton variant="primary" onClick={handleAddRule} disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Rule"
                  )}
                </ModernButton>
              </div>
            </div>
          </div>
        )}
      </AdminPageShell>
    </>
  );
};

export default AdminSecurityGroupRules;
