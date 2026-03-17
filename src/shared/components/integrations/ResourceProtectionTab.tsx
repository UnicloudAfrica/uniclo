/**
 * ResourceProtectionTab — Shared protection status tab for Instance/Database detail pages.
 *
 * Shows backup status card, replication health card, and recent operations.
 * Fully responsive: stacks vertically on mobile, 2-column grid on tablet+.
 */
import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  HardDrive,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRightLeft,
} from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import IntegrationOperationsTable from "./IntegrationOperationsTable";
import BackupConfigModal from "./BackupConfigModal";
import ReplicationConfigModal from "./ReplicationConfigModal";
import BackupSnapshotsList from "./BackupSnapshotsList";
import RestoreSnapshotModal from "./RestoreSnapshotModal";
import { PaymentModal } from "../ui";
import {
  useBackupStatus,
  useReplicationStatus,
  useEnableBackup,
  useDisableBackup,
  useTriggerBackup,
  useEnableReplication,
  useDisableReplication,
  useFailover,
  useFetchIntegrationOperations,
} from "@/shared/hooks/resources/integrationHooks";

interface ResourceProtectionTabProps {
  resourceType: string;
  resourceId: string | number;
  resourceName?: string;
  resourceRegion?: string;
  integrationKey?: string;
}

const HEALTH_ICONS: Record<string, React.ReactNode> = {
  healthy: <CheckCircle2 size={16} className="text-green-500" />,
  degraded: <AlertTriangle size={16} className="text-amber-500" />,
  critical: <AlertTriangle size={16} className="text-red-500" />,
  unknown: <Clock size={16} className="text-gray-400" />,
};

