/**
 * FirewallRulesTable — Firewall rule management for a Shield domain.
 */
import React, { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import ModernTextarea from "@/shared/components/ui/ModernTextarea";
import ModernButton from "@/shared/components/ui/ModernButton";
import StatusPill from "@/shared/components/ui/StatusPill";
import {
  useFetchFirewallRules,
  useCreateFirewallRule,
  useDeleteFirewallRule,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldFirewallRule } from "@/shared/hooks/resources/shieldHooks";

interface FirewallRulesTableProps {
  domainId: string;
}

const ACTION_OPTIONS = [
  { value: "block", label: "Block" },
  { value: "challenge", label: "Challenge" },
  { value: "allow", label: "Allow" },
  { value: "log", label: "Log" },
];

const ACTION_TONE_MAP: Record<string, "danger" | "warning" | "success" | "info"> = {
  block: "danger",
  challenge: "warning",
  allow: "success",
  log: "info",
};

const FirewallRulesTable: React.FC<FirewallRulesTableProps> = ({ domainId }) => {
  const { data: rules = [], isLoading } = useFetchFirewallRules(domainId);
  const createRule = useCreateFirewallRule();
  const deleteRule = useDeleteFirewallRule();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    expression: "",
    action: "block",
    description: "",
    priority: "10",
  });

  const columns: Column<ShieldFirewallRule>[] = useMemo(
    () => [
      {
        key: "action",
        header: "Action",
        render: (_, row) => (
          <StatusPill
            status={row.action}
            tone={ACTION_TONE_MAP[row.action] ?? "neutral"}
          />
        ),
      },
      {
        key: "expression",
        header: "Expression",
        render: (_, row) => (
          <span className="font-mono text-xs">{row.expression}</span>
        ),
      },
      { key: "description", header: "Description" },
      { key: "priority", header: "Priority" },
    ],
    []
  );

  const actions: Action<ShieldFirewallRule>[] = useMemo(
    () => [
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (window.confirm(`Delete firewall rule "${row.description || row.expression}"?`)) {
            deleteRule.mutate({ domainId, ruleId: row.id });
          }
        },
      },
    ],
    [domainId, deleteRule]
  );

  const handleAdd = () => {
    createRule.mutate(
      {
        domainId,
        expression: form.expression,
        action: form.action,
        description: form.description,
        priority: parseInt(form.priority, 10),
      },
      { onSuccess: () => setShowAdd(false) }
    );
  };

  return (
    <>
      <ModernTable<ShieldFirewallRule>
        columns={columns}
        data={rules as ShieldFirewallRule[]}
        loading={isLoading}
        searchKeys={["expression", "description"]}
        searchPlaceholder="Search firewall rules..."
        actions={actions}
        headerActions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus size={14} /> Add Rule
          </button>
        }
      />

      {showAdd && (
        <ModernModal title="Add Firewall Rule" onClose={() => setShowAdd(false)} size="md">
          <div className="space-y-4">
            <ModernTextarea
              label="Expression"
              placeholder="ip.src == 1.2.3.4"
              value={form.expression}
              onChange={(e) => setForm((p) => ({ ...p, expression: e.target.value }))}
              rows={3}
            />
            <ModernSelect
              label="Action"
              options={ACTION_OPTIONS}
              value={form.action}
              onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
            />
            <ModernInput
              label="Description"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
            <ModernInput
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
            />
            <div className="flex justify-end gap-2 pt-2">
              <ModernButton variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                onClick={handleAdd}
                disabled={!form.expression || createRule.isPending}
                loading={createRule.isPending}
              >
                Add Rule
              </ModernButton>
            </div>
          </div>
        </ModernModal>
      )}
    </>
  );
};

export default FirewallRulesTable;
