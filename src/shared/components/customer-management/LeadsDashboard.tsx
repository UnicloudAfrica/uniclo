import React from "react";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Filter,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import ResourceHero from "../ui/ResourceHero";
import ResourceDataExplorer from "../../../adminDashboard/components/ResourceDataExplorer";
import TrendIndicator from "../../../adminDashboard/components/TrendIndicator";
import PipelineFunnel from "../../../adminDashboard/components/PipelineFunnel";
import ViewToggle from "../../../adminDashboard/components/ViewToggle";
import { AdvancedFilterPanel, BulkActionBar, FilterPresets } from "../tables";
import UserSelectModal from "./UserSelectModal";
import LeadCardGrid from "./leads-dashboard/LeadCardGrid";
import { useLeadsDashboardData } from "./leads-dashboard/useLeadsDashboardData";
import { useLeadActions } from "./leads-dashboard/useLeadActions";
import { useLeadColumns } from "./leads-dashboard/LeadColumns";
import {
  STATUS_CONFIG,
  type StatusKey,
  type LeadsDashboardProps,
} from "./leads-dashboard/leads-dashboard.types";

const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ context = "admin" }) => {
  const data = useLeadsDashboardData({ context });

  const actions = useLeadActions({
    context,
    queryClient: data.queryClient,
    leadQueryKey: data.leadQueryKey,
    selectedLeads: data.selectedLeads,
    filteredLeads: data.filteredLeads,
    assignTarget: data.assignTarget,
    advancedFilters: data.advancedFilters,
    setSelectedLeads: data.setSelectedLeads,
    setActiveStatus: data.setActiveStatus,
    setAdvancedFilters: data.setAdvancedFilters,
    setActivePreset: data.setActivePreset,
    setShowAdvancedFilters: data.setShowAdvancedFilters,
    setShowAssignModal: data.setShowAssignModal,
    setAssignTarget: data.setAssignTarget,
    refetchLeads: data.refetchLeads,
    pruneLeadsFromCache: data.pruneLeadsFromCache,
  });

  const leadColumns = useLeadColumns({
    selectedLeads: data.selectedLeads,
    filteredLeads: data.filteredLeads,
    handleSelectAll: actions.handleSelectAll,
    handleSelectLead: actions.handleSelectLead,
    handleQuickView: actions.handleQuickView,
    handleQuickEdit: actions.handleQuickEdit,
    handleQuickEmail: actions.handleQuickEmail,
    handleQuickCall: actions.handleQuickCall,
    handleQuickDelete: actions.handleQuickDelete,
    handleQuickAssign: actions.handleQuickAssign,
  });

  const headerActions = (
    <ModernButton onClick={actions.openCreateLead} className="inline-flex items-center gap-2">
      <UserPlus className="h-4 w-4" />
      Add lead
    </ModernButton>
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
              value: data.totalLeadCount,
              description: (
                <div className="flex items-center gap-2">
                  <span>All leads across every stage</span>
                  <TrendIndicator value={data.trends.pipeline} />
                </div>
              ) as unknown as string,
              icon: <Users className="h-4 w-4" />,
            },
            {
              label: "Conversion rate",
              value: `${data.conversionRate}%`,
              description: (
                <div className="flex items-center gap-2">
                  <span>Closed won vs. total leads</span>
                  <TrendIndicator value={data.trends.conversion} />
                </div>
              ) as unknown as string,
              icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
              label: "Engaged leads",
              value: data.engagedCount,
              description: (
                <div className="flex items-center gap-2">
                  <span>In conversation right now</span>
                  <TrendIndicator value={data.trends.engaged} />
                </div>
              ) as unknown as string,
              icon: <BarChart3 className="h-4 w-4" />,
            },
          ]}
          accent="midnight"
          rightSlot={headerActions}
        />

        {/* Pipeline Funnel Visualization */}
        {data.funnelStages.length > 0 && (
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
            <PipelineFunnel
              stages={data.funnelStages}
              onStageClick={(stageId) => data.setActiveStatus(String(stageId) as StatusKey)}
            />
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
            {data.statusSegments.map((segment) => {
              const config = STATUS_CONFIG[segment.id] || STATUS_CONFIG.all;
              const isActive = data.activeStatus === segment.id;
              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() => data.setActiveStatus(segment.id)}
                  className={`group flex flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[--theme-color] bg-[--theme-color] text-white shadow-lg"
                      : "border-slate-200 bg-white hover:border-[--theme-color] hover:bg-[--theme-color-10]"
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
                onClick={() => data.setShowAdvancedFilters(!data.showAdvancedFilters)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  data.showAdvancedFilters
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <ViewToggle view={data.view} onViewChange={data.setView} />
            </div>
          </div>

          {/* Filter Presets */}
          <FilterPresets
            activePreset={data.activePreset}
            onPresetChange={actions.handlePresetChange}
          />

          {/* Advanced Filter Panel */}
          {data.showAdvancedFilters && (
            <AdvancedFilterPanel
              isOpen={data.showAdvancedFilters}
              onClose={() => data.setShowAdvancedFilters(false)}
              filters={data.advancedFilters}
              onFilterChange={data.setAdvancedFilters}
              onApply={actions.handleApplyFilters}
              onReset={actions.handleResetFilters}
            />
          )}

          {data.view === "table" ? (
            <ResourceDataExplorer
              columns={leadColumns}
              rows={data.filteredLeads}
              loading={data.isLeadsFetching}
              searchValue={data.searchValue}
              onSearch={data.setSearchValue}
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
                    onClick={actions.openCreateLead}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add your first lead
                  </ModernButton>
                ),
              }}
            />
          ) : (
            <LeadCardGrid
              leads={data.filteredLeads}
              isLoading={data.isLeadsFetching}
              searchValue={data.searchValue}
              onSearchChange={data.setSearchValue}
              onViewLead={actions.handleViewLead}
              onEmailLead={actions.handleEmailLead}
              onCallLead={actions.handleCallLead}
              onToggleFavorite={actions.handleToggleFavorite}
            />
          )}
        </ModernCard>

        {data.isLeadStatsFetching && (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={data.selectedLeads.length}
        onAssign={actions.handleBulkAssign}
        onDelete={actions.handleBulkDelete}
        onExport={actions.handleBulkExport}
        onClearSelection={actions.handleClearSelection}
      />

      {/* User Select Modal */}
      <UserSelectModal
        context={context}
        isOpen={data.showAssignModal}
        onClose={() => {
          data.setShowAssignModal(false);
          data.setAssignTarget(null);
        }}
        onSelect={actions.handleUserSelected}
        title={
          data.assignTarget === "bulk"
            ? `Assign ${data.selectedLeads.length} Lead(s)`
            : "Assign Lead"
        }
      />
    </>
  );
};

export default LeadsDashboard;
