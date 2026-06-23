import { useNavigate } from "react-router-dom";
import { FileText, Edit, Power } from "lucide-react";
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import { ModernCard } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { useFetchRequirements, useDeleteRequirement } from "@/hooks/requirementHooks";
import { type RequirementRecord } from "@/shared/types/requirement";

/**
 * Requirement list — SHARED by the admin and tenant builders. `basePath` points
 * row navigation at the right edit route; the role-agnostic hooks fetch from the
 * correct API base for the current session.
 */
type Tone = "neutral" | "green" | "amber" | "blue";
const TONES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
};
const Badge = ({ text, tone = "neutral" }: { text: string; tone?: Tone }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{text}</span>
);

const RequirementsList = ({ basePath }: { basePath: string }) => {
  const navigate = useNavigate();
  const { data, isFetching } = useFetchRequirements();
  const del = useDeleteRequirement();
  const rows: RequirementRecord[] = Array.isArray(data) ? data : [];

  const columns: Column<RequirementRecord>[] = [
    { key: "sn", header: "S/N", render: (_v, _r, i) => i + 1 },
    {
      key: "title",
      header: "Form",
      render: (_v, r) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{r.title}</div>
            <div className="font-mono text-xs text-gray-400">{r.key}</div>
          </div>
        </div>
      ),
    },
    { key: "placement", header: "Placement", render: (v) => <Badge text={String(v || "—")} tone="blue" /> },
    {
      key: "audience",
      header: "Audience",
      render: (_v, r) => (
        <span className="text-xs text-gray-600">
          {r.persona && r.persona !== "any" ? r.persona : "any"} ·{" "}
          {r.account_type && r.account_type !== "any" ? r.account_type : "any"}
          {r.country_code ? ` · ${r.country_code}` : ""}
        </span>
      ),
    },
    { key: "fields", header: "Questions", render: (_v, r) => r.fields?.length ?? 0 },
    {
      key: "enforcement",
      header: "Required?",
      render: (v) => (
        <Badge text={String(v)} tone={v === "required" ? "amber" : v === "off" ? "neutral" : "green"} />
      ),
    },
    { key: "version", header: "Ver", render: (v) => `v${v ?? 1}` },
    {
      key: "is_active",
      header: "Status",
      render: (v) => <Badge text={v ? "On" : "Off"} tone={v ? "green" : "neutral"} />,
    },
  ];

  const actions = [
    {
      icon: <Edit size={16} />,
      label: "",
      onClick: (r: RequirementRecord) => navigate(`${basePath}/${r.id}/edit`),
    },
    {
      icon: <Power size={16} />,
      label: "",
      onClick: (r: RequirementRecord) => {
        if (!r.is_active) return;
        if (!globalThis.window.confirm(`Turn off "${r.title}"? Existing submissions are kept.`)) return;
        del.mutate(r.id, {
          onSuccess: () => ToastUtils.success("Form turned off."),
          onError: () => ToastUtils.error("Could not turn off form."),
        });
      },
    },
  ];

  return (
    <ModernCard>
      <ModernTable
        title="Forms"
        data={rows}
        columns={columns}
        actions={actions}
        searchable
        sortable
        loading={isFetching}
        onRowClick={(r: RequirementRecord) => navigate(`${basePath}/${r.id}/edit`)}
        emptyMessage="No forms yet. Create one to start collecting info behind a gate."
      />
    </ModernCard>
  );
};

export default RequirementsList;
