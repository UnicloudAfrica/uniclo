import React, { useState } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeft,
  Shield,
  Info,
  Pencil,
} from "lucide-react";
import ModernButton from "@/shared/components/ui/ModernButton";
import ModernCard from "@/shared/components/ui/ModernCard";
import {
  useSecurityGroupRules,
  useAddSecurityGroupRule,
  useRemoveSecurityGroupRule,
} from "@/shared/hooks/vpcInfraHooks";
import type { SecurityGroupRule, SecurityGroup } from "./types";

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

type RemoteType = "any" | "cidr" | "group";

export interface SecurityGroupRulesViewProps {
  projectId: string;
  region: string;
  securityGroupId: string;
  securityGroupName: string;
  securityGroupDescription?: string;
  vpcName?: string;
  projectName?: string;
  tenantName?: string;
  onBack?: () => void;
  onModify?: () => void;
  /** Other security groups in the same project for "Group" remote type */
  availableSecurityGroups?: SecurityGroup[];
}

const SecurityGroupRulesView: React.FC<SecurityGroupRulesViewProps> = ({
  projectId,
  region,
  securityGroupId,
  securityGroupName,
  securityGroupDescription,
  vpcName,
  projectName,
  tenantName,
  onBack,
  onModify,
  availableSecurityGroups = [],
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [direction, setDirection] = useState<"ingress" | "egress">("ingress");
  const [ethertype, setEthertype] = useState<"IPv4" | "IPv6">("IPv4");
  const [protocol, setProtocol] = useState("tcp");
  const [portMin, setPortMin] = useState("");
  const [portMax, setPortMax] = useState("");
  const [cidr, setCidr] = useState("0.0.0.0/0");
  const [remoteType, setRemoteType] = useState<RemoteType>("cidr");
  const [remoteGroupId, setRemoteGroupId] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");

  const {
    data: rulesData,
    isLoading,
    isFetching,
    refetch,
  } = useSecurityGroupRules(projectId, securityGroupId, region);
  const { mutate: addRule, isPending: isAdding } = useAddSecurityGroupRule();
  const { mutate: removeRule, isPending: isRemoving } = useRemoveSecurityGroupRule();

  const ingressRules: SecurityGroupRule[] = rulesData?.ingress_rules || [];
  const egressRules: SecurityGroupRule[] = rulesData?.egress_rules || [];

  const handleAddRule = () => {
    const payload: {
      direction: "egress" | "ingress";
      protocol: string;
      port_range_min?: number;
      port_range_max?: number;
      cidr?: string;
      ethertype?: string;
      remote_group_id?: string;
    } = { direction, protocol };

    if (ethertype) payload.ethertype = ethertype;

    const parsedMin = portMin ? parseInt(portMin) : undefined;
    const parsedMax = portMax ? parseInt(portMax) : undefined;
    if (parsedMin !== undefined) payload.port_range_min = parsedMin;
    if (parsedMax !== undefined) payload.port_range_max = parsedMax;

    if (remoteType === "cidr" && cidr) {
      payload.cidr = cidr;
    } else if (remoteType === "group" && remoteGroupId) {
      payload.remote_group_id = remoteGroupId;
    }
    // "any" = no cidr restriction

    addRule(
      { projectId, region, securityGroupId, payload },
      {
        onSuccess: () => {
          setShowAddModal(false);
          resetForm();
        },
      }
    );
  };

  const handleRemoveRule = (rule: SecurityGroupRule, dir: "ingress" | "egress") => {
    if (confirm("Are you sure you want to remove this rule?")) {
      const payload: {
        direction: "egress" | "ingress";
        protocol: string;
        port_range_min?: number;
        port_range_max?: number;
        cidr?: string;
      } = { direction: dir, protocol: String(rule.ip_protocol) };
      if (rule.from_port !== undefined) payload.port_range_min = rule.from_port;
      if (rule.to_port !== undefined) payload.port_range_max = rule.to_port;
      const ruleCidr = rule.ip_ranges?.[0]?.cidr_ip;
      if (ruleCidr) payload.cidr = ruleCidr;

      removeRule({ projectId, region, securityGroupId, payload });
    }
  };

  const resetForm = () => {
    setDirection("ingress");
    setEthertype("IPv4");
    setProtocol("tcp");
    setPortMin("");
    setPortMax("");
    setCidr("0.0.0.0/0");
    setRemoteType("cidr");
    setRemoteGroupId("");
    setRuleDescription("");
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

  const resolveRemote = (rule: SecurityGroupRule): { type: string; value: string } => {
    if (rule.groups && rule.groups.length > 0) {
      const g = rule.groups[0];
      return { type: "Group", value: g.group_name || g.group_id };
    }
    if (rule.ipv6_ranges && rule.ipv6_ranges.length > 0) {
      return { type: "CIDR", value: rule.ipv6_ranges[0].cidr_ipv6 };
    }
    if (rule.ip_ranges && rule.ip_ranges.length > 0) {
      return { type: "CIDR", value: rule.ip_ranges[0].cidr_ip };
    }
    return { type: "Any", value: "ANY" };
  };

  const resolveEthertype = (rule: SecurityGroupRule): string => {
    if (rule.ethertype) return rule.ethertype;
    if (rule.ipv6_ranges && rule.ipv6_ranges.length > 0) return "IPv6";
    return "IPv4";
  };

  const RuleTable = ({
    rules,
    direction: dir,
    title,
    icon: Icon,
  }: {
    rules: SecurityGroupRule[];
    direction: "ingress" | "egress";
    title: string;
    icon: React.ReactNode;
  }) => (
    <ModernCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div className="flex items-center gap-2">
          {Icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {rules.length} rules
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-semibold uppercase text-gray-600">
                Type
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold uppercase text-gray-600">
                Direction
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold uppercase text-gray-600">
                Protocol
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold uppercase text-gray-600">
                Port Range
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold uppercase text-gray-600">
                Remote
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold uppercase text-gray-600">
                Remote Value
              </th>
              <th className="py-2 px-4 text-right text-xs font-semibold uppercase text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No {dir} rules
                </td>
              </tr>
            ) : (
              rules.map((rule, idx) => {
                const rawProtocol = rule.ip_protocol;
                const proto =
                  typeof rawProtocol === "string" || typeof rawProtocol === "number"
                    ? String(rawProtocol)
                    : "";
                const protocolLabel =
                  proto === "-1" ? "ANY" : proto ? proto.toUpperCase() : "—";
                const remote = resolveRemote(rule);
                const ether = resolveEthertype(rule);

                return (
                  <tr key={idx} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${
                        ether === "IPv6"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {ether}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${
                        dir === "ingress"
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {dir === "ingress" ? "INGRESS" : "EGRESS"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {protocolLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">
                      {formatPortRange(rule.from_port, rule.to_port)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${
                        remote.type === "Group"
                          ? "bg-amber-50 text-amber-700"
                          : remote.type === "CIDR"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {remote.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-sm text-gray-600">
                        {remote.value}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemoveRule(rule, dir)}
                        disabled={isRemoving}
                        className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {securityGroupName}
              </h2>
              <p className="text-sm text-gray-500">
                Security group rules
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onModify && (
            <ModernButton variant="secondary" size="sm" onClick={onModify}>
              <Pencil className="h-4 w-4" />
              Modify
            </ModernButton>
          )}
          <ModernButton
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </ModernButton>
          <ModernButton variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Rule
          </ModernButton>
        </div>
      </div>

      {/* Info Section */}
      <ModernCard className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <h3 className="font-semibold text-gray-900">Info</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Name</div>
            <div className="text-sm font-medium text-gray-900">{securityGroupName || "—"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Description</div>
            <div className="text-sm text-gray-700">{securityGroupDescription || "—"}</div>
          </div>
          {vpcName && (
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500 mb-1">VPC</div>
              <div className="text-sm text-blue-600">{vpcName}</div>
            </div>
          )}
          {projectName && (
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Project</div>
              <div className="text-sm text-gray-700">{projectName}</div>
            </div>
          )}
          {tenantName && (
            <div>
              <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Tenant</div>
              <div className="text-sm text-gray-700">{tenantName}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">ID</div>
            <div className="text-sm font-mono text-gray-500">{securityGroupId}</div>
          </div>
        </div>
      </ModernCard>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <ArrowDownToLine className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{ingressRules.length}</div>
              <div className="text-sm text-gray-500">Inbound Rules</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ArrowUpFromLine className="h-5 w-5 text-blue-600" />
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
          icon={<ArrowDownToLine className="h-5 w-5 text-green-600" />}
        />
        <RuleTable
          rules={egressRules}
          direction="egress"
          title="Outbound Rules"
          icon={<ArrowUpFromLine className="h-5 w-5 text-blue-600" />}
        />
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Add Security Group Rule</h2>

            <div className="space-y-4">
              {/* Type (IPv4/IPv6) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEthertype("IPv4");
                      setCidr("0.0.0.0/0");
                    }}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      ethertype === "IPv4"
                        ? "border-slate-500 bg-slate-50 text-slate-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    IPv4
                  </button>
                  <button
                    onClick={() => {
                      setEthertype("IPv6");
                      setCidr("::/0");
                    }}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      ethertype === "IPv6"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    IPv6
                  </button>
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Direction</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDirection("ingress")}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 transition-colors ${
                      direction === "ingress"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <ArrowDownToLine className="mx-auto mb-1 h-4 w-4" />
                    Inbound
                  </button>
                  <button
                    onClick={() => setDirection("egress")}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 transition-colors ${
                      direction === "egress"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <ArrowUpFromLine className="mx-auto mb-1 h-4 w-4" />
                    Outbound
                  </button>
                </div>
              </div>

              {/* Protocol */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Protocol</label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {COMMON_PROTOCOLS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Port selection */}
              {protocol !== "-1" && protocol !== "icmp" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Quick Select Port
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_PORTS.map((p) => (
                        <button
                          key={p.port}
                          onClick={() => handleQuickPort(p.port)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            portMin === p.port.toString()
                              ? "border-blue-300 bg-blue-100 text-blue-700"
                              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300"
                          }`}
                        >
                          {p.name} ({p.port})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Start Port
                      </label>
                      <input
                        type="number"
                        value={portMin}
                        onChange={(e) => setPortMin(e.target.value)}
                        placeholder="22"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        End Port
                      </label>
                      <input
                        type="number"
                        value={portMax}
                        onChange={(e) => setPortMax(e.target.value)}
                        placeholder="22"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Remote Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Remote</label>
                <select
                  value={remoteType}
                  onChange={(e) => setRemoteType(e.target.value as RemoteType)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any</option>
                  <option value="cidr">CIDR</option>
                  <option value="group">Group</option>
                </select>
              </div>

              {/* CIDR input */}
              {remoteType === "cidr" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {direction === "ingress" ? "Source CIDR" : "Destination CIDR"}
                  </label>
                  <input
                    type="text"
                    value={cidr}
                    onChange={(e) => setCidr(e.target.value)}
                    placeholder={ethertype === "IPv6" ? "::/0" : "0.0.0.0/0"}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-1 text-xs text-gray-400">
                    Use {ethertype === "IPv6" ? "::/0" : "0.0.0.0/0"} for anywhere, or specify a specific IP/range
                  </div>
                </div>
              )}

              {/* Security Group selector */}
              {remoteType === "group" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Security Group
                  </label>
                  <select
                    value={remoteGroupId}
                    onChange={(e) => setRemoteGroupId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select security group...</option>
                    {availableSecurityGroups.map((sg) => (
                      <option key={sg.id} value={sg.provider_resource_id || sg.id}>
                        {sg.name || sg.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="e.g. Allow SSH from office"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
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
                    <RefreshCw className="h-4 w-4 animate-spin" />
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
    </div>
  );
};

export default SecurityGroupRulesView;
