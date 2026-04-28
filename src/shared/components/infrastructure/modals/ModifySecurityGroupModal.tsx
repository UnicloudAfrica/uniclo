import React, { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw, X } from "lucide-react";
import ModernButton from "../../ui/ModernButton";
import type { SecurityGroup, SecurityGroupRule } from "../types";

/** Local editable row representation */
interface EditableRule {
  key: string;
  ethertype: "IPv4" | "IPv6";
  direction: "ingress" | "egress";
  description: string;
  protocol: string;
  startPort: string;
  endPort: string;
  remoteType: "any" | "cidr" | "group";
  remoteValue: string;
  /** Whether this rule existed before (for diff on save) */
  isOriginal: boolean;
  /** Original data for comparison */
  original?: SecurityGroupRule & { _direction?: "ingress" | "egress" };
}

interface ModifySecurityGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityGroup: SecurityGroup;
  ingressRules: SecurityGroupRule[];
  egressRules: SecurityGroupRule[];
  /** All security groups in this project (for "Group" remote type) */
  availableSecurityGroups?: SecurityGroup[];
  /** Callbacks */
  onUpdateSg?: (name: string, description: string) => void;
  onAddRule: (payload: {
    direction: "ingress" | "egress";
    protocol: string;
    port_range_min?: number;
    port_range_max?: number;
    cidr?: string;
    ethertype?: string;
    remote_group_id?: string;
  }) => Promise<void> | void;
  onRemoveRule: (
    rule: SecurityGroupRule,
    direction: "ingress" | "egress"
  ) => Promise<void> | void;
  isSaving?: boolean;
}

const PROTOCOLS = [
  { value: "-1", label: "ANY" },
  { value: "icmp", label: "ICMP" },
  { value: "tcp", label: "TCP" },
  { value: "udp", label: "UDP" },
];

let keyCounter = 0;
const nextKey = () => `rule-${++keyCounter}`;

const ruleToEditable = (
  rule: SecurityGroupRule,
  dir: "ingress" | "egress"
): EditableRule => {
  const proto = String(rule.ip_protocol ?? "-1");

  let remoteType: "any" | "cidr" | "group" = "any";
  let remoteValue = "";
  if (rule.groups && rule.groups.length > 0) {
    remoteType = "group";
    remoteValue = rule.groups[0].group_name
      ? `${rule.groups[0].group_name} | ${rule.groups[0].group_id}`
      : rule.groups[0].group_id;
  } else if (rule.ip_ranges && rule.ip_ranges.length > 0) {
    remoteType = "cidr";
    remoteValue = rule.ip_ranges[0].cidr_ip;
  } else if (rule.ipv6_ranges && rule.ipv6_ranges.length > 0) {
    remoteType = "cidr";
    remoteValue = rule.ipv6_ranges[0].cidr_ipv6;
  }

  return {
    key: nextKey(),
    ethertype: rule.ethertype || (rule.ipv6_ranges?.length ? "IPv6" : "IPv4"),
    direction: dir,
    description: rule.description || "",
    protocol: proto === "-1" ? "-1" : proto.toLowerCase(),
    startPort: rule.from_port != null && rule.from_port !== -1 ? String(rule.from_port) : "",
    endPort: rule.to_port != null && rule.to_port !== -1 ? String(rule.to_port) : "",
    remoteType,
    remoteValue,
    isOriginal: true,
    original: { ...rule, _direction: dir } as SecurityGroupRule & { _direction?: "ingress" | "egress" },
  };
};

