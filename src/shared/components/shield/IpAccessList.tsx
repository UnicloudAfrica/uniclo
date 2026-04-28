/**
 * IpAccessList — IP whitelist/blacklist/greylist management for a Shield domain.
 */
import React, { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchIpRules,
  useAddIpRule,
  useRemoveIpRule,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldIpRule } from "@/shared/hooks/resources/shieldHooks";

interface IpAccessListProps {
  domainId: string;
}

const LIST_TYPES = [
  { key: "whitelist", label: "Whitelist", description: "Always allowed" },
  { key: "blacklist", label: "Blacklist", description: "Always blocked" },
  { key: "greylist", label: "Greylist", description: "Challenged" },
] as const;

const IpListSection: React.FC<{
  domainId: string;
  listType: string;
  label: string;
  description: string;
}> = ({ domainId, listType, label, description }) => {
  const { data: rules = [], isLoading } = useFetchIpRules(domainId, listType);
  const addRule = useAddIpRule();
  const removeRule = useRemoveIpRule();
  const [showAdd, setShowAdd] = useState(false);
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");

  const columns: Column<ShieldIpRule>[] = useMemo(
    () => [
      {
        key: "ip",
        header: "IP Address",
        render: (_, row) => <span className="font-mono text-xs">{row.ip}</span>,
      },
      { key: "note", header: "Note" },
    ],
    []
  );

  const actions: Action<ShieldIpRule>[] = useMemo(
    () => [
      {
        label: "Remove",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (window.confirm(`Remove IP ${row.ip} from ${label}?`)) {
            removeRule.mutate({ domainId, listType, ruleId: row.id });
          }
        },
      },
    ],
    [domainId, listType, removeRule]
  );

  const handleAdd = () => {
    addRule.mutate(
      { domainId, listType, ip, note },
      {
        onSuccess: () => {
          setShowAdd(false);
          setIp("");
          setNote("");
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[var(--theme-heading-color)]">{label}</h4>
          <p className="text-xs text-[var(--theme-muted-color)]">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-[var(--theme-color)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <ModernTable<ShieldIpRule>
        columns={columns}
        data={rules as ShieldIpRule[]}
        loading={isLoading}
        searchKeys={["ip", "note"]}
        actions={actions}
        pageSize={5}
      />
      {showAdd && (
        <ModernModal title={`Add to ${label}`} onClose={() => setShowAdd(false)} size="sm">
          <div className="space-y-4">
            <ModernInput
              label="IP Address"
              placeholder="192.168.1.0/24"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
            <ModernInput
              label="Note"
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <ModernButton variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                onClick={handleAdd}
                disabled={!ip || addRule.isPending}
                loading={addRule.isPending}
              >
                Add
              </ModernButton>
            </div>
          </div>
        </ModernModal>
      )}
    </div>
  );
};

const IpAccessList: React.FC<IpAccessListProps> = ({ domainId }) => {
  return (
    <div className="db-surface-card space-y-6 rounded-2xl border p-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
        IP Access Lists
      </h3>
      {LIST_TYPES.map((lt) => (
        <IpListSection
          key={lt.key}
          domainId={domainId}
          listType={lt.key}
          label={lt.label}
          description={lt.description}
        />
      ))}
    </div>
  );
};

export default IpAccessList;
