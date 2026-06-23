import { useNavigate } from "react-router-dom";
import { Plus, FileText, Edit, Power } from "lucide-react";
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import AdminPageShell from "../components/AdminPageShell";
import ToastUtils from "@/utils/toastUtil";
import { useFetchRequirements, useDeleteRequirement } from "@/hooks/adminHooks/requirementHooks";
import { type RequirementRecord } from "@/shared/types/requirement";

type Tone = "neutral" | "green" | "amber" | "red" | "blue";
const TONES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
};
const Badge = ({ text, tone = "neutral" }: { text: string; tone?: Tone }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
    {text}
  </span>
);

const AdminRequirements = () => {
  const navigate = useNavigate();
  const { data, isFetching } = useFetchRequirements();
  const del = useDeleteRequirement();
  const rows: RequirementRecord[] = Array.isArray(data) ? data : [];

  const columns: Column<RequirementRecord>[] = [
    { key: "sn", header: "S/N", render: (_v, _r, i) => i + 1 },
    {
      key: "title",
      header: "Requirement",
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
    { key: "scope", header: "Scope", render: (v) => <Badge text={String(v || "platform")} /> },
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
    { key: "fields", header: "Fields", render: (_v, r) => r.fields?.length ?? 0 },
    {
      key: "enforcement",
      header: "Enforcement",
      render: (v) => (
        <Badge
          text={String(v)}
          tone={v === "required" ? "amber" : v === "off" ? "neutral" : "green"}
        />
      ),
    },
    { key: "version", header: "Ver", render: (v) => `v${v ?? 1}` },
    {
      key: "is_active",
      header: "Status",
      render: (v) => <Badge text={v ? "Active" : "Inactive"} tone={v ? "green" : "neutral"} />,
    },
  ];

  const actions = [
    {
      icon: <Edit size={16} />,
      label: "",
      onClick: (r: RequirementRecord) => navigate(`/admin-dashboard/requirements/${r.id}/edit`),
    },
    {
      icon: <Power size={16} />,
      label: "",
      onClick: (r: RequirementRecord) => {
        if (!r.is_active) return;
        if (!globalThis.window.confirm(`Disable "${r.title}"? Existing submissions are kept.`)) return;
        del.mutate(r.id, {
          onSuccess: () => ToastUtils.success("Requirement disabled."),
          onError: () => ToastUtils.error("Could not disable requirement."),
        });
      },
    },
  ];

  return (
    <AdminPageShell
      title="Requirements"
      description="Define the dynamic forms and consent gates collected from tenants and clients — without code."
      breadcrumbs={[{ label: "Home", href: "/admin-dashboard" }, { label: "Requirements" }]}
      actions={
        <ModernButton
          variant="primary"
          className="flex items-center gap-2"
          onClick={() => navigate("/admin-dashboard/requirements/new")}
        >
          <Plus size={18} />
          New Requirement
        </ModernButton>
      }
    >
      <ModernCard>
        <ModernTable
          title="Input Gate Requirements"
          data={rows}
          columns={columns}
          actions={actions}
          searchable
          sortable
          loading={isFetching}
          onRowClick={(r: RequirementRecord) =>
            navigate(`/admin-dashboard/requirements/${r.id}/edit`)
          }
          emptyMessage="No requirements yet. Create one to start collecting info behind a gate."
        />
      </ModernCard>
    </AdminPageShell>
  );
};

export default AdminRequirements;
