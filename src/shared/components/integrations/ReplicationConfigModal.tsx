/**
 * ReplicationConfigModal — Configure and enable replication for a resource.
 *
 * Supports mode selection (active-passive / bidirectional sync),
 * workload profile detection, conflict resolution strategy, and
 * topology configuration.
 *
 * Responsive: full-width on mobile, centered modal on desktop.
 */
import React, { useEffect, useState } from "react";
import { X, RefreshCw, ArrowRightLeft, ArrowLeftRight, Info, MapPin, AlertTriangle, Server, Webhook, HardDrive, Lock } from "lucide-react";
import { ModernButton } from "../ui";
import { useFetchRegions } from "@/shared/hooks/resources/regionHooks";
import { formatRegionName } from "@/utils/regionUtils";
import {
  ReplicationMode,
  WorkloadProfile,
  REPLICATION_MODE_LABELS,
  WORKLOAD_PROFILE_LABELS,
} from "@/types/bidirectional";
import { acfApi } from "../../../adminDashboard/pages/integrations/anycloudflow/api";
import { useReplicationPricing, pickTierCents } from "@/hooks/replicationPricingHooks";
import { formatPerVmMonthPrice } from "@/lib/replicationBillingTier";

interface ReplicationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ReplicationConfig) => void;
  isSubmitting?: boolean;
  resourceName?: string;
  resourceRegion?: string;
  /**
   * Optional source+target AnyCloudFlow endpoint identifiers. When both are
   * provided, the modal probes ZFS capability on each and surfaces a ZFS
   * transport toggle with dataset selection + live cost preview.
   */
  sourceEndpointId?: string;
  targetEndpointId?: string;
}

export interface ReplicationConfig {
  replication_type: string;
  rpo_target_minutes: number;
  topology: string;
  conflict_resolution?: string;
  target_region?: string;
  mode?: string;
  workload_profile?: string;
  webhook_url?: string;
  webhook_events?: string[];
  // New — surfaced when both endpoints support ZFS:
  transfer_method?: "rsync" | "zfs_native" | "zfs_native_raw";
  zfs_source_dataset?: string;
  zfs_target_dataset?: string;
}

const REPLICATION_WEBHOOK_EVENTS = [
  { value: "replication.sync_completed", label: "Sync Completed" },
  { value: "replication.sync_failed", label: "Sync Failed" },
  { value: "replication.rpo_breach", label: "RPO Breach" },
  { value: "replication.failover_completed", label: "Failover Completed" },
  { value: "replication.failback_completed", label: "Failback Completed" },
  { value: "replication.degraded", label: "Degraded" },
  { value: "replication.restored", label: "Restored" },
  { value: "replication.conflict_detected", label: "Conflict Detected" },
  { value: "replication.quorum_lost", label: "Quorum Lost" },
];