const ResourceProtectionTab: React.FC<ResourceProtectionTabProps> = ({
  resourceType,
  resourceId,
  resourceName,
  resourceRegion,
  integrationKey = "anycloudflow",
}) => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showReplicationModal, setShowReplicationModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Record<string, unknown> | null>(null);
  const [showDrPayment, setShowDrPayment] = useState(false);
  const [drPaymentData, setDrPaymentData] = useState<Record<string, unknown> | null>(null);

  // Data hooks
  const { data: backupStatus, isLoading: loadingBackup } = useBackupStatus(
    integrationKey,
    resourceType,
    resourceId,
  );
  const { data: replicationStatus, isLoading: loadingReplication } = useReplicationStatus(
    integrationKey,
    resourceType,
    resourceId,
  );
  const { data: operations, isLoading: loadingOps } = useFetchIntegrationOperations();

  // Mutation hooks
  const enableBackup = useEnableBackup();
  const disableBackup = useDisableBackup();
  const triggerBackup = useTriggerBackup();
  const enableReplication = useEnableReplication();
  const disableReplication = useDisableReplication();
  const failover = useFailover();

  const handleEnableBackup = (config: Record<string, unknown>) => {
    enableBackup.mutate(
      { integrationKey, resourceType, resourceId, config },
      { onSuccess: () => setShowBackupModal(false) },
    );
  };

  const handleEnableReplication = (config: Record<string, unknown>) => {
    enableReplication.mutate(
      { integrationKey, resourceType, resourceId, config },
      {
        onSuccess: (data: Record<string, unknown> | undefined) => {
          const payment = data?.payment as Record<string, unknown> | undefined;
          if (payment?.required) {
            setDrPaymentData(payment);
            setShowReplicationModal(false);
            setShowDrPayment(true);
          } else {
            setShowReplicationModal(false);
          }
        },
      },
    );
  };

  const resourceOps = (operations ?? []).filter(
    (op) =>
      op.resource_type === resourceType &&
      String(op.resource_id) === String(resourceId),
  );

  const isLoading = loadingBackup || loadingReplication;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Backup Status Card */}
        <ModernCard variant="outlined" padding="default">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  backupStatus?.enabled
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <HardDrive
                  size={20}
                  className={
                    backupStatus?.enabled
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400"
                  }
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Backup Protection
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {backupStatus?.enabled
                    ? "Automated backups are active"
                    : "No backup policy configured"}
                </p>
              </div>
            </div>

            {backupStatus?.enabled ? (
              <IntegrationStatusBadge status="active" />
            ) : (
              <IntegrationStatusBadge status="disabled" />
            )}
          </div>

          {backupStatus?.enabled && backupStatus.subscription && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Backup</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {backupStatus.last_backup?.completed_at
                    ? new Date(backupStatus.last_backup.completed_at).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Snapshots</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {backupStatus.snapshots_count ?? 0}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Next Backup</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {backupStatus.next_backup_at
                    ? new Date(backupStatus.next_backup_at).toLocaleDateString()
                    : "Scheduled"}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {backupStatus?.enabled ? (
              <>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    triggerBackup.mutate({ integrationKey, resourceType, resourceId })
                  }
                  disabled={triggerBackup.isPending}
                >
                  <Play size={14} className="mr-1" />
                  {triggerBackup.isPending ? "Running..." : "Backup Now"}
                </ModernButton>
                {(backupStatus.snapshots_count ?? 0) > 0 && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSnapshot(null);
                      setShowRestoreModal(true);
                    }}
                  >
                    <RotateCcw size={14} className="mr-1" />
                    Restore
                  </ModernButton>
                )}
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    disableBackup.mutate({ integrationKey, resourceType, resourceId })
                  }
                  disabled={disableBackup.isPending}
                >
                  <Pause size={14} className="mr-1" />
                  Disable
                </ModernButton>
              </>
            ) : (
              <ModernButton
                variant="primary"
                size="sm"
                onClick={() => setShowBackupModal(true)}
              >
                <ShieldCheck size={14} className="mr-1" />
                Enable Backup
              </ModernButton>
            )}
          </div>

          {/* Backup Snapshots */}
          {backupStatus?.enabled && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <BackupSnapshotsList
                integrationKey={integrationKey}
                resourceType={resourceType}
                resourceId={resourceId}
                onRestore={(snapshot) => {
                  setSelectedSnapshot(snapshot);
                  setShowRestoreModal(true);
                }}
              />
            </div>
          )}
        </ModernCard>

        {/* Replication Status Card */}
        <ModernCard variant="outlined" padding="default">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  replicationStatus?.enabled
                    ? "bg-purple-50 dark:bg-purple-900/30"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <RefreshCw
                  size={20}
                  className={
                    replicationStatus?.enabled
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-400"
                  }
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Replication &amp; DR
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {replicationStatus?.enabled
                    ? "Continuous replication is active"
                    : "No replication configured"}
                </p>
              </div>
            </div>

            {replicationStatus?.enabled && replicationStatus.health ? (
              <div className="flex items-center gap-1.5">
                {HEALTH_ICONS[replicationStatus.health] ?? HEALTH_ICONS.unknown}
                <IntegrationStatusBadge status={replicationStatus.health} />
              </div>
            ) : (
              <IntegrationStatusBadge
                status={replicationStatus?.enabled ? "active" : "disabled"}
              />
            )}
          </div>

          {replicationStatus?.enabled && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              {/* Topology badge */}
              {replicationStatus.topology === "active_active" && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <ArrowRightLeft size={12} />
                    Active-Active
                  </span>
                  {replicationStatus.active_side && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Active side: <span className="font-medium text-gray-700 dark:text-gray-300">{replicationStatus.active_side === "both" ? "Both" : replicationStatus.active_side.toUpperCase()}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {replicationStatus.topology === "active_active" ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Lag A → B</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {replicationStatus.lag_a_to_b !== undefined
                          ? `${replicationStatus.lag_a_to_b}s`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Lag B → A</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {replicationStatus.lag_b_to_a !== undefined
                          ? `${replicationStatus.lag_b_to_a}s`
                          : "—"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Replication Lag</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {replicationStatus.lag_seconds !== undefined
                        ? `${replicationStatus.lag_seconds}s`
                        : "—"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Health</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {(replicationStatus.health ?? "unknown").replace(/^\w/, (c: string) =>
                      c.toUpperCase(),
                    )}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Target Region</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {replicationStatus.target_region ?? "Auto-resolved"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {replicationStatus?.enabled ? (
              <>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    failover.mutate({ integrationKey, resourceType, resourceId })
                  }
                  disabled={failover.isPending}
                >
                  <Zap size={14} className="mr-1" />
                  {failover.isPending ? "Processing..." : "Failover"}
                </ModernButton>
                {replicationStatus.topology === "active_active" && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      failover.mutate({
                        integrationKey,
                        resourceType,
                        resourceId,
                        config: { direction: "failback" },
                      })
                    }
                    disabled={failover.isPending}
                  >
                    <RotateCcw size={14} className="mr-1" />
                    Failback
                  </ModernButton>
                )}
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    disableReplication.mutate({
                      integrationKey,
                      resourceType,
                      resourceId,
                    })
                  }
                  disabled={disableReplication.isPending}
                >
                  <ShieldOff size={14} className="mr-1" />
                  Disable
                </ModernButton>
              </>
            ) : (
              <ModernButton
                variant="primary"
                size="sm"
                onClick={() => setShowReplicationModal(true)}
              >
                <ArrowRightLeft size={14} className="mr-1" />
                Enable Replication
              </ModernButton>
            )}
          </div>
        </ModernCard>
      </div>

      {/* Recent Operations */}
      <ModernCard variant="outlined" padding="default">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Recent Operations
        </h3>
        <IntegrationOperationsTable
          operations={resourceOps.slice(0, 5)}
          loading={loadingOps}
          compact
        />
      </ModernCard>

      {/* Modals */}
      <BackupConfigModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onSubmit={handleEnableBackup}
        isSubmitting={enableBackup.isPending}
        resourceName={resourceName}
        integrationKey={integrationKey}
        resourceRegion={resourceRegion}
      />
      <ReplicationConfigModal
        isOpen={showReplicationModal}
        onClose={() => setShowReplicationModal(false)}
        onSubmit={handleEnableReplication}
        isSubmitting={enableReplication.isPending}
        resourceName={resourceName}
        resourceRegion={resourceRegion}
      />
      <RestoreSnapshotModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedSnapshot(null);
        }}
        snapshot={selectedSnapshot}
        resourceName={resourceName}
        integrationKey={integrationKey}
      />

      {/* DR Replica Payment Modal — shown for direct-pay tenants */}
      {showDrPayment && drPaymentData && (
        <PaymentModal
          isOpen={showDrPayment}
          onClose={() => {
            setShowDrPayment(false);
            setDrPaymentData(null);
          }}
          transactionData={drPaymentData.transaction_data as Record<string, unknown> | undefined}
          paymentOptions={
            Array.isArray(drPaymentData.payment_gateway_options)
              ? drPaymentData.payment_gateway_options
              : undefined
          }
          onPaymentComplete={() => {
            setShowDrPayment(false);
            setDrPaymentData(null);
          }}
        />
      )}
    </div>
  );
};

export default ResourceProtectionTab;
