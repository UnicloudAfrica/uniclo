import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import ModernButton from "../leads/components/ModernButton";
import ModernCard from "../leads/components/ModernCard";
import ResourceHero from "../leads/components/ResourceHero";
import ResourceDataExplorer from "../leads/components/ResourceDataExplorer";
import {
  useFetchLeads,
  useFetchLeadStats,
} from "../../hooks/tenantHooks/leadsHook";

const formatCreatedAt = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const encodeId = (id) => encodeURIComponent(btoa(id));

const formatStatusForDisplay = (status) => status.replace(/_/g, " ");

const STATUS_CONFIG = {
  all: {
    label: "All leads",
    description: "Entire pipeline",
    tone: "bg-slate-900 text-white",
    chip: "bg-slate-800 text-slate-100",
  },
  new: {
    label: "New",
    description: "Awaiting contact",
    tone: "bg-sky-500/10 text-sky-600",
    chip: "bg-sky-500/15 text-sky-600",
  },
  contacted: {
    label: "Contacted",
    description: "Initial outreach",
    tone: "bg-amber-500/10 text-amber-600",
    chip: "bg-amber-500/15 text-amber-600",
  },
  qualified: {
    label: "Qualified",
    description: "Ready for proposal",
    tone: "bg-green-500/10 text-green-600",
    chip: "bg-green-500/15 text-green-600",
  },
  proposal_sent: {
    label: "Proposal sent",
    description: "Awaiting feedback",
    tone: "bg-indigo-500/10 text-indigo-600",
    chip: "bg-indigo-500/15 text-indigo-600",
  },
  negotiating: {
    label: "Negotiating",
    description: "In discussion",
    tone: "bg-purple-500/10 text-purple-600",
    chip: "bg-purple-500/15 text-purple-600",
  },
  closed_won: {
    label: "Closed won",
    description: "Converted clients",
    tone: "bg-emerald-500/10 text-emerald-600",
    chip: "bg-emerald-500/15 text-emerald-600",
  },
  closed_lost: {
    label: "Closed lost",
    description: "Lost opportunities",
    tone: "bg-rose-500/10 text-rose-600",
    chip: "bg-rose-500/15 text-rose-600",
  },
};

const STATUS_ORDER = [
  "all",
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
];

