import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { ModernButton, ConfirmDialog } from "@/shared/components/ui";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";
import { marketingContentHooks } from "@/shared/hooks/resources/marketingContentHooks";
import MarketingContentModal from "./MarketingContentModal";
import {
  MARKETING_FIELD_CONFIG,
  type FieldDef,
  type MarketingType,
} from "./marketingFieldConfig";

type Row = Record<string, unknown>;

const PER_PAGE = 10;

const toText = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value);

/** Render an in-table cell for a configured field. Image URLs become thumbnails. */
const renderCell = (field: FieldDef, row: Row): React.ReactNode => {
  const value = row[field.key];
  if (field.kind === "url" && field.key.endsWith("_url")) {
    const url = toText(value).trim();
    if (!url) return <span className="text-slate-400">—</span>;
    return (
      <img
        src={url}
        alt=""
        className="h-9 w-9 rounded-md border border-slate-200 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  const text = toText(value).trim();
  return text === "" ? <span className="text-slate-400">—</span> : <span>{text}</span>;
};

function WebsiteContentList({ type }: { type: MarketingType }) {
  const config = MARKETING_FIELD_CONFIG[type];
  const hooks = marketingContentHooks(type);

  const { data, isLoading } = hooks.useFetchList();
  const { mutate: deleteRecord, isPending: isDeleting } = hooks.useDelete();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => (Array.isArray(data) ? (data as Row[]) : []), [data]);

  // Client-side search by the configured title field (API returns all rows).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => toText(row[config.titleField]).toLowerCase().includes(q));
  }, [rows, search, config.titleField]);

  // Client-side pagination.
  const total = filtered.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / PER_PAGE)));
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [filtered, safePage]
  );

  const singletonFilled = config.singleton && rows.length > 0;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete?.id) return;
    deleteRecord(
      { id: toDelete.id as string | number },
      { onSuccess: () => setToDelete(null) }
    );
  };

  const columns = useMemo(() => {
    const fieldColumns = config.fields
      .filter((f) => f.inTable)
      .map((field) => ({
        key: field.key,
        header: field.label,
        render: (row: Row) => renderCell(field, row),
      }));

    const actionsColumn = {
      key: "__actions",
      header: "Actions",
      align: "right" as const,
      render: (row: Row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Pencil size={13} /> Edit
          </button>
          {!config.singleton && (
            <button
              type="button"
              onClick={() => setToDelete(row)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
        </div>
      ),
    };

    return [...fieldColumns, actionsColumn];
  }, [config.fields, config.singleton]);

  const titleLabel = config.fields.find((f) => f.key === config.titleField)?.label ?? "title";

  return (
    <>
      <ResourceDataExplorer
        title={config.label}
        description={
          config.singleton
            ? "Site-wide settings — a single record."
            : `Manage ${config.label.toLowerCase()} shown on the public website.`
        }
        columns={columns}
        rows={paged}
        loading={isLoading}
        page={safePage}
        perPage={PER_PAGE}
        total={total}
        onPageChange={setPage}
        searchValue={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        toolbarSlot={
          singletonFilled ? null : (
            <ModernButton onClick={openCreate} className="flex items-center gap-2">
              <Plus size={16} />
              {config.singleton ? "Add Settings" : `New ${config.label}`}
            </ModernButton>
          )
        }
        emptyState={{
          icon: <FileText size={40} />,
          title: `No ${config.label.toLowerCase()} yet`,
          description: search
            ? `No records match "${search}".`
            : `Create your first ${config.label.toLowerCase()} entry to get started.`,
          action: singletonFilled ? undefined : (
            <ModernButton onClick={openCreate}>
              <Plus size={16} /> {config.singleton ? "Add Settings" : `New ${config.label}`}
            </ModernButton>
          ),
        }}
      />

      {modalOpen && (
        <MarketingContentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          type={type}
          config={config}
          record={editing}
          onSaved={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!toDelete}
        title={`Delete ${config.label.toLowerCase()}?`}
        message={
          toDelete
            ? `"${toText(toDelete[config.titleField]) || `this ${titleLabel.toLowerCase()}`}" will be permanently removed. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
}

export default WebsiteContentList;
