/**
 * DnsRecordTable — DNS records management for a Shield domain.
 *
 * Supports add, edit, and delete. On edit, the provider treats record
 * type+name as immutable, so those fields are shown read-only and only
 * content/ttl/priority are sent (matches useUpdateDnsRecord + the backend
 * UpdateShieldDnsRecordRequest rules).
 */
import React, { useState, useMemo } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchDnsRecords,
  useCreateDnsRecord,
  useUpdateDnsRecord,
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

const EMPTY_FORM = { type: "A", name: "", content: "", ttl: "3600", priority: "" };

const DnsRecordTable: React.FC<DnsRecordTableProps> = ({ domainId }) => {
  const { data: records = [], isLoading } = useFetchDnsRecords(domainId);
  const createRecord = useCreateDnsRecord();
  const updateRecord = useUpdateDnsRecord();
  const deleteRecord = useDeleteDnsRecord();
  const [showModal, setShowModal] = useState(false);
  // null → create mode; otherwise the id of the record being edited.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEditing = editingId !== null;
  const isSaving = createRecord.isPending || updateRecord.isPending;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (row: ShieldDnsRecord) => {
    setEditingId(row.id);
    setForm({
      type: row.type,
      name: row.name,
      content: row.content,
      ttl: String(row.ttl ?? "3600"),
      priority: row.priority != null ? String(row.priority) : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

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
        label: "Edit",
        icon: <Pencil size={14} />,
        onClick: (row) => openEdit(row),
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (window.confirm(`Delete DNS record "${row.name}" (${row.type})?`)) {
            deleteRecord.mutate({ domainId, recordId: row.id });
          }
        },
      },
    ],
    [domainId, deleteRecord]
  );

  const handleSubmit = () => {
    if (isEditing && editingId) {
      // type/name are provider-immutable — send editable fields only.
      updateRecord.mutate(
        {
          domainId,
          recordId: editingId,
          record: {
            content: form.content,
            ttl: parseInt(form.ttl, 10),
            ...(form.priority ? { priority: parseInt(form.priority, 10) } : {}),
          },
        },
        { onSuccess: closeModal }
      );
      return;
    }
    createRecord.mutate(
      {
        domainId,
        type: form.type,
        name: form.name,
        content: form.content,
        ttl: parseInt(form.ttl, 10),
        ...(form.priority ? { priority: parseInt(form.priority, 10) } : {}),
      },
      { onSuccess: closeModal }
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
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus size={14} /> Add Record
          </button>
        }
      />

      {showModal && (
        <ModernModal
          title={isEditing ? "Edit DNS Record" : "Add DNS Record"}
          onClose={closeModal}
          size="md"
        >
          <div className="space-y-4">
            {isEditing ? (
              <ModernInput label="Type" value={form.type} disabled />
            ) : (
              <ModernSelect
                label="Type"
                options={RECORD_TYPES}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              />
            )}
            <ModernInput
              label="Name"
              placeholder="@"
              value={form.name}
              disabled={isEditing}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {isEditing && (
              <p className="-mt-2 text-xs text-gray-400">
                Type and name can't be changed — delete and recreate to switch.
              </p>
            )}
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
              <ModernButton variant="secondary" onClick={closeModal}>
                Cancel
              </ModernButton>
              <ModernButton
                onClick={handleSubmit}
                disabled={(!isEditing && !form.name) || !form.content || isSaving}
                loading={isSaving}
              >
                {isEditing ? "Save Changes" : "Add Record"}
              </ModernButton>
            </div>
          </div>
        </ModernModal>
      )}
    </>
  );
};

export default DnsRecordTable;
