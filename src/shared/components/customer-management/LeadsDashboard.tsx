// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
  Loader2,
  UserPlus,
  Users,
  Mail,
  Phone,
  Filter,
} from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import {
  useFetchLeads as useAdminFetchLeads,
  useFetchLeadStats as useAdminFetchLeadStats,
} from "../../../hooks/adminHooks/leadsHook";
import {
  useFetchLeads as useTenantFetchLeads,
  useFetchLeadStats as useTenantFetchLeadStats,
} from "../../../hooks/tenantHooks/leadsHook";
import ResourceHero from "../ui/ResourceHero";
import ResourceDataExplorer from "../../../adminDashboard/components/ResourceDataExplorer";
import TrendIndicator from "../../../adminDashboard/components/TrendIndicator";
import LeadScoreIndicator from "../../../adminDashboard/components/LeadScoreIndicator";
import PipelineFunnel from "../../../adminDashboard/components/PipelineFunnel";
import LeadCard from "../../../adminDashboard/components/LeadCard";
import ViewToggle from "../../../adminDashboard/components/ViewToggle";
import QuickActionsMenu from "../../../adminDashboard/components/QuickActionsMenu";
import { AdvancedFilterPanel, BulkActionBar, FilterPresets } from "../tables";
import UserSelectModal from "./UserSelectModal";
import adminSilentApi from "../../../index/admin/silent";
import tenantSilentApi from "../../../index/tenant/silentTenant";
import ToastUtil from "../../../utils/toastUtil";
import useAdminAuthStore from "../../../stores/adminAuthStore";
import useTenantAuthStore from "../../../stores/tenantAuthStore";
import config from "../../../config";

const formatCreatedAt = (dateString: any) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
const encodeId = (id: any) => {
  return encodeURIComponent(btoa(id));
};
const getLeadIdentifier = (lead: any) => lead?.identifier || lead?.id;
const normalizeId = (id: any) => (id !== undefined && id !== null ? String(id) : "");