const ReplicationConfigModal: React.FC<ReplicationConfigModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  resourceName,
  resourceRegion,
  sourceEndpointId,
  targetEndpointId,
}) => {
  const [replicationType, setReplicationType] = useState("1_to_1");
  const [rpoTarget, setRpoTarget] = useState(15);
  const [topology, setTopology] = useState("active_passive");
  const [conflictResolution, setConflictResolution] = useState("last_write_wins");
  const [targetRegion, setTargetRegion] = useState("");
  const [mode, setMode] = useState<ReplicationMode>(ReplicationMode.ActivePassive);
  const [workloadProfile, setWorkloadProfile] = useState<WorkloadProfile>(WorkloadProfile.StatelessApp);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);

  // ── ZFS transport selection (IG-6) ─────────────────────────────
  // Detected when BOTH endpoints support ZFS. Until then the transport
  // remains implicit rsync and this section stays hidden.
  type TransferChoice = "rsync" | "zfs_native" | "zfs_native_raw";
  const [transferMethod, setTransferMethod] = useState<TransferChoice>("rsync");
  const [srcZfs, setSrcZfs] = useState<{ has_zfs: boolean; datasets?: { name: string; encryption?: boolean }[] } | null>(null);
  const [tgtZfs, setTgtZfs] = useState<{ has_zfs: boolean; datasets?: { name: string; encryption?: boolean }[] } | null>(null);
  const [srcDataset, setSrcDataset] = useState<string>("");
  const [tgtDataset, setTgtDataset] = useState<string>("");
  const [zfsProbing, setZfsProbing] = useState(false);

  useEffect(() => {
    if (!isOpen || !sourceEndpointId || !targetEndpointId) {
      setSrcZfs(null);
      setTgtZfs(null);
      return;
    }
    let cancelled = false;
    setZfsProbing(true);
    Promise.all([
      acfApi.detectZfsOnEndpoint(sourceEndpointId).then((r: unknown) => r?.data ?? r).catch(() => null),
      acfApi.detectZfsOnEndpoint(targetEndpointId).then((r: unknown) => r?.data ?? r).catch(() => null),
    ])
      .then(([src, tgt]) => {
        if (cancelled) return;
        setSrcZfs(src ?? { has_zfs: false });
        setTgtZfs(tgt ?? { has_zfs: false });
      })
      .finally(() => !cancelled && setZfsProbing(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, sourceEndpointId, targetEndpointId]);

  const zfsAvailable = Boolean(srcZfs?.has_zfs && tgtZfs?.has_zfs);
  const selectedDataset = srcZfs?.datasets?.find((d) => d.name === srcDataset);
  const datasetIsEncrypted = Boolean(selectedDataset?.encryption);

  // Auto-upgrade to raw-send when the selected dataset is encrypted so
  // AnyCloudFlow never handles plaintext.
  useEffect(() => {
    if (transferMethod === "zfs_native" && datasetIsEncrypted) {
      setTransferMethod("zfs_native_raw");
    }
  }, [datasetIsEncrypted, transferMethod]);

  const pricingMode = topology === "active_active" ? "bidirectional" : "active_passive";
  const { data: pricingRates } = useReplicationPricing(pricingMode);
  const currentTier =
    transferMethod === "zfs_native_raw" ? "zfs_raw" : transferMethod === "zfs_native" ? "zfs_native" : "rsync";
  const _currentRateCents = pricingRates ? pickTierCents(pricingRates, currentTier) : null;

  const { data: regions = [], isLoading: loadingRegions } = useFetchRegions(
    undefined,
    { enabled: isOpen },
  );

  const availableRegions = regions.filter(
    (r: Record<string, unknown>) =>
      r.is_active && r.code !== resourceRegion,
  );

  if (!isOpen) return null;

  const isBidirectional = mode === ReplicationMode.BidirectionalSync;
  const isDatabaseWorkload = workloadProfile === WorkloadProfile.DatabaseBacked;

  const handleTopologyChange = (value: string) => {
    setTopology(value);
    if (value === "active_active") {
      setMode(ReplicationMode.BidirectionalSync);
    } else {
      setMode(ReplicationMode.ActivePassive);
    }
  };

  const handleSubmit = () => {
    const config: ReplicationConfig = {
      replication_type: replicationType,
      rpo_target_minutes: rpoTarget,
      topology,
      mode,
    };

    if (isBidirectional) {
      config.conflict_resolution = conflictResolution;
      config.workload_profile = workloadProfile;
    }

    if (targetRegion) {
      config.target_region = targetRegion;
    }

    if (webhookUrl) {
      config.webhook_url = webhookUrl;
    }
    if (webhookEvents.length > 0) {
      config.webhook_events = webhookEvents;
    }

    // Only emit ZFS fields when ZFS was actually selected — prevents
    // backend from mis-routing an rsync intent through the ZFS code path.
    if (zfsAvailable && transferMethod !== "rsync") {
      config.transfer_method = transferMethod;
      if (srcDataset) config.zfs_source_dataset = srcDataset;
      if (tgtDataset) config.zfs_target_dataset = tgtDataset;
    }

    onSubmit(config);
  };

  const canSubmit = targetRegion !== "" && !(isBidirectional && isDatabaseWorkload);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-gray-900/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30">
              <RefreshCw size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Enable Replication
              </h3>
              {resourceName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{resourceName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5 sm:p-6">
          {/* Topology / Mode */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Replication Mode
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  value: "active_passive",
                  label: REPLICATION_MODE_LABELS[ReplicationMode.ActivePassive],
                  desc: "One-way replication with manual failover",
                  icon: <ArrowRightLeft size={16} />,
                },
                {
                  value: "active_active",
                  label: REPLICATION_MODE_LABELS[ReplicationMode.BidirectionalSync],
                  desc: "Two-way sync with quorum consensus",
                  icon: <ArrowLeftRight size={16} />,
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTopologyChange(opt.value)}
                  className={`rounded-lg border px-3 py-3 text-left transition-all ${
                    topology === opt.value
                      ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500 dark:border-purple-400 dark:bg-purple-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        topology === opt.value
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-400"
                      }
                    >
                      {opt.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {opt.label}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Workload Profile — only for bidirectional */}
          {isBidirectional && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Server size={14} />
                  Workload Profile
                </div>
              </label>
              <select
                value={workloadProfile}
                onChange={(e) => setWorkloadProfile(e.target.value as WorkloadProfile)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {Object.values(WorkloadProfile).map((wp) => (
                  <option key={wp} value={wp}>{WORKLOAD_PROFILE_LABELS[wp]}</option>
                ))}
              </select>
              {isDatabaseWorkload && (
                <div className="mt-2 flex gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/20">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Database-backed workloads are not supported for bidirectional sync.
                    AnyCloudFlow blocks this to prevent data corruption. Use active-passive
                    with database-native replication instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Target Region */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                Target Region
              </div>
            </label>
            <select
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              disabled={loadingRegions}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">
                {loadingRegions ? "Loading regions..." : "Select a target region"}
              </option>
              {availableRegions.map((region: Record<string, unknown>) => (
                <option key={String(region.code)} value={String(region.code)}>
                  {formatRegionName(String(region.name ?? region.code))} ({String(region.code)})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              The region where the DR replica will be provisioned.
            </p>
          </div>

          {/* Replication Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Replication Type
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  value: "1_to_1",
                  label: "1:1 Replication",
                  desc: "Single source to single target",
                  price: "$20/mo per VM",
                },
                {
                  value: "1_to_n",
                  label: "1:N Replication",
                  desc: "Single source to multiple targets",
                  price: "$100/mo per VM",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReplicationType(opt.value)}
                  className={`rounded-lg border px-3 py-3 text-left transition-all ${
                    replicationType === opt.value
                      ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500 dark:border-purple-400 dark:bg-purple-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {opt.desc}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-purple-600 dark:text-purple-400">
                    {opt.price}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RPO Target */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              RPO Target (Recovery Point Objective)
            </label>
            <select
              value={rpoTarget}
              onChange={(e) => setRpoTarget(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value={5}>5 minutes (Near-real-time)</option>
              <option value={15}>15 minutes (Recommended)</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Maximum acceptable data loss window in the event of a disaster.
            </p>
          </div>

          {/* Webhook Notifications */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Webhook size={14} />
                Webhook Notifications
              </div>
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/replication"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="mt-3">
              <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Subscribe to events
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REPLICATION_WEBHOOK_EVENTS.map((evt) => {
                  const selected = webhookEvents.includes(evt.value);
                  return (
                    <button
                      key={evt.value}
                      type="button"
                      onClick={() =>
                        setWebhookEvents((prev) =>
                          selected
                            ? prev.filter((e) => e !== evt.value)
                            : [...prev, evt.value],
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        selected
                          ? "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500 dark:border-purple-400 dark:bg-purple-900/20 dark:text-purple-300"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                      }`}
                    >
                      {evt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Optional. Get per-policy webhook notifications for replication events.
            </p>
          </div>

          {/* Conflict Resolution — only for bidirectional */}
          {isBidirectional && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Conflict Resolution Strategy
              </label>
              <select
                value={conflictResolution}
                onChange={(e) => setConflictResolution(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="last_write_wins">Last Write Wins (Recommended)</option>
                <option value="node_a_priority">Node A Priority</option>
                <option value="node_b_priority">Node B Priority</option>
                <option value="manual">Manual Resolution</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                How conflicts are resolved when both sides write simultaneously.
              </p>
            </div>
          )}

          {/* ── Transport / ZFS (IG-6) ────────────────────────── */}
          {sourceEndpointId && targetEndpointId && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transport
              </label>
              {zfsProbing ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <RefreshCw size={12} className="animate-spin" />
                  Detecting ZFS capability on source + target…
                </div>
              ) : zfsAvailable ? (
                <>
                  <div className="mb-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                    <div className="flex items-center gap-2 font-medium">
                      <HardDrive size={12} />
                      ZFS Native Replication Available
                    </div>
                    <p className="mt-0.5">
                      Both endpoints run ZFS. Native send/receive is typically 10-100× faster than rsync on large datasets and preserves compression, ACLs, and snapshot history atomically.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(
                      [
                        {
                          value: "rsync",
                          label: "Rsync (file-level)",
                          tier: "rsync" as const,
                          disabled: false,
                        },
                        {
                          value: "zfs_native",
                          label: "ZFS Native",
                          tier: "zfs_native" as const,
                          disabled: datasetIsEncrypted,
                          note: datasetIsEncrypted ? "Encrypted dataset — use encrypted transport below." : undefined,
                        },
                        {
                          value: "zfs_native_raw",
                          label: "ZFS Native (encrypted raw send)",
                          tier: "zfs_raw" as const,
                          disabled: false,
                          note: "AnyCloudFlow never decrypts — recommended for encrypted pools.",
                        },
                      ] as const
                    ).map((opt) => {
                      const cents = pricingRates ? pickTierCents(pricingRates, opt.tier) : null;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                            transferMethod === opt.value
                              ? "border-purple-500 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          } ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <input
                            type="radio"
                            name="zfs-transport"
                            value={opt.value}
                            checked={transferMethod === opt.value}
                            disabled={opt.disabled}
                            onChange={() => !opt.disabled && setTransferMethod(opt.value as TransferChoice)}
                            className="mt-0.5 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {opt.label}
                              </span>
                              {opt.value === "zfs_native_raw" && (
                                <Lock size={10} className="text-purple-600 dark:text-purple-400" />
                              )}
                              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                                {cents !== null ? formatPerVmMonthPrice(cents) : "—"}
                              </span>
                            </div>
                            {opt.note && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{opt.note}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {transferMethod !== "rsync" && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Source dataset
                        </label>
                        <select
                          value={srcDataset}
                          onChange={(e) => setSrcDataset(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— choose dataset —</option>
                          {srcZfs?.datasets?.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                              {d.encryption ? " 🔒" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Target dataset
                        </label>
                        <select
                          value={tgtDataset}
                          onChange={(e) => setTgtDataset(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— choose dataset —</option>
                          {tgtZfs?.datasets?.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                (srcZfs || tgtZfs) && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    Using rsync (file-level). ZFS native replication requires ZFS on both endpoints.
                    {" "}
                    {!srcZfs?.has_zfs && "Source does not have ZFS."}
                    {!tgtZfs?.has_zfs && " Target does not have ZFS."}
                  </div>
                )
              )}
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg bg-purple-50 px-4 py-3 dark:bg-purple-900/20">
            <div className="flex gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {isBidirectional
                  ? "Bidirectional sync enables two-way replication with quorum-based consensus, automatic fencing on quorum loss, and traffic pool management. A witness node is recommended for production use."
                  : "Replication target is automatically resolved to the paired DR region. Failover is included at no extra cost with an active replication subscription."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <ModernButton variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </ModernButton>
          <ModernButton variant="primary" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? "Enabling..." : "Enable Replication"}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default ReplicationConfigModal;
