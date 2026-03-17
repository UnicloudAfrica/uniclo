/**
 * ProtectionOverview — Dashboard page for Protection Services.
 *
 * Shows integration status, stats cards, and operations table.
 * Fully responsive: stacks on mobile, 3-column grid on desktop.
 */
import React from "react";
import {
  ShieldCheck,
  HardDrive,
  RefreshCw,
  ArrowUpDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ModernCard, ModernStatsCard, ModernButton } from "../ui";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import IntegrationOperationsTable from "./IntegrationOperationsTable";
import {
  useFetchIntegrationConfig,
  useFetchIntegrationOperations,
  useEnableIntegration,
  useDisableIntegration,
  useCheckDestinations,
} from "@/shared/hooks/resources/integrationHooks";
import type { IntegrationOperation } from "@/shared/hooks/resources/integrationHooks";

interface ProtectionOverviewProps {
  context: "admin" | "tenant" | "client";
  integrationKey?: string;
}

const ProtectionOverview: React.FC<ProtectionOverviewProps> = ({
  context: _context,
  integrationKey = "anycloudflow",
}) => {
  const { data: config, isLoading: loadingConfig } = useFetchIntegrationConfig(integrationKey);
  const { data: operations, isLoading: loadingOps } = useFetchIntegrationOperations();
  const enableIntegration = useEnableIntegration();
  const disableIntegration = useDisableIntegration();
  const { data: destinationCheck } = useCheckDestinations(integrationKey, {
    enabled: !!config?.enabled,
  });

  const operationsList = (operations ?? []) as IntegrationOperation[];
  const hasNoDestinations = config?.enabled && destinationCheck && !destinationCheck.has_destinations;

  // Compute stats
  const totalOps = operationsList.length;
  const completedOps = operationsList.filter((o) => o.status === "completed").length;
  const failedOps = operationsList.filter((o) => o.status === "failed").length;
  const activeOps = operationsList.filter(
    (o) => o.status === "in_progress" || o.status === "pending",
  ).length;

  if (loadingConfig) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Status Banner */}
      <ModernCard variant="outlined" padding="default">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <ShieldCheck size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                {config?.label ?? "AnyCloudFlow"}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                Backup, Replication, Migration &amp; Disaster Recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IntegrationStatusBadge
              status={config?.enabled ? "active" : "disabled"}
              size="md"
            />
            {config?.enabled ? (
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() =>
                  disableIntegration.mutate({ integrationKey })
                }
                disabled={disableIntegration.isPending}
              >
                Disable
              </ModernButton>
            ) : (
              <ModernButton
                variant="primary"
                size="sm"
                onClick={() =>
                  enableIntegration.mutate({ integrationKey })
                }
                disabled={enableIntegration.isPending}
              >
                Enable
              </ModernButton>
            )}
          </div>
        </div>

        {config?.capabilities && config.capabilities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            {config.capabilities.map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {cap === "backup" && <HardDrive size={12} />}
                {cap === "replication" && <RefreshCw size={12} />}
                {cap === "migration" && <ArrowUpDown size={12} />}
                {cap.charAt(0).toUpperCase() + cap.slice(1)}
              </span>
            ))}
          </div>
        )}
      </ModernCard>

      {/* No Destinations Warning */}
      {hasNoDestinations && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              No backup destinations configured
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
              You need to create at least one backup destination before enabling backups on your
              resources. Go to the <strong>Destinations</strong> page to configure storage targets.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {config?.enabled && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <ModernStatsCard
            title="Total Operations"
            value={totalOps}
            icon={<Activity size={18} />}
            color="primary"
            size="sm"
          />
          <ModernStatsCard
            title="Completed"
            value={completedOps}
            icon={<CheckCircle2 size={18} />}
            color="success"
            size="sm"
          />
          <ModernStatsCard
            title="Active"
            value={activeOps}
            icon={<RefreshCw size={18} />}
            color="info"
            size="sm"
          />
          <ModernStatsCard
            title="Failed"
            value={failedOps}
            icon={<AlertTriangle size={18} />}
            color="error"
            size="sm"
          />
        </div>
      )}

      {/* Operations Table */}
      {config?.enabled && (
        <ModernCard variant="outlined" padding="default">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
            Operations History
          </h3>
          <IntegrationOperationsTable
            operations={operationsList}
            loading={loadingOps}
          />
        </ModernCard>
      )}

      {/* Empty state when disabled */}
      {!config?.enabled && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700 sm:py-16">
          <ShieldCheck className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 sm:text-lg">
            Protection Services Disabled
          </h3>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Enable AnyCloudFlow to access backup, replication, migration, and disaster
            recovery services for your resources.
          </p>
          <ModernButton
            variant="primary"
            className="mt-6"
            onClick={() =>
              enableIntegration.mutate({ integrationKey })
            }
            disabled={enableIntegration.isPending}
          >
            <ShieldCheck size={16} className="mr-2" />
            Enable Protection Services
          </ModernButton>
        </div>
      )}
    </div>
  );
};

export default ProtectionOverview;
