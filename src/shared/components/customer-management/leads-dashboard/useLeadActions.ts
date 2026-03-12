import { useNavigate } from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";
import type { Lead } from "@/types/lead";
import adminSilentApi from "../../../../index/admin/silent";
import tenantSilentApi from "../../../../index/tenant/silentTenant";
import adminFileApi from "../../../../index/admin/fileapi";
import tenantFileApi from "../../../../index/tenant/fileapi";
import ToastUtil from "@/utils/toastUtil";
import logger from "@/utils/logger";
import type { AdvancedFiltersState } from "../../tables/AdvancedFilterPanel";
import {
  encodeId,
  getLeadIdentifier,
  normalizeId,
  isLead,
  getErrorMessage,
} from "./leads-dashboard.utils";
import type {
  StatusKey,
  AssignUser,
  FileApiClient,
  QuickActionLead,
} from "./leads-dashboard.types";

interface UseLeadActionsOptions {
  context: "admin" | "tenant";
  queryClient: QueryClient;
  leadQueryKey: string;
  selectedLeads: string[];
  filteredLeads: Lead[];
  assignTarget: Lead | "bulk" | null;
  advancedFilters: AdvancedFiltersState;
  setSelectedLeads: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveStatus: React.Dispatch<React.SetStateAction<StatusKey>>;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFiltersState>>;
  setActivePreset: React.Dispatch<React.SetStateAction<string>>;
  setShowAdvancedFilters: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
  setAssignTarget: React.Dispatch<React.SetStateAction<Lead | "bulk" | null>>;
  refetchLeads: () => void;
  pruneLeadsFromCache: (ids: (string | number)[]) => void;
}

