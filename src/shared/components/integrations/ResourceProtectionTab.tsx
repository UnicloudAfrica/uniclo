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
  Settings,
} from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import IntegrationOperationsTable from "./IntegrationOperationsTable";
// BackupConfigWizard replaces BackupConfigModal per RES-162 (4 fields
// + destination dependency = wizard, not modal). It renders inline
// inside the protection tab so the user stays in their resource
// context — no separate page navigation required to keep the rule.
import BackupConfigWizard, { type BackupConfig } from "./BackupConfigWizard";
import ReplicationConfigModal from "./ReplicationConfigModal";
import BackupSnapshotsList from "./BackupSnapshotsList";
import RestoreSnapshotModal from "./RestoreSnapshotModal";
import PitrPanel from "./PitrPanel";
import { PaymentModal } from "../ui";
import {
  useBackupStatus,
  useReplicationStatus,
  useEnableBackup,
  useDisableBackup,
  useUpdateBackup,
  useSetBackupPolicyState,
  useTriggerBackup,
  useEnableReplication,
  useDisableReplication,
  useFailover,
  useFetchIntegrationOperations,
  useRansomwareScans,
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
  const [backupWizardMode, setBackupWizardMode] = useState<"create" | "edit">("create");
  const [showReplicationModal, setShowReplicationModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Record<string, unknown> | null>(null);
  const [showDrPayment, setShowDrPayment] = useState(false);
  const [drPaymentData, setDrPaymentData] = useState<Record<string, unknown> | null>(null);

  // Data hooks
  const { data: backupStatus, isLoading: loadingBackup } = useBackupStatus(
    integrationKey,
    resourceType,
    resourceId
  );
  const { data: replicationStatus, isLoading: loadingReplication } = useReplicationStatus(
    integrationKey,
    resourceType,
    resourceId
  );
  const { data: operations, isLoading: loadingOps } = useFetchIntegrationOperations();

  // Mutation hooks
  const enableBackup = useEnableBackup();
  const disableBackup = useDisableBackup();
  const updateBackup = useUpdateBackup();
  const setBackupPolicyState = useSetBackupPolicyState();
  const triggerBackup = useTriggerBackup();
  const enableReplication = useEnableReplication();
  const disableReplication = useDisableReplication();
  const failover = useFailover();

  const openBackupWizard = (mode: "create" | "edit") => {
    setBackupWizardMode(mode);
    setShowBackupModal(true);
  };

  const handleSaveBackup = (config: BackupConfig) => {
    const mutation = backupWizardMode === "edit" ? updateBackup : enableBackup;
    const payload: Record<string, unknown> = { ...config };

    mutation.mutate(
      { integrationKey, resourceType, resourceId, config: payload },
      { onSuccess: () => setShowBackupModal(false) }
    );
  };

  const handleEnableReplication = (
    config: Record<string, unknown> | import("./ReplicationConfigModal").ReplicationConfig
  ) => {
    enableReplication.mutate(
      { integrationKey, resourceType, resourceId, config: config as Record<string, unknown> },
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
      }
    );
  };

  const resourceOps = (operations ?? []).filter(
    (op) => op.resource_type === resourceType && String(op.resource_id) === String(resourceId)
  );
  const backupPolicy = (backupStatus?.policy ?? {}) as Record<string, unknown>;
  const backupPolicyStatus = String(backupStatus?.status ?? backupPolicy.status ?? "disabled");
  const backupPaused = backupPolicyStatus === "paused";
  const backupActive =
    Boolean(backupStatus?.enabled) && !["cancelled", "disabled"].includes(backupPolicyStatus);
  const backupLastError = backupStatus?.last_error;
  // RES-164: surface per-resource ransomware risk. The org-wide
  // dashboard already lives at /ransomware; here we just want a
  // glanceable indicator on the resource detail page so an operator
  // who's already on a VM page sees "this VM's backups are flagged"
  // without context-switching. We scope by policy_id when we have one
  // (the resource's AcF policy), which mirrors how AcF scans are
  // tagged. Skip the fetch entirely when there's no policy — no
  // backups = nothing to scan.
  const externalPolicyId = (backupStatus?.subscription as unknown as
    | Record<string, unknown>
    | undefined)?.external_service_id as string | undefined;
  const { data: resourceScansResponse } = useRansomwareScans(
    integrationKey,
    externalPolicyId ? { policy_id: externalPolicyId, per_page: 5 } : undefined,
    { enabled: Boolean(externalPolicyId && backupActive) },
  );
  const resourceScans = resourceScansResponse?.data ?? [];
  const highestThreat = resourceScans.reduce<"none" | "low" | "medium" | "high" | "critical">(
    (acc, scan) => {
      const rank = { none: 0, low: 1, medium: 2, high: 3, critical: 4 } as const;
      return rank[scan.threat_level] > rank[acc] ? scan.threat_level : acc;
    },
    "none",
  );
  const hasRansomwareRisk = highestThreat !== "none";
  const lastBackupCompletedAt =
    typeof backupStatus?.last_backup?.completed_at === "string"
      ? backupStatus.last_backup.completed_at
      : undefined;
  const nextBackupAt =
    typeof backupStatus?.next_backup_at === "string" ? backupStatus.next_backup_at : undefined;
  const destinationCount =
    backupStatus?.destinations?.length ??
    (typeof backupPolicy.destinations_count === "number" ? backupPolicy.destinations_count : 0);
  const backupInitialConfig: Partial<BackupConfig> = {
    name: (backupPolicy.name as string | undefined) ?? resourceName,
    schedule_type: (backupPolicy.schedule as string | undefined) ?? "daily",
    backup_type: (backupPolicy.backup_type as string | undefined) ?? "full",
    retention_days: Number(backupPolicy.retention_days ?? backupPolicy.retention_daily ?? 30),
    immutable_days: Number(backupPolicy.immutable_days ?? 0),
    destination_ids: (backupStatus?.destinations ?? []).map((destination) => destination.id),
    include_paths: Array.isArray(backupPolicy.include_paths)
      ? (backupPolicy.include_paths as string[])
      : [],
    exclude_paths: Array.isArray(backupPolicy.exclude_paths)
      ? (backupPolicy.exclude_paths as string[])
      : [],
    include_databases: Boolean(backupPolicy.include_databases),
    compression: backupPolicy.compression !== "none",
    encryption: backupPolicy.encryption_enabled !== false,
  };

  const isLoading = loadingBackup || loadingReplication;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
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
                    backupStatus?.enabled ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                  }
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Backup Protection
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {backupActive
                    ? backupPaused
                      ? "Backup policy is paused"
                      : "Automated backups are active"
                    : "No backup policy configured"}
                </p>
              </div>
            </div>

            {backupActive ? (
              <IntegrationStatusBadge status={backupPaused ? "paused" : "active"} />
            ) : (
              <IntegrationStatusBadge status="disabled" />
            )}
          </div>

          {hasRansomwareRisk && (
            <div
              role="alert"
              className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                highestThreat === "critical" || highestThreat === "high"
                  ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200"
              }`}
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                <strong>
                  {highestThreat === "critical"
                    ? "Drop everything: "
                    : highestThreat === "high"
                      ? "Act fast: "
                      : highestThreat === "medium"
                        ? "Needs attention: "
                        : "Worth a look: "}
                </strong>
                {resourceScans.length === 1
                  ? "A recent ransomware scan flagged this resource."
                  : `${resourceScans.length} recent ransomware scans flagged this resource.`}{" "}
                Open the ransomware dashboard to review and recover.
              </span>
            </div>
          )}

          {backupActive && backupStatus?.subscription && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Backup</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {lastBackupCompletedAt
                    ? new Date(lastBackupCompletedAt).toLocaleDateString()
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
                  {nextBackupAt ? new Date(nextBackupAt).toLocaleDateString() : "Scheduled"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Schedule</p>
                <p className="mt-0.5 text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                  {String(
                    backupPolicy.schedule ?? backupStatus.subscription.service_subtype ?? "daily"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="mt-0.5 text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                  {String(backupPolicy.backup_type ?? "full")}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Destinations</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {destinationCount}
                </p>
              </div>
            </div>
          )}

          {backupLastError?.message && (
            <div
              role="alert"
              className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Latest backup issue</p>
                <p className="text-xs">{backupLastError.message}</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {backupActive ? (
              <>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => triggerBackup.mutate({ integrationKey, resourceType, resourceId })}
                  disabled={triggerBackup.isPending || backupPaused}
                >
                  <Play size={14} className="mr-1" />
                  {triggerBackup.isPending ? "Running..." : "Backup Now"}
                </ModernButton>
                <ModernButton variant="outline" size="sm" onClick={() => openBackupWizard("edit")}>
                  <Settings size={14} className="mr-1" />
                  Edit Policy
                </ModernButton>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setBackupPolicyState.mutate({
                      integrationKey,
                      resourceType,
                      resourceId,
                      action: backupPaused ? "resume" : "pause",
                    })
                  }
                  disabled={setBackupPolicyState.isPending}
                >
                  {backupPaused ? (
                    <Play size={14} className="mr-1" />
                  ) : (
                    <Pause size={14} className="mr-1" />
                  )}
                  {backupPaused ? "Resume" : "Pause"}
                </ModernButton>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => disableBackup.mutate({ integrationKey, resourceType, resourceId })}
                  disabled={disableBackup.isPending}
                >
                  <ShieldOff size={14} className="mr-1" />
                  Disable
                </ModernButton>
              </>
            ) : (
              <ModernButton variant="primary" size="sm" onClick={() => openBackupWizard("create")}>
                <ShieldCheck size={14} className="mr-1" />
                Enable Backup
              </ModernButton>
            )}
          </div>

          {/* Backup Snapshots */}
          {backupActive && (
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
              <PitrPanel
                pairId={String(resourceId)}
                resourceType={resourceType}
                integrationKey={integrationKey}
                className="mt-4"
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
              <IntegrationStatusBadge status={replicationStatus?.enabled ? "active" : "disabled"} />
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
                      Active side:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {replicationStatus.active_side === "both"
                          ? "Both"
                          : replicationStatus.active_side.toUpperCase()}
                      </span>
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
                      c.toUpperCase()
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
                  onClick={() => failover.mutate({ integrationKey, resourceType, resourceId })}
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

      {/* Backup setup: renders inline as a wizard panel rather than a
          modal overlay — fields/dependent validation per RES-162. The
          wizard's own internal SuccessMoment closes on success. */}
      {showBackupModal && (
        <ModernCard>
          <BackupConfigWizard
            resourceName={resourceName}
            resourceRegion={resourceRegion}
            integrationKey={integrationKey}
            isSubmitting={
              backupWizardMode === "edit" ? updateBackup.isPending : enableBackup.isPending
            }
            initialConfig={backupWizardMode === "edit" ? backupInitialConfig : undefined}
            mode={backupWizardMode}
            onSubmit={handleSaveBackup}
            onCancel={() => setShowBackupModal(false)}
          />
        </ModernCard>
      )}

      {/* Modals */}
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
