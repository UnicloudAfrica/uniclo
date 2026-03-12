import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useFetchLeads as useAdminFetchLeads,
  useFetchLeadStats as useAdminFetchLeadStats,
} from "@/hooks/adminHooks/leadsHooks";
import {
  useFetchLeads as useTenantFetchLeads,
  useFetchLeadStats as useTenantFetchLeadStats,
} from "@/hooks/tenantHooks/leadsHooks";
import type { Lead } from "@/types/lead";
import type { AdvancedFiltersState } from "../../tables/AdvancedFilterPanel";
import {
  extractLeads,
  extractLeadStats,
  normalizeId,
  isLead,
  asArray,
  isRecord,
} from "./leads-dashboard.utils";
import {
  STATUS_CONFIG,
  STATUS_ORDER,
  type StatusKey,
  type StatusSegment,
  type FunnelStage,
} from "./leads-dashboard.types";

interface UseLeadsDashboardDataOptions {
  context: "admin" | "tenant";
}

export function useLeadsDashboardData({ context }: UseLeadsDashboardDataOptions) {
  const queryClient = useQueryClient();

  const [activeStatus, setActiveStatus] = useState<StatusKey>("all");
  const [searchValue, setSearchValue] = useState("");
  const [view, setView] = useState("table");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activePreset, setActivePreset] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    dateRange: "all",
    source: "all",
    leadType: "all",
    minScore: 0,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Lead | "bulk" | null>(null);

  const leadQueryKey = context === "admin" ? "admin-leads" : "tenant-leads";

  const pruneLeadsFromCache = (idsToRemove: (string | number)[]) => {
    const removeSet = new Set((idsToRemove || []).map(normalizeId).filter(Boolean));

    if (removeSet.size === 0) return;

    queryClient.setQueriesData({ queryKey: [leadQueryKey] }, (old: unknown) => {
      const filterList = (list: unknown) =>
        asArray<unknown>(list)
          .filter(isLead)
          .filter((lead) => {
            const idStr = normalizeId(lead.id);
            const identStr = normalizeId(lead.identifier);
            return !removeSet.has(idStr) && !removeSet.has(identStr);
          });

      if (Array.isArray(old)) {
        return filterList(old);
      }

      if (isRecord(old) && Array.isArray(old.data)) {
        return { ...old, data: filterList(old.data) };
      }

      return old;
    });
  };

  const filterParams = useMemo(() => {
    const params: Record<string, string | number | boolean> = {};

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

  // Leads queries
  const adminLeadsQuery = useAdminFetchLeads(filterParams, { enabled: context === "admin" });
  const tenantLeadsQuery = useTenantFetchLeads(filterParams, { enabled: context === "tenant" });
  const leadQueryData = context === "tenant" ? tenantLeadsQuery.data : adminLeadsQuery.data;
  const leads = useMemo(() => extractLeads(leadQueryData), [leadQueryData]);
  const isLeadsFetching =
    context === "tenant" ? tenantLeadsQuery.isLoading : adminLeadsQuery.isLoading;
  const refetchLeads = context === "tenant" ? tenantLeadsQuery.refetch : adminLeadsQuery.refetch;

  // Stats queries
  const adminStatsQuery = useAdminFetchLeadStats({ enabled: context === "admin" });
  const tenantStatsQuery = useTenantFetchLeadStats({ enabled: context === "tenant" });
  const leadStatsData = context === "tenant" ? tenantStatsQuery.data : adminStatsQuery.data;
  const isLeadStatsFetching =
    context === "tenant" ? tenantStatsQuery.isFetching : adminStatsQuery.isFetching;

  const leadStats = useMemo(() => extractLeadStats(leadStatsData), [leadStatsData]);
  const leadsByStatus = leadStats.leads_by_status;
  const totalLeadCount = leadStats.leads ?? leads.length ?? 0;
  const wonCount = leadsByStatus["closed_won"] ?? 0;
  const engagedCount =
    (leadsByStatus["contacted"] ?? 0) +
    (leadsByStatus["qualified"] ?? 0) +
    (leadsByStatus["proposal_sent"] ?? 0) +
    (leadsByStatus["negotiating"] ?? 0);
  const conversionRate = totalLeadCount ? Math.round((wonCount / totalLeadCount) * 100) : 0;

  // Mock trend data (replace with real data from API)
  const trends = {
    pipeline: 12,
    conversion: 5,
    engaged: -3,
  };

  const statusSegments = useMemo<StatusSegment[]>(() => {
    return STATUS_ORDER.map((statusId) => {
      if (statusId === "all") {
        return {
          id: "all" as const,
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

  const funnelStages = useMemo<FunnelStage[]>(() => {
    return [
      {
        id: "new" as const,
        label: "New",
        count: leadsByStatus["new"] ?? 0,
        color: STATUS_CONFIG.new.color,
      },
      {
        id: "contacted" as const,
        label: "Contacted",
        count: leadsByStatus["contacted"] ?? 0,
        color: STATUS_CONFIG.contacted.color,
      },
      {
        id: "qualified" as const,
        label: "Qualified",
        count: leadsByStatus["qualified"] ?? 0,
        color: STATUS_CONFIG.qualified.color,
      },
      {
        id: "proposal_sent" as const,
        label: "Proposal",
        count: leadsByStatus["proposal_sent"] ?? 0,
        color: STATUS_CONFIG.proposal_sent.color,
      },
      {
        id: "negotiating" as const,
        label: "Negotiating",
        count: leadsByStatus["negotiating"] ?? 0,
        color: STATUS_CONFIG.negotiating.color,
      },
      {
        id: "closed_won" as const,
        label: "Won",
        count: leadsByStatus["closed_won"] ?? 0,
        color: STATUS_CONFIG.closed_won.color,
      },
    ].filter((stage) => stage.count > 0);
  }, [leadsByStatus]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    const byStatus =
      activeStatus === "all" ? leads : leads.filter((lead) => lead.status === activeStatus);

    if (!searchValue.trim()) {
      return byStatus;
    }

    const term = searchValue.trim().toLowerCase();
    return byStatus.filter((lead: Lead) => {
      const name = `${lead.first_name} ${lead.last_name}`.toLowerCase();
      return (
        name.includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term)
      );
    });
  }, [leads, activeStatus, searchValue]);

  return {
    // Query client (for cache operations in actions)
    queryClient,
    leadQueryKey,

    // State values
    activeStatus,
    searchValue,
    view,
    selectedLeads,
    showAdvancedFilters,
    activePreset,
    advancedFilters,
    showAssignModal,
    assignTarget,

    // State setters
    setActiveStatus,
    setSearchValue,
    setView,
    setSelectedLeads,
    setShowAdvancedFilters,
    setActivePreset,
    setAdvancedFilters,
    setShowAssignModal,
    setAssignTarget,

    // Derived data
    leads,
    filteredLeads,
    isLeadsFetching,
    isLeadStatsFetching,
    totalLeadCount,
    conversionRate,
    engagedCount,
    trends,
    statusSegments,
    funnelStages,

    // Functions
    refetchLeads,
    pruneLeadsFromCache,
  };
}
