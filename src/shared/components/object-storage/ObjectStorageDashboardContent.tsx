import React, { useMemo } from "react";
import ObjectStorageTable from "./ObjectStorageTable";
import ObjectStoragePlanActions from "./ObjectStoragePlanActions";
import type {
  ObjectStoragePreset,
  ObjectStorageEmptyActionConfig,
} from "../../config/objectStoragePresets";

interface ObjectStoragePlanHandlers {
  onStandardPlan?: () => void;
  onFastTrack?: () => void;
  onBack?: () => void;
  hasTenantContext?: boolean;
  canFastTrack?: boolean;
  loading?: boolean;
}

interface ObjectStorageTableProps {
  accounts: any[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRowClick?: (account: any) => void;
  silosByAccount?: Record<string, any[]>;
  siloLoading?: Record<string, boolean>;
  siloErrors?: Record<string, string | null>;
  onLoadSilos?: (accountId: any) => Promise<any>;
  onCreateSilo?: (accountId: any, payload: any) => void;
  onDeleteSilo?: (accountId: any, silo: any) => void;
  paginationMeta?: any;
  paginationState?: any;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

interface ObjectStorageDashboardContentProps {
  preset: ObjectStoragePreset;
  planActions?: ObjectStoragePlanHandlers;
  table: ObjectStorageTableProps;
  emptyState?: {
    title: string;
    description: string;
    actions?: Array<{ label: string; onClick?: () => void; variant?: string; disabled?: boolean }>;
  };
}

const ObjectStorageDashboardContent: React.FC<ObjectStorageDashboardContentProps> = ({
  preset,
  planActions,
  table,
  emptyState,
}) => {
  const statusCounts = useMemo(() => {
    const base = { total: 0, active: 0, provisioning: 0, failed: 0 };
    const accounts = Array.isArray(table.accounts) ? table.accounts : [];
    base.total = accounts.length;

    accounts.forEach((account) => {
      const status = (account?.status || "").toLowerCase();
      if (status.includes("active")) base.active += 1;
      else if (status.includes("provision")) base.provisioning += 1;
      else if (status.includes("fail")) base.failed += 1;
    });

    return base;
  }, [table.accounts]);

  const resolveActionHandler = (action: ObjectStorageEmptyActionConfig) => {
    if (action.id === "standard") return planActions?.onStandardPlan;
    if (action.id === "fastTrack") return planActions?.onFastTrack;
    if (action.id === "refresh") return table.onRefresh;
    return undefined;
  };

  const resolvedEmptyState = useMemo(() => {
    if (emptyState) return emptyState;

    const actions =
      preset.emptyState.actions?.map((action) => {
        const handler = resolveActionHandler(action);
        return {
          label: action.label,
          variant: action.variant,
          onClick: handler,
          disabled: !handler || planActions?.loading,
        };
      }) || [];

    return {
      title: preset.emptyState.title,
      description: preset.emptyState.description,
      actions,
    };
  }, [emptyState, preset, planActions, table.onRefresh]);

  return (
    <div className="space-y-6">
      <section
        className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${preset.hero.gradientClassName} text-white shadow-2xl`}
      >
        <div className="absolute inset-0 opacity-60">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" />
        </div>
        <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              {preset.hero.badge}
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {preset.hero.heading}
              </h2>
              <p className="text-sm text-white/80 sm:text-base">{preset.hero.copy}</p>
            </div>
            <ObjectStoragePlanActions
              persona={preset.planActions.persona}
              hasTenantContext={planActions?.hasTenantContext}
              canFastTrack={planActions?.canFastTrack}
              enableFastTrack={preset.planActions.enableFastTrack}
              standardLabel={preset.planActions.standardLabel}
              fastTrackLabel={preset.planActions.fastTrackLabel}
              onBack={planActions?.onBack}
              onStandardPlan={planActions?.onStandardPlan}
              onFastTrack={planActions?.onFastTrack}
              loading={planActions?.loading}
            />
          </div>
          <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
            {preset.heroCards.map((card) => {
              const Icon = card.icon;
              const value = statusCounts[card.key] ?? 0;
              return (
                <div
                  key={card.key}
                  className="rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur"
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
                    <span>{card.label}</span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                  <p className="text-xs text-white/70">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ObjectStorageTable
        accounts={table.accounts}
        loading={table.loading}
        error={table.error}
        onRetry={table.onRetry}
        onRefresh={table.onRefresh}
        onRowClick={table.onRowClick}
        silosByAccount={table.silosByAccount}
        siloLoading={table.siloLoading}
        siloErrors={table.siloErrors}
        onLoadSilos={table.onLoadSilos}
        onCreateSilo={table.onCreateSilo}
        onDeleteSilo={table.onDeleteSilo}
        emptyState={resolvedEmptyState}
        enableSiloActions={preset.enableSiloActions}
        paginationMeta={table.paginationMeta}
        paginationState={table.paginationState}
        onPageChange={table.onPageChange}
        onPerPageChange={table.onPerPageChange}
      />
    </div>
  );
};

export default ObjectStorageDashboardContent;