// Helper function to format the status string for display
const formatStatusForDisplay = (status: any) => {
  return status.replace(/_/g, " ");
};
const STATUS_CONFIG = {
  all: {
    label: "All leads",
    description: "Entire pipeline",
    tone: "bg-slate-900 text-white",
    chip: "bg-slate-800 text-slate-100",
    color: "bg-gradient-to-r from-slate-600 to-slate-700",
  },
  new: {
    label: "New",
    description: "Awaiting contact",
    tone: "bg-sky-500/10 text-sky-600",
    chip: "bg-sky-500/15 text-sky-600",
    color: "bg-gradient-to-r from-sky-500 to-sky-600",
  },
  contacted: {
    label: "Contacted",
    description: "Initial outreach",
    tone: "bg-amber-500/10 text-amber-600",
    chip: "bg-amber-500/15 text-amber-600",
    color: "bg-gradient-to-r from-amber-500 to-amber-600",
  },
  qualified: {
    label: "Qualified",
    description: "Ready for proposal",
    tone: "bg-green-500/10 text-green-600",
    chip: "bg-green-500/15 text-green-600",
    color: "bg-gradient-to-r from-green-500 to-green-600",
  },
  proposal_sent: {
    label: "Proposal sent",
    description: "Awaiting feedback",
    tone: "bg-indigo-500/10 text-indigo-600",
    chip: "bg-indigo-500/15 text-indigo-600",
    color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
  },
  negotiating: {
    label: "Negotiating",
    description: "In discussion",
    tone: "bg-purple-500/10 text-purple-600",
    chip: "bg-purple-500/15 text-purple-600",
    color: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
  closed_won: {
    label: "Closed won",
    description: "Converted clients",
    tone: "bg-emerald-500/10 text-emerald-600",
    chip: "bg-emerald-500/15 text-emerald-600",
    color: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  },
  closed_lost: {
    label: "Closed lost",
    description: "Lost opportunities",
    tone: "bg-rose-500/10 text-rose-600",
    chip: "bg-rose-500/15 text-rose-600",
    color: "bg-gradient-to-r from-rose-500 to-rose-600",
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

const LeadsDashboard = ({ context = "admin" }) => {
  const queryClient = useQueryClient();

  const [activeStatus, setActiveStatus] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [view, setView] = useState("table"); // table or card
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activePreset, setActivePreset] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: "all",
    source: "all",
    leadType: "all",
    minScore: 0,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // 'bulk' or lead object
  const navigate = useNavigate();

  const basePath = context === "admin" ? "/admin-dashboard" : "/dashboard";
  const leadQueryKey = context === "admin" ? "admin-leads" : "tenant-leads";
  const apiClient = context === "admin" ? adminSilentApi : tenantSilentApi;
  const exportBaseUrl = context === "admin" ? config.adminURL : config.tenantURL;

  const adminAuthHeaders = useAdminAuthStore((state: any) => state.getAuthHeaders);
  const tenantAuthHeaders = useTenantAuthStore((state: any) => state.getAuthHeaders);
  const authHeaders =
    context === "admin"
      ? typeof adminAuthHeaders === "function"
        ? adminAuthHeaders()
        : {}
      : typeof tenantAuthHeaders === "function"
        ? tenantAuthHeaders()
        : {};

  const openCreateLead = () => navigate(`${basePath}/leads/create`);

  const pruneLeadsFromCache = (idsToRemove: any) => {
    const removeSet = new Set((idsToRemove || []).map(normalizeId).filter(Boolean));

    if (removeSet.size === 0) return;

    queryClient.setQueriesData({ queryKey: [leadQueryKey] }, (old) => {
      const filterList = (list: any) =>
        list.filter((lead: any) => {
          const idStr = normalizeId(lead.id);
          const identStr = normalizeId(lead.identifier);
          return !removeSet.has(idStr) && !removeSet.has(identStr);
        });

      if (Array.isArray(old)) {
        return filterList(old);
      }

      if (old && Array.isArray(old.data)) {
        return { ...old, data: filterList(old.data) };
      }

      return old;
    });

    // Build filter params for API
  };
  const filterParams = useMemo(() => {
    const params = {};

    if (activeStatus && activeStatus !== "all") {
      params.status = activeStatus;
    }

    if (advancedFilters.dateRange && advancedFilters.dateRange !== "all") {
      params.date_range = advancedFilters.dateRange;
    }

    if (advancedFilters.source && advancedFilters.source !== "all") {
      params.source = advancedFilters.source;
    }

    if (advancedFilters.leadType && advancedFilters.leadType !== "all") {
      params.lead_type = advancedFilters.leadType;
    }

    if (advancedFilters.minScore && advancedFilters.minScore > 0) {
      params.min_score = advancedFilters.minScore;
    }

    if (activePreset === "favorites") {
      params.is_favorite = true;
    }

    return params;
  }, [activeStatus, advancedFilters, activePreset]);

  const adminLeadsQuery = useAdminFetchLeads(filterParams, { enabled: context === "admin" });
  const tenantLeadsQuery = useTenantFetchLeads(filterParams, { enabled: context === "tenant" });

  const leads =
    (context === "tenant" ? tenantLeadsQuery.data : adminLeadsQuery.data) || [];
  const isLeadsFetching =
    context === "tenant" ? tenantLeadsQuery.isLoading : adminLeadsQuery.isLoading;
  const refetchLeads =
    context === "tenant" ? tenantLeadsQuery.refetch : adminLeadsQuery.refetch;

  const adminStatsQuery = useAdminFetchLeadStats({ enabled: context === "admin" });
  const tenantStatsQuery = useTenantFetchLeadStats({ enabled: context === "tenant" });
  const leadStats = context === "tenant" ? tenantStatsQuery.data : adminStatsQuery.data;
  const isLeadStatsFetching =
    context === "tenant" ? tenantStatsQuery.isFetching : adminStatsQuery.isFetching;

  const leadsByStatus = useMemo(() => leadStats?.message?.leads_by_status ?? {}, [leadStats]);

  const totalLeadCount = leadStats?.message?.leads ?? leads.length ?? 0;
  const wonCount = leadsByStatus.closed_won ?? 0;
  const engagedCount =
    (leadsByStatus.contacted ?? 0) +
    (leadsByStatus.qualified ?? 0) +
    (leadsByStatus.proposal_sent ?? 0) +
    (leadsByStatus.negotiating ?? 0);
  const conversionRate = totalLeadCount ? Math.round((wonCount / totalLeadCount) * 100) : 0;

  // Mock trend data (replace with real data from API)
  const trends = {
    pipeline: 12,
    conversion: 5,
    engaged: -3,
  };
  const statusSegments = useMemo(() => {
    return STATUS_ORDER.map((statusId: any) => {
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
    }).filter((segment: any) => segment.id === "all" || segment.count > 0);
  }, [leadsByStatus, totalLeadCount]);

  // Prepare funnel data
  const funnelStages = useMemo(() => {
    return [
      {
        id: "new",
        label: "New",
        count: leadsByStatus.new ?? 0,
        color: STATUS_CONFIG.new.color,
      },
      {
        id: "contacted",
        label: "Contacted",
        count: leadsByStatus.contacted ?? 0,
        color: STATUS_CONFIG.contacted.color,
      },
      {
        id: "qualified",
        label: "Qualified",
        count: leadsByStatus.qualified ?? 0,
        color: STATUS_CONFIG.qualified.color,
      },
      {
        id: "proposal_sent",
        label: "Proposal",
        count: leadsByStatus.proposal_sent ?? 0,
        color: STATUS_CONFIG.proposal_sent.color,
      },
      {
        id: "negotiating",
        label: "Negotiating",
        count: leadsByStatus.negotiating ?? 0,
        color: STATUS_CONFIG.negotiating.color,
      },
      {
        id: "closed_won",
        label: "Won",
        count: leadsByStatus.closed_won ?? 0,
        color: STATUS_CONFIG.closed_won.color,
      },
    ].filter((stage: any) => stage.count > 0);
  }, [leadsByStatus]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    const byStatus =
      activeStatus === "all" ? leads : leads.filter((lead: any) => lead.status === activeStatus);

    if (!searchValue.trim()) {
      return byStatus;
    }

    const term = searchValue.trim().toLowerCase();
    return byStatus.filter((lead: any) => {
      const name = `${lead.first_name} ${lead.last_name}`.toLowerCase();
      return (
        name.includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term)
      );
    });
  }, [leads, activeStatus, searchValue]);

  const getStatusColorClass = (status: any) => {
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

  const handleViewLead = (lead: any) => {
    const identifier = getLeadIdentifier(lead);
    if (!identifier) return;
    navigate(
      `${basePath}/leads/details?name=${encodeURIComponent(
        `${lead.first_name} ${lead.last_name}`
      )}&id=${encodeId(identifier)}`
    );
  };

  const handleEmailLead = (lead: any) => {
    window.location.href = `mailto:${lead.email}`;
  };

  const handleCallLead = (lead: any) => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
  };

  // Bulk selection handlers
  const handleSelectLead = (leadId: any) => {
    const normalized = normalizeId(leadId);
    setSelectedLeads((prev) =>
      prev.includes(normalized)
        ? prev.filter((id: any) => id !== normalized)
        : [...prev, normalized]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(
        filteredLeads.map((lead: any) => normalizeId(getLeadIdentifier(lead))).filter(Boolean)
      );
    }
  };

  const handleClearSelection = () => {
    setSelectedLeads([]);
  };

  const handleBulkAssign = () => {
    setAssignTarget("bulk");
    setShowAssignModal(true);
  };

  const handleUserSelected = async (user) => {
    try {
      if (assignTarget === "bulk") {
        await apiClient("POST", "/leads/bulk-assign", {
          lead_ids: selectedLeads,
          assigned_to: user.id,
        });
        ToastUtil.success(`Successfully assigned ${selectedLeads.length} lead(s) to ${user.name}`);
        setSelectedLeads([]);
        refetchLeads();
      } else if (assignTarget) {
        const identifier = getLeadIdentifier(assignTarget);
        if (!identifier) {
          throw new Error("Missing lead identifier");
        }

        await apiClient("PATCH", `/leads/${identifier}`, {
          assigned_to: user.id,
        });
        ToastUtil.success(`Successfully assigned lead to ${user.name}`);
        refetchLeads();
      }
    } catch (error) {
      ToastUtil.error("Failed to assign lead(s)");
      console.error("Assign error:", error);
    } finally {
      setAssignTarget(null);
      setShowAssignModal(false);
    }
  };
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedLeads.length} lead(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    const idsToRemove = selectedLeads.map(normalizeId).filter(Boolean);
    const previousCaches = queryClient.getQueriesData({ queryKey: [leadQueryKey] });

    // Optimistically update UI immediately
    pruneLeadsFromCache(idsToRemove);

    try {
      await apiClient("DELETE", "/leads/bulk-delete", {
        lead_ids: idsToRemove,
      });
      ToastUtil.success(`Successfully deleted ${selectedLeads.length} lead(s)`);
      setSelectedLeads([]);
      // Background revalidation; don't block UI
      queryClient.invalidateQueries({ queryKey: [leadQueryKey] });
    } catch (error) {
      // Roll back UI on failure
      previousCaches.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      ToastUtil.error("Failed to delete leads");
      console.error("Bulk delete error:", error);
    }
  };
  const handleBulkExport = async () => {
    try {
      const response = await fetch(
        `${exportBaseUrl}/leads/bulk-export`,
        {
          method: "POST",
          headers: {
            ...(authHeaders || {}),
            "Content-Type": "application/json",
            Accept: "text/csv",
          },
          credentials: "include",
          body: JSON.stringify({ lead_ids: selectedLeads }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      ToastUtil.success(`Successfully exported ${selectedLeads.length} lead(s)`);
    } catch (error) {
      ToastUtil.error(error.message || "Failed to export leads");
      console.error("Bulk export error:", error);
    }

    // Filter handlers
  };
  const handlePresetChange = (presetId: any) => {
    setActivePreset(presetId);

    // Apply preset logic
    switch (presetId) {
      case "hot":
        setAdvancedFilters({ ...advancedFilters, minScore: 80 });
        break;
      case "engaged":
        setActiveStatus("contacted");
        break;
      case "favorites":
        // TODO: Implement favorites filter
        break;
      default:
        setActiveStatus("all");
        setAdvancedFilters({
          dateRange: "all",
          source: "all",
          leadType: "all",
          minScore: 0,
        });
    }
  };
  const handleApplyFilters = () => {
    setShowAdvancedFilters(false);
    // Filters are applied via useMemo
  };
  const handleResetFilters = () => {
    setAdvancedFilters({
      dateRange: "all",
      source: "all",
      leadType: "all",
      minScore: 0,
    });
  };
  const handleEditLead = (lead: any) => {
    // TODO: Navigate to edit page or open modal
    ToastUtil.info("Edit lead feature coming soon");
  };
  const handleDeleteLead = async (lead) => {
    if (!window.confirm(`Are you sure you want to delete ${lead.first_name} ${lead.last_name}?`)) {
      return;
    }

    let previousCaches = [];

    try {
      const identifier = getLeadIdentifier(lead);
      if (!identifier) {
        throw new Error("Missing lead identifier");
      }

      const normalized = normalizeId(identifier);
      previousCaches = queryClient.getQueriesData({ queryKey: [leadQueryKey] });

      // Optimistic UI update
      pruneLeadsFromCache([normalized]);
      await apiClient("DELETE", `/leads/${normalized}`);
      ToastUtil.success("Lead deleted successfully");
      setSelectedLeads((prev) => prev.filter((id: any) => id !== normalized));
      queryClient.invalidateQueries({ queryKey: [leadQueryKey] });
    } catch (error) {
      // Restore cache on failure
      previousCaches.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      ToastUtil.error("Failed to delete lead");
      console.error("Delete error:", error);
    }
  };
  const handleAssignLead = (lead: any) => {
    setAssignTarget(lead);
    setShowAssignModal(true);
  };
  const handleToggleFavorite = async (lead) => {
    try {
      const identifier = getLeadIdentifier(lead);
      if (!identifier) {
        throw new Error("Missing lead identifier");
      }

      await apiClient("POST", `/leads/${identifier}/toggle-favorite`);
      ToastUtil.success(lead.is_favorite ? "Removed from favorites" : "Added to favorites");
      await refetchLeads();
    } catch (error) {
      ToastUtil.error("Failed to update favorite status");
      console.error("Toggle favorite error:", error);
    }
  };
  const headerActions = (
    <ModernButton onClick={openCreateLead} className="inline-flex items-center gap-2">
      <UserPlus className="h-4 w-4" />
      Add lead
    </ModernButton>
  );

  const leadColumns = useMemo(
    () => [
      {
        header: (
          <input
            type="checkbox"
            checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />
        ),
        key: "select",
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedLeads.includes(normalizeId(getLeadIdentifier(row)))}
            onChange={() => handleSelectLead(getLeadIdentifier(row))}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />
        ),
      },
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
            {row.phone && <span className="text-xs text-slate-400">{row.phone}</span>}
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
        header: "Score",
        key: "score",
        render: (row) => <LeadScoreIndicator score={row.score || 0} size="sm" showLabel={false} />,
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
          <span className="text-sm text-slate-500">{formatCreatedAt(row.created_at)}</span>
        ),
      },
      {
        header: "",
        key: "actions",
        align: "right",
        render: (row) => (
          <QuickActionsMenu
            lead={row}
            onView={handleViewLead}
            onEdit={handleEditLead}
            onEmail={handleEmailLead}
            onCall={handleCallLead}
            onDelete={handleDeleteLead}
            onAssign={handleAssignLead}
          />
        ),
      },
    ],
    [navigate, selectedLeads, filteredLeads]
  );

  return (
    <>
      <div className="space-y-8">
        <ResourceHero
          title="Lead pipeline"
          subtitle="Growth"
          description="Track how prospects move through each stage and spot opportunities for faster conversions."
          metrics={[
            {
              label: "Pipeline volume",
              value: totalLeadCount,
              description: (
                <div className="flex items-center gap-2">
                  <span>All leads across every stage</span>
                  <TrendIndicator value={trends.pipeline} />
                </div>
              ),
              icon: <Users className="h-4 w-4" />,
            },
            {
              label: "Conversion rate",
              value: `${conversionRate}%`,
              description: (
                <div className="flex items-center gap-2">
                  <span>Closed won vs. total leads</span>
                  <TrendIndicator value={trends.conversion} />
                </div>
              ),
              icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
              label: "Engaged leads",
              value: engagedCount,
              description: (
                <div className="flex items-center gap-2">
                  <span>In conversation right now</span>
                  <TrendIndicator value={trends.engaged} />
                </div>
              ),
              icon: <BarChart3 className="h-4 w-4" />,
            },
          ]}
          accent="midnight"
          rightSlot={headerActions}
        />

        {/* Pipeline Funnel Visualization */}
        {funnelStages.length > 0 && (
          <ModernCard className="space-y-4 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Conversion funnel
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Pipeline health at a glance
                </h2>
                <p className="text-sm text-slate-500">
                  Watch how leads flow through each stage and identify bottlenecks.
                </p>
              </div>
            </div>
            <PipelineFunnel stages={funnelStages} onStageClick={setActiveStatus} />
          </ModernCard>
        )}

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
                Select a stage to highlight the leads that need attention right now.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ArrowUpRight className="h-3 w-3" />
              Live updates
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statusSegments.map((segment: any) => {
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
                  <p className={`text-sm ${isActive ? "text-white/80" : "text-slate-500"}`}>
                    {config.description}
                  </p>
                </button>
              );
            })}
          </div>
        </ModernCard>

        <ModernCard className="space-y-6 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-slate-900">Lead directory</h2>
              <p className="text-sm text-slate-500">
                Explore every prospect, understand where they are in the journey, and dig into the
                context behind each opportunity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  showAdvancedFilters
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>

          {/* Filter Presets */}
          <FilterPresets activePreset={activePreset} onPresetChange={handlePresetChange} />

          {/* Advanced Filter Panel */}
          {showAdvancedFilters && (
            <AdvancedFilterPanel
              isOpen={showAdvancedFilters}
              onClose={() => setShowAdvancedFilters(false)}
              filters={advancedFilters}
              onFilterChange={setAdvancedFilters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          )}

          {view === "table" ? (
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
                  <ModernButton onClick={openCreateLead} className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add your first lead
                  </ModernButton>
                ),
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Search for card view */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Card Grid */}
              {isLeadsFetching ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : filteredLeads.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLeads.map((lead: any) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onView={handleViewLead}
                      onEmail={handleEmailLead}
                      onCall={handleCallLead}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">No leads found</h3>
                  <p className="mb-4 text-sm text-slate-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          )}
        </ModernCard>

        {isLeadStatsFetching && (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedLeads.length}
        onAssign={handleBulkAssign}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onClearSelection={handleClearSelection}
      />

      {/* User Select Modal */}
      <UserSelectModal
        context={context}
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssignTarget(null);
        }}
        onSelect={handleUserSelected}
        title={assignTarget === "bulk" ? `Assign ${selectedLeads.length} Lead(s)` : "Assign Lead"}
      />
    </>
  );
};

export default LeadsDashboard;
