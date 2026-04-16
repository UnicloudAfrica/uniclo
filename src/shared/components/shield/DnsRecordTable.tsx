/**
 * DnsRecordTable — DNS records management for a Shield domain.
 */
import React, { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchDnsRecords,
  useCreateDnsRecord,
  useDeleteDnsRecord,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldDnsRecord } from "@/shared/hooks/resources/shieldHooks";

interface DnsRecordTableProps {
  domainId: string;
}

const RECORD_TYPES = [
  { value: "A", label: "A" },
  { value: "AAAA", label: "AAAA" },
  { value: "CNAME", label: "CNAME" },
  { value: "MX", label: "MX" },
  { value: "TXT", label: "TXT" },
  { value: "NS", label: "NS" },
  { value: "SRV", label: "SRV" },
  { value: "CAA", label: "CAA" },
];

const DnsRecordTable: React.FC<DnsRecordTableProps> = ({ domainId }) => {
  const { data: records = [], isLoading } = useFetchDnsRecords(domainId);
  const createRecord = useCreateDnsRecord();
  const deleteRecord = useDeleteDnsRecord();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    type: "A",
    name: "",
    content: "",
    ttl: "3600",
    priority: "",
  });

  const columns: Column<ShieldDnsRecord>[] = useMemo(
    () => [
      { key: "type", header: "Type", sortable: true },
      { key: "name", header: "Name", sortable: true },
      {
        key: "content",
        header: "Content",
        render: (_, row) => (
          <span className="font-mono text-xs">{row.content}</span>
        ),
      },
      { key: "ttl", header: "TTL" },
    ],
    []
  );

  const actions: Action<ShieldDnsRecord>[] = useMemo(
    () => [
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => deleteRecord.mutate({ domainId, recordId: row.id }),
      },
    ],
    [domainId, deleteRecord]
  );

  const handleAdd = () => {
    createRecord.mutate(
      {
        domainId,
        type: form.type,
        name: form.name,
        content: form.content,
        ttl: parseInt(form.ttl, 10),
        ...(form.priority ? { priority: parseInt(form.priority, 10) } : {}),
      } as never,
      { onSuccess: () => setShowAdd(false) }
    );
  };

  return (
    <>
      <ModernTable<ShieldDnsRecord>
        columns={columns}
        data={records as ShieldDnsRecord[]}
        loading={isLoading}
        searchKeys={["name", "type", "content"]}
        searchPlaceholder="Search DNS records..."
        actions={actions}
        headerActions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus size={14} /> Add Record
          </button>
        }
      />

      {showAdd && (
        <ModernModal title="Add DNS Record" onClose={() => setShowAdd(false)} size="md">
          <div className="space-y-4">
            <ModernSelect
              label="Type"
              options={RECORD_TYPES}
              value={form.type}
              onChange={(val) => setForm((p) => ({ ...p, type: val }))}
            />
            <ModernInput
              label="Name"
              placeholder="@"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <ModernInput
              label="Content"
              placeholder="192.168.1.1"
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <ModernInput
                label="TTL"
                value={form.ttl}
                onChange={(e) => setForm((p) => ({ ...p, ttl: e.target.value }))}
              />
              <ModernInput
                label="Priority"
                placeholder="Optional"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <ModernButton variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                onClick={handleAdd}
                disabled={!form.name || !form.content || createRecord.isPending}
                loading={createRecord.isPending}
              >
                Add Record
              </ModernButton>
            </div>
          </div>
        </ModernModal>
      )}
    </>
  );
};

export default DnsRecordTable;