const ModifySecurityGroupModal: React.FC<ModifySecurityGroupModalProps> = ({
  isOpen,
  onClose,
  securityGroup,
  ingressRules,
  egressRules,
  availableSecurityGroups = [],
  onUpdateSg,
  onAddRule,
  onRemoveRule,
  isSaving = false,
}) => {
  const [sgName, setSgName] = useState(securityGroup.name || "");
  const [sgDesc, setSgDesc] = useState(securityGroup.description || "");
  const [rules, setRules] = useState<EditableRule[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize rules from props
  useEffect(() => {
    if (isOpen) {
      const allRules: EditableRule[] = [
        ...ingressRules.map((r) => ruleToEditable(r, "ingress")),
        ...egressRules.map((r) => ruleToEditable(r, "egress")),
      ];
      setRules(allRules);
      setDeletedOriginals([]);
      setSgName(securityGroup.name || "");
      setSgDesc(securityGroup.description || "");
    }
  }, [isOpen, ingressRules, egressRules, securityGroup]);

  const handleAddRow = useCallback(() => {
    setRules((prev) => [
      ...prev,
      {
        key: nextKey(),
        ethertype: "IPv4",
        direction: "ingress",
        description: "",
        protocol: "-1",
        startPort: "",
        endPort: "",
        remoteType: "any",
        remoteValue: "",
        isOriginal: false,
      },
    ]);
  }, []);

  // Track originals that were deleted or modified (need to be removed from provider)
  const [deletedOriginals, setDeletedOriginals] = useState<EditableRule[]>([]);

  const handleDeleteRow = useCallback((key: string) => {
    setRules((prev) => {
      const toDelete = prev.find((r) => r.key === key);
      if (toDelete?.isOriginal && toDelete.original) {
        setDeletedOriginals((d) => [...d, toDelete]);
      }
      return prev.filter((r) => r.key !== key);
    });
  }, []);

  const updateRule = useCallback(
    (key: string, field: keyof EditableRule, value: string) => {
      setRules((prev) =>
        prev.map((r) => {
          if (r.key !== key) return r;
          const updated = { ...r, [field]: value };
          // When an original rule is edited, track the original for deletion and mark as new
          if (r.isOriginal && r.original) {
            setDeletedOriginals((d) => {
              // Avoid duplicates
              if (d.some((dd) => dd.key === r.key)) return d;
              return [...d, r];
            });
            updated.isOriginal = false;
          }
          // Auto-clear ports when protocol changes to ANY or ICMP
          if (field === "protocol" && (value === "-1" || value === "icmp")) {
            updated.startPort = "";
            updated.endPort = "";
          }
          // Auto-set default CIDR when switching remote type
          if (field === "remoteType") {
            if (value === "cidr") {
              updated.remoteValue = updated.ethertype === "IPv6" ? "::/0" : "0.0.0.0/0";
            } else if (value === "any") {
              updated.remoteValue = "";
            } else {
              updated.remoteValue = "";
            }
          }
          // Auto-switch CIDR placeholder on ethertype change
          if (field === "ethertype" && updated.remoteType === "cidr") {
            updated.remoteValue = value === "IPv6" ? "::/0" : "0.0.0.0/0";
          }
          return updated;
        })
      );
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update SG name/description if changed
      if (
        onUpdateSg &&
        (sgName !== securityGroup.name || sgDesc !== securityGroup.description)
      ) {
        onUpdateSg(sgName, sgDesc);
      }

      // 2. Remove deleted/modified original rules
      for (const orig of deletedOriginals) {
        if (orig.original) {
          await onRemoveRule(orig.original, orig.direction);
        }
      }

      // 3. Add new rules (not original)
      for (const rule of rules) {
        if (rule.isOriginal) continue;
        const payload: {
          direction: "ingress" | "egress";
          protocol: string;
          port_range_min?: number;
          port_range_max?: number;
          cidr?: string;
          ethertype?: string;
          remote_group_id?: string;
        } = {
          direction: rule.direction,
          protocol: rule.protocol,
          ethertype: rule.ethertype,
        };

        if (rule.startPort) payload.port_range_min = parseInt(rule.startPort);
        if (rule.endPort) payload.port_range_max = parseInt(rule.endPort);

        if (rule.remoteType === "cidr" && rule.remoteValue) {
          payload.cidr = rule.remoteValue;
        } else if (rule.remoteType === "group" && rule.remoteValue) {
          // remoteValue might be "name | id" or just the id
          const parts = rule.remoteValue.split(" | ");
          payload.remote_group_id = parts.length > 1 ? parts[1] : parts[0];
        }

        await onAddRule(payload);
      }

      onClose();
    } catch (err) {
      console.error("Failed to save security group modifications:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const portsDisabled = (protocol: string) =>
    protocol === "-1" || protocol === "icmp";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="m-4 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Modify Security Group</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* SG Metadata */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sgName}
                onChange={(e) => setSgName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Description
              </label>
              <input
                type="text"
                value={sgDesc}
                onChange={(e) => setSgDesc(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                VPC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={securityGroup.vpc_id || "—"}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>
          </div>

          {/* Rules Header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-gray-600">Rules</h3>
            <ModernButton variant="secondary" size="sm" onClick={handleAddRow}>
              Add
            </ModernButton>
          </div>

          {/* Rules Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Direction
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Description
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Protocol
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Start Port
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    End Port
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Remote
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Remote Value
                  </th>
                  <th className="w-10 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      No rules. Click &quot;Add&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr
                      key={rule.key}
                      className={`transition-colors hover:bg-gray-50 ${
                        !rule.isOriginal ? "bg-green-50/50" : ""
                      }`}
                    >
                      {/* Type */}
                      <td className="px-2 py-1.5">
                        <select
                          value={rule.ethertype}
                          onChange={(e) =>
                            updateRule(rule.key, "ethertype", e.target.value)
                          }
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="IPv4">IPv4</option>
                          <option value="IPv6">IPv6</option>
                        </select>
                      </td>
                      {/* Direction */}
                      <td className="px-2 py-1.5">
                        <select
                          value={rule.direction}
                          onChange={(e) =>
                            updateRule(rule.key, "direction", e.target.value)
                          }
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="ingress">INGRESS</option>
                          <option value="egress">EGRESS</option>
                        </select>
                      </td>
                      {/* Description */}
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={rule.description}
                          onChange={(e) =>
                            updateRule(rule.key, "description", e.target.value)
                          }
                          placeholder="description"
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      {/* Protocol */}
                      <td className="px-2 py-1.5">
                        <select
                          value={rule.protocol}
                          onChange={(e) =>
                            updateRule(rule.key, "protocol", e.target.value)
                          }
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          {PROTOCOLS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* Start Port */}
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={rule.startPort}
                          onChange={(e) =>
                            updateRule(rule.key, "startPort", e.target.value)
                          }
                          placeholder="Start port"
                          disabled={portsDisabled(rule.protocol)}
                          className="w-20 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      {/* End Port */}
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={rule.endPort}
                          onChange={(e) =>
                            updateRule(rule.key, "endPort", e.target.value)
                          }
                          placeholder="End port"
                          disabled={portsDisabled(rule.protocol)}
                          className="w-20 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      {/* Remote */}
                      <td className="px-2 py-1.5">
                        <select
                          value={rule.remoteType}
                          onChange={(e) =>
                            updateRule(rule.key, "remoteType", e.target.value)
                          }
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="any">Any</option>
                          <option value="cidr">CIDR</option>
                          <option value="group">Group</option>
                        </select>
                      </td>
                      {/* Remote Value */}
                      <td className="px-2 py-1.5">
                        {rule.remoteType === "group" ? (
                          <select
                            value={rule.remoteValue}
                            onChange={(e) =>
                              updateRule(rule.key, "remoteValue", e.target.value)
                            }
                            className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Select SG...</option>
                            {availableSecurityGroups.map((sg) => (
                              <option
                                key={sg.id}
                                value={`${sg.name || sg.id} | ${sg.provider_resource_id || sg.id}`}
                              >
                                {sg.name || sg.id}
                              </option>
                            ))}
                          </select>
                        ) : rule.remoteType === "cidr" ? (
                          <input
                            type="text"
                            value={rule.remoteValue}
                            onChange={(e) =>
                              updateRule(rule.key, "remoteValue", e.target.value)
                            }
                            placeholder={rule.ethertype === "IPv6" ? "::/0" : "0.0.0.0/0"}
                            className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none"
                          />
                        ) : (
                          <span className="px-2 text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* Delete */}
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => handleDeleteRow(rule.key)}
                          className="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <ModernButton variant="secondary" onClick={onClose}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || isSaving || !sgName}
          >
            {saving || isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Ok"
            )}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default ModifySecurityGroupModal;
