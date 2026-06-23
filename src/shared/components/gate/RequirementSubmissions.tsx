import { type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import { ModernCard } from "@/shared/components/ui";
import { useFetchRequirementSubmissions } from "@/hooks/requirementHooks";
import { type RequirementField, type RequirementSubmissionRecord } from "@/shared/types/requirement";

/**
 * Requirement submissions — the audit trail for one form. SHARED by admin and
 * tenant; renders each immutable submission against its snapshot (the field
 * definitions as they were when submitted), so the record is self-contained.
 */
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const renderValue = (field: RequirementField, value: unknown): ReactNode => {
  if (field.type === "checkbox") return value === true ? "✓ Agreed" : "Not agreed";
  if (field.type === "group") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    if (!items.length) return "—";
    return (
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="rounded bg-gray-50 p-2">
            <div className="mb-1 text-xs font-semibold text-gray-500">
              {field.item_label || "Item"} {i + 1}
            </div>
            {(field.fields || []).map((sf) => (
              <div key={sf.key} className="text-xs text-gray-700">
                <span className="text-gray-400">{sf.label}: </span>
                {sf.type === "checkbox" ? (item?.[sf.key] === true ? "✓" : "—") : String(item?.[sf.key] ?? "—")}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (field.type === "file") return value ? String(value).split("/").pop() : "—";
  return value === undefined || value === null || value === "" ? "—" : String(value);
};

const SubmissionDetail = ({ s }: { s: RequirementSubmissionRecord }) => {
  const fields = s.snapshot?.fields || [];
  return (
    <div className="space-y-2 p-3">
      {fields.map((f) => (
        <div key={f.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[200px_1fr] sm:gap-3">
          <span className="text-sm text-gray-500">{f.label}</span>
          <span className="text-sm text-gray-800">{renderValue(f, s.values?.[f.key])}</span>
        </div>
      ))}
    </div>
  );
};

const RequirementSubmissions = ({ basePath }: { basePath: string }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { data, isFetching } = useFetchRequirementSubmissions(id);
  const rows: RequirementSubmissionRecord[] = Array.isArray(data) ? data : [];

  const columns: Column<RequirementSubmissionRecord>[] = [
    {
      key: "who",
      header: "Submitted by",
      render: (_v, r) => (
        <div>
          <div className="font-medium text-gray-900">{r.subject?.name}</div>
          <div className="text-xs text-gray-400">{r.subject?.email || r.subject?.type}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v) => (
        <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium capitalize text-green-700">
          {String(v)}
        </span>
      ),
    },
    { key: "submitted_at", header: "Submitted", render: (_v, r) => fmt(r.submitted_at) },
  ];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(basePath)}
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} /> Back to forms
      </button>
      <ModernCard>
        <ModernTable
          title="Submissions"
          data={rows}
          columns={columns}
          loading={isFetching}
          searchable
          expandable
          renderExpandedRow={(r: RequirementSubmissionRecord) => <SubmissionDetail s={r} />}
          emptyMessage="No submissions yet. Entries people make against this form will appear here for audit."
        />
      </ModernCard>
    </div>
  );
};

export default RequirementSubmissions;