const getStatusColorClass = (status) => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "contacted":
      return "bg-yellow-100 text-yellow-800";
    case "qualified":
      return "bg-green-100 text-green-800";
    case "proposal_sent":
      return "bg-indigo-100 text-indigo-800";
    case "negotiating":
      return "bg-purple-100 text-purple-800";
    case "closed_won":
      return "bg-emerald-100 text-emerald-800";
    case "closed_lost":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DashboardLeads() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const { data: leads = [], isFetching: isLeadsFetching } = useFetchLeads();
  const { data: leadStats, isFetching: isLeadStatsFetching } =
    useFetchLeadStats();

  const leadsByStatus = useMemo(
    () => leadStats?.message?.leads_by_status ?? {},
    [leadStats]
  );

  const totalLeadCount = leadStats?.message?.leads ?? leads.length ?? 0;
  const engagedCount =
    (leadsByStatus.contacted ?? 0) +
    (leadsByStatus.qualified ?? 0) +
    (leadsByStatus.proposal_sent ?? 0) +
    (leadsByStatus.negotiating ?? 0);
  const conversionRate = totalLeadCount
    ? Math.round(((leadsByStatus.closed_won ?? 0) / totalLeadCount) * 100)
    : 0;

  const statusSegments = useMemo(() => {
    return STATUS_ORDER.map((statusId) => {
      if (statusId === "all") {
        return {
          id: "all",
          count: totalLeadCount,
          label: STATUS_CONFIG.all.label,
          description: STATUS_CONFIG.all.description,
        };
      }
      const config = STATUS_CONFIG[statusId];
      return {
        id: statusId,
        count: leadsByStatus[statusId] ?? 0,
        label: config?.label ?? statusId,
        description: config?.description ?? "",
      };
    }).filter((segment) => segment.id === "all" || segment.count > 0);
  }, [leadsByStatus, totalLeadCount]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    const byStatus =
      activeStatus === "all"
        ? leads
        : leads.filter((lead) => lead.status === activeStatus);

    if (!searchValue.trim()) return byStatus;

    const term = searchValue.trim().toLowerCase();
    return byStatus.filter((lead) => {
      const name = `${lead.first_name} ${lead.last_name}`.toLowerCase();
      return (
        name.includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term)
      );
    });
  }, [leads, activeStatus, searchValue]);

  const headerActions = (
    <ModernButton
      onClick={() => navigate("/dashboard/leads/create")}
      className="inline-flex items-center gap-2"
    >
      <UserPlus className="h-4 w-4" />
      Add lead
    </ModernButton>
  );

  const leadColumns = useMemo(
    () => [
      {
        header: "Lead",
        key: "name",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {row.first_name} {row.last_name}
            </span>
            <span className="text-xs text-slate-400">{row.company ?? "—"}</span>
          </div>
        ),
      },
      {
        header: "Contact",
        key: "email",
        render: (row) => (
          <div className="flex flex-col text-sm text-slate-600">
            <span>{row.email}</span>
            {row.phone && (
              <span className="text-xs text-slate-400">{row.phone}</span>
            )}
          </div>
        ),
      },
      {
        header: "Stage",
        key: "status",
        render: (row) => (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColorClass(
              row.status
            )}`}
          >
            {formatStatusForDisplay(row.status)}
          </span>
        ),
      },
      {
        header: "Source",
        key: "source",
        render: (row) => (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
            {row.source || "—"}
          </span>
        ),
      },
      {
        header: "Lead type",
        key: "lead_type",
        render: (row) => (
          <span className="text-sm font-medium capitalize text-slate-700">
            {row.lead_type || "—"}
          </span>
        ),
      },
      {
        header: "Created",
        key: "created_at",
        render: (row) => (
          <span className="text-sm text-slate-500">
            {formatCreatedAt(row.created_at)}
          </span>
        ),
      },
      {
        header: "",
        key: "actions",
        align: "right",
        render: (row) => (
          <button
            type="button"
            onClick={() =>
              navigate(
                `/dashboard/leads/details?name=${encodeURIComponent(
                  `${row.first_name} ${row.last_name}`
                )}&id=${encodeId(row.id)}`
              )
            }
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <TenantPageShell
      title="Lead pipeline"
      description="Stay on top of every inquiry—from first contact to conversion—and highlight prospects that need attention."
      contentClassName="space-y-8"
    >
      <ResourceHero
        title="Lead pipeline"
        subtitle="Growth"
        description="Track how prospects move through each stage and spot opportunities for faster conversions."
        metrics={[
          {
            label: "Pipeline volume",
            value: totalLeadCount,
            description: "All leads across every stage",
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "In play",
            value: engagedCount,
            description: "Actively engaged opportunities",
            icon: <BarChart3 className="h-4 w-4" />,
          },
          {
            label: "Conversion rate",
            value: `${conversionRate}%`,
            description: "Closed-won vs total leads",
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "New this month",
            value: leadsByStatus.new ?? 0,
            description: "Fresh prospects awaiting outreach",
            icon: <ArrowUpRight className="h-4 w-4" />,
          },
        ]}
        rightSlot={headerActions}
      />

      <ModernCard className="space-y-6 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stage insights
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              Focus on a slice of the funnel
            </h2>
            <p className="text-sm text-slate-500">
              Select a stage to highlight the leads that need attention right
              now.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <ArrowUpRight className="h-3 w-3" />
            Live updates
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statusSegments.map((segment) => {
            const config = STATUS_CONFIG[segment.id] || STATUS_CONFIG.all;
            const isActive = activeStatus === segment.id;
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => setActiveStatus(segment.id)}
                className={`group flex flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      isActive ? "bg-white/20 text-white" : config.tone
                    }`}
                  >
                    {config.label}
                  </span>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isActive ? "bg-white/20 text-white" : config.chip
                    }`}
                  >
                    {segment.count}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    isActive ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {config.description}
                </p>
              </button>
            );
          })}
        </div>
      </ModernCard>

      <ModernCard className="space-y-6 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Lead directory
          </h2>
          <p className="text-sm text-slate-500">
            Explore every prospect, understand where they are in the journey,
            and dig into the context behind each opportunity.
          </p>
        </div>

        <ResourceDataExplorer
          columns={leadColumns}
          rows={filteredLeads}
          loading={isLeadsFetching}
          searchValue={searchValue}
          onSearch={setSearchValue}
          highlight
          emptyState={{
            icon: (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                <UserPlus className="h-5 w-5" />
              </span>
            ),
            title: "No leads yet",
            description:
              "Start capturing opportunities by adding leads manually or importing from your CRM.",
            action: (
              <ModernButton
                onClick={() => navigate("/dashboard/leads/create")}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add your first lead
              </ModernButton>
            ),
          }}
        />
      </ModernCard>

      {isLeadStatsFetching && (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}
    </TenantPageShell>
  );
}