export function useLeadActions({
  context,
  queryClient,
  leadQueryKey,
  selectedLeads,
  filteredLeads,
  assignTarget,
  advancedFilters,
  setSelectedLeads,
  setActiveStatus,
  setAdvancedFilters,
  setActivePreset,
  setShowAdvancedFilters,
  setShowAssignModal,
  setAssignTarget,
  refetchLeads,
  pruneLeadsFromCache,
}: UseLeadActionsOptions) {
  const navigate = useNavigate();

  const basePath = context === "admin" ? "/admin-dashboard" : "/dashboard";
  const apiClient = context === "admin" ? adminSilentApi : tenantSilentApi;

  const openCreateLead = () => navigate(`${basePath}/leads/create`);

  const handleViewLead = (lead: Lead) => {
    const identifier = getLeadIdentifier(lead);
    if (!identifier) return;
    navigate(
      `${basePath}/leads/details?name=${encodeURIComponent(
        `${lead.first_name} ${lead.last_name}`
      )}&id=${encodeId(identifier)}`
    );
  };

  const handleEmailLead = (lead: Lead) => {
    globalThis.window.location.href = `mailto:${lead.email}`;
  };

  const handleCallLead = (lead: Lead) => {
    if (lead.phone) {
      globalThis.window.location.href = `tel:${lead.phone}`;
    }
  };

  const handleSelectLead = (leadId: string | number | null | undefined) => {
    const normalized = normalizeId(leadId);
    setSelectedLeads((prev) =>
      prev.includes(normalized) ? prev.filter((id) => id !== normalized) : [...prev, normalized]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(
        filteredLeads
          .map((lead) => normalizeId(getLeadIdentifier(lead)))
          .filter((id): id is string => id.length > 0)
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

  const handleUserSelected = async (user: AssignUser) => {
    try {
      if (!user || (typeof user.id !== "string" && typeof user.id !== "number")) {
        throw new Error("Missing assignment target");
      }
      if (assignTarget === "bulk") {
        await apiClient("POST", "/leads/bulk-assign", {
          lead_ids: selectedLeads,
          assigned_to: user.id,
        });
        ToastUtil.success(
          `Successfully assigned ${selectedLeads.length} lead(s) to ${user.name ?? "user"}`
        );
        setSelectedLeads([]);
        refetchLeads();
      } else if (assignTarget) {
        const identifier = getLeadIdentifier(assignTarget as Lead);
        if (!identifier) {
          throw new Error("Missing lead identifier");
        }

        await apiClient("PATCH", `/leads/${identifier}`, {
          assigned_to: user.id,
        });
        ToastUtil.success(`Successfully assigned lead to ${user.name ?? "user"}`);
        refetchLeads();
      }
    } catch (error) {
      ToastUtil.error("Failed to assign lead(s)");
      logger.error("Assign error:", error);
    } finally {
      setAssignTarget(null);
      setShowAssignModal(false);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !globalThis.window.confirm(
        `Are you sure you want to delete ${selectedLeads.length} lead(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    const idsToRemove = selectedLeads.map(normalizeId).filter(Boolean);
    const previousCaches = queryClient.getQueriesData({ queryKey: [leadQueryKey] });

    pruneLeadsFromCache(idsToRemove);

    try {
      await apiClient("DELETE", "/leads/bulk-delete", {
        lead_ids: idsToRemove,
      });
      ToastUtil.success(`Successfully deleted ${selectedLeads.length} lead(s)`);
      setSelectedLeads([]);
      queryClient.invalidateQueries({ queryKey: [leadQueryKey] });
    } catch (error) {
      previousCaches.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      ToastUtil.error("Failed to delete leads");
      logger.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async () => {
    const fileApiClient: FileApiClient =
      context === "admin" ? adminFileApi : (tenantFileApi as unknown as FileApiClient);
    try {
      const response = await fileApiClient("POST", "/leads/bulk-export", {
        lead_ids: selectedLeads,
      });

      const blob = response instanceof Blob ? response : new Blob([response as BlobPart]);
      const url = globalThis.window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      globalThis.window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      ToastUtil.success(`Successfully exported ${selectedLeads.length} lead(s)`);
    } catch (error) {
      ToastUtil.error(getErrorMessage(error, "Failed to export leads"));
      logger.error("Bulk export error:", error);
    }
  };

  const handlePresetChange = (presetId: string) => {
    setActivePreset(presetId);

    switch (presetId) {
      case "hot":
        setAdvancedFilters({ ...advancedFilters, minScore: 80 });
        break;
      case "engaged":
        setActiveStatus("contacted");
        break;
      case "favorites":
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
  };

  const handleResetFilters = () => {
    setAdvancedFilters({
      dateRange: "all",
      source: "all",
      leadType: "all",
      minScore: 0,
    });
  };

  const handleEditLead = (lead: Lead) => {
    void lead;
    ToastUtil.info("Edit lead feature coming soon");
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (
      !globalThis.window.confirm(
        `Are you sure you want to delete ${lead.first_name} ${lead.last_name}?`
      )
    ) {
      return;
    }

    let previousCaches: Array<[unknown, unknown]> = [];

    try {
      const identifier = getLeadIdentifier(lead);
      if (!identifier) {
        throw new Error("Missing lead identifier");
      }

      const normalized = normalizeId(identifier);
      previousCaches = queryClient.getQueriesData({ queryKey: [leadQueryKey] });

      pruneLeadsFromCache([normalized]);
      await apiClient("DELETE", `/leads/${normalized}`);
      ToastUtil.success("Lead deleted successfully");
      setSelectedLeads((prev) => prev.filter((id: string) => id !== normalized));
      queryClient.invalidateQueries({ queryKey: [leadQueryKey] });
    } catch (error) {
      previousCaches.forEach(([key, data]) => {
        queryClient.setQueryData(key as import("@tanstack/react-query").QueryKey, data);
      });
      ToastUtil.error("Failed to delete lead");
      logger.error("Delete error:", error);
    }
  };

  const handleAssignLead = (lead: Lead) => {
    setAssignTarget(lead);
    setShowAssignModal(true);
  };

  const handleToggleFavorite = async (lead: Lead) => {
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
      logger.error("Toggle favorite error:", error);
    }
  };

  // Quick-action wrappers that narrow the union type
  const handleQuickView = (lead: QuickActionLead) => {
    if (isLead(lead)) handleViewLead(lead);
  };
  const handleQuickEdit = (lead: QuickActionLead) => {
    if (isLead(lead)) handleEditLead(lead);
  };
  const handleQuickEmail = (lead: QuickActionLead) => {
    if (isLead(lead)) handleEmailLead(lead);
  };
  const handleQuickCall = (lead: QuickActionLead) => {
    if (isLead(lead)) handleCallLead(lead);
  };
  const handleQuickDelete = (lead: QuickActionLead) => {
    if (isLead(lead)) void handleDeleteLead(lead);
  };
  const handleQuickAssign = (lead: QuickActionLead) => {
    if (isLead(lead)) handleAssignLead(lead);
  };

  return {
    basePath,
    openCreateLead,
    handleViewLead,
    handleEmailLead,
    handleCallLead,
    handleSelectLead,
    handleSelectAll,
    handleClearSelection,
    handleBulkAssign,
    handleUserSelected,
    handleBulkDelete,
    handleBulkExport,
    handlePresetChange,
    handleApplyFilters,
    handleResetFilters,
    handleEditLead,
    handleDeleteLead,
    handleAssignLead,
    handleToggleFavorite,
    handleQuickView,
    handleQuickEdit,
    handleQuickEmail,
    handleQuickCall,
    handleQuickDelete,
    handleQuickAssign,
  };
}
