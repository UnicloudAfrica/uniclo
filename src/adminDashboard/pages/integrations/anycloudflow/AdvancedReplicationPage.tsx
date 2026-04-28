import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernCard, ModernSelect } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";
import AcfSyncProgressCard from "./realtime/AcfSyncProgressCard";
import AcfFailoverStageIndicator from "./realtime/AcfFailoverStageIndicator";
import AcfRealtimeStatus from "./realtime/AcfRealtimeStatus";
import {
  deriveBillingTier,
  billingTierChip,
  formatPerVmMonthPrice,
} from "@/lib/replicationBillingTier";
import {
  useReplicationPricing,
  pickTierCents,
} from "@/hooks/replicationPricingHooks";

type Tab = "consistency" | "hypervisor" | "capture" | "pitr" | "block";

/**
 * Renders a compact pool-health badge. Only displayed when the replication
 * is using a ZFS-native transfer method and capabilities are returned.
 */
function ZfsHealthBadge({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["acf-zfs-pool-status-badge", id],
    queryFn: () => acfApi.getZfsPoolStatus(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unwrap = (res: unknown) => {
    if (!res || typeof res !== "object") return undefined;
    const inner = (res as { data?: unknown }).data;
    if (inner && typeof inner === "object" && "data" in (inner as Record<string, unknown>)) {
      return (inner as { data: unknown }).data;
    }
    return inner ?? res;
  };
  const status = unwrap(data) as
    | { source?: { state?: string; scrubbing?: boolean; resilvering?: boolean }; target?: { state?: string; scrubbing?: boolean; resilvering?: boolean } }
    | undefined;
  if (!status || (!status.source && !status.target)) return null;

  const worstState = (() => {
    const states = [status.source, status.target]
      .filter(Boolean)
      .map((p) => {
        if (p!.resilvering) return "RESILVERING";
        if (p!.scrubbing) return "SCRUBBING";
        return (p!.state ?? "").toUpperCase();
      });
    const rank: Record<string, number> = {
      FAULTED: 5, UNAVAIL: 5, OFFLINE: 5, REMOVED: 5,
      DEGRADED: 4, RESILVERING: 3, SCRUBBING: 2, ONLINE: 1,
    };
    return states.reduce<{ s: string; r: number }>(
      (acc, s) => (rank[s] ?? 0) > acc.r ? { s, r: rank[s] ?? 0 } : acc,
      { s: "UNKNOWN", r: 0 }
    ).s;
  })();

  const tone =
    worstState === "ONLINE"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : worstState === "DEGRADED"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : worstState === "SCRUBBING" || worstState === "RESILVERING"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : ["FAULTED", "UNAVAIL", "OFFLINE", "REMOVED"].includes(worstState)
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      ZFS · {worstState}
    </span>
  );
}

/**
 * BillingTierBadge — small chip showing the tier a replication is billed at.
 *
 * Renders nothing for the rsync tier (that's the baseline; no badge = no
 * notification spam on the vast majority of pairs). Only ZFS variants get
 * a visible chip so admins can spot tier-misconfigured pairs during
 * payout review. The tooltip shows the current per-VM/month rate from
 * the pricing endpoint so "is this the right tier?" is answerable at a
 * glance without leaving the page.
 */
function BillingTierBadge({
  transferMethod,
  mode = "active_passive",
}: {
  transferMethod?: string | null;
  mode?: "active_passive" | "bidirectional";
}) {
  const tier = deriveBillingTier(transferMethod);
  const chip = billingTierChip(tier);
  const { data: pricing } = useReplicationPricing(mode, { enabled: !!chip });

  if (!chip) return null;

  const cents = pickTierCents(pricing, tier);
  const priceStr =
    cents !== undefined
      ? formatPerVmMonthPrice(cents, pricing?.currency ?? "NGN")
      : undefined;

  const title = priceStr
    ? `${chip.title} Current rate: ${priceStr}.`
    : chip.title;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip.tone}`}
      title={title}
    >
      {chip.label}
      {priceStr ? <span className="ml-1 opacity-80">· {priceStr}</span> : null}
    </span>
  );
}

export default function AdvancedReplicationPage() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("consistency");

  const consistencyCaps = useQuery({
    queryKey: ["acf-consistency-caps", id],
    queryFn: () => acfApi.getConsistencyCaps(id),
    enabled: tab === "consistency" && !!id,
  });
  const hypervisorInfo = useQuery({
    queryKey: ["acf-hypervisor-info", id],
    queryFn: () => acfApi.getHypervisorInfo(id),
    enabled: tab === "hypervisor" && !!id,
  });
  const pitrRange = useQuery({
    queryKey: ["acf-pitr-range", id],
    queryFn: () => acfApi.getPitrRange(id),
    enabled: tab === "pitr" && !!id,
  });
  const blockCaps = useQuery({
    queryKey: ["acf-block-caps", id],
    queryFn: () => acfApi.getBlockCaps(id),
    enabled: tab === "block" && !!id,
  });
  // Always-on: detect whether this replication uses a ZFS transfer method
  // so we can surface the ZFS link + badge in the header.
  const zfsCaps = useQuery({
    queryKey: ["acf-zfs-caps-header", id],
    queryFn: () => acfApi.getZfsCapabilities(id),
    enabled: !!id,
    staleTime: 60_000,
    retry: 0, // 404 when not a ZFS replication — don't thrash
  });
  const isZfsReplication = (() => {
    const data = zfsCaps.data as { data?: { data?: unknown } | unknown } | undefined;
    if (!data) return false;
    const inner: unknown = (data as { data?: unknown }).data;
    if (!inner) return false;
    const payload =
      inner && typeof inner === "object" && "data" in (inner as Record<string, unknown>)
        ? (inner as { data: unknown }).data
        : inner;
    return !!payload;
  })();

  // Extract the negotiated transfer method so the billing-tier chip can
  // render without the admin guessing. zfsCaps returns raw_send_supported
  // + encryption_enabled flags; when both are true the upstream defaults
  // to zfs_native_raw, otherwise zfs_native. If we can't tell, we fall
  // back to the chip's own derivation.
  const zfsTransferMethod: string | undefined = (() => {
    if (!isZfsReplication) return undefined;
    const data = zfsCaps.data as { data?: unknown } | undefined;
    const inner = data?.data as { data?: unknown } | undefined;
    const payload = (inner && typeof inner === "object" && "data" in (inner as Record<string, unknown>)
      ? (inner as { data: unknown }).data
      : inner) as
      | {
          transfer_method?: string;
          raw_send_supported?: boolean;
          encryption_enabled?: boolean;
        }
      | undefined;
    if (!payload) return undefined;
    if (typeof payload.transfer_method === "string") return payload.transfer_method;
    if (payload.raw_send_supported && payload.encryption_enabled) return "zfs_native_raw";
    return "zfs_native";
  })();

  const [consistencyLevel, setConsistencyLevel] = useState("none");
  const setLevel = useMutation({
    mutationFn: () => acfApi.setConsistencyLevel(id, consistencyLevel),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["acf-consistency-caps", id] }); ToastUtils.success("Consistency level updated"); },
  });

  const startCapture = useMutation({
    mutationFn: () => acfApi.startContinuousCapture(id),
    onSuccess: () => ToastUtils.success("Continuous capture started"),
  });
  const stopCapture = useMutation({
    mutationFn: () => acfApi.stopContinuousCapture(id),
    onSuccess: () => ToastUtils.success("Continuous capture stopped"),
  });

  const [pitrTimestamp, setPitrTimestamp] = useState("");
  const recoverPitr = useMutation({
    mutationFn: () => acfApi.pitrRecover(id, pitrTimestamp),
    onSuccess: () => ToastUtils.success("PITR recovery initiated"),
  });

  const [transferMethod, setTransferMethod] = useState("rsync");
  const setMethod = useMutation({
    mutationFn: () => acfApi.setTransferMethod(id, transferMethod),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["acf-block-caps", id] }); ToastUtils.success("Transfer method updated"); },
  });

  const tabs: Array<[Tab, string]> = [
    ["consistency", "Consistency"],
    ["hypervisor", "Hypervisor"],
    ["capture", "Continuous Capture"],
    ["pitr", "Point-in-Time Recovery"],
    ["block", "Block-Level"],
  ];

  // Pull lightweight replication metadata so we can decide whether to mount
  // the failover-stage indicator without any flicker. The query is kept
  // separate from the heavier feature-specific ones above to minimise cost.
  const replicationMeta = useQuery({
    queryKey: ["acf-replication-meta", id],
    queryFn: () => acfApi.getConsistencyCaps(id), // piggy-back: existing endpoint returns policy status too
    enabled: !!id,
    staleTime: 30_000,
    retry: 0,
  });
  const replicationStatus = (() => {
    const data = (replicationMeta.data as { data?: { status?: string } | unknown } | undefined);
    if (!data) return undefined;
    const inner = (data as { data?: unknown }).data;
    if (inner && typeof inner === "object" && "status" in (inner as Record<string, unknown>)) {
      return (inner as { status?: string }).status;
    }
    return undefined;
  })();
  const isFailedOver = replicationStatus === "failed_over";
  const isSyncing =
    replicationStatus === "syncing" || replicationStatus === "active";

  return (
    <AdminPageShell
      title={`Advanced Replication · ${id}`}
      description="Zerto-parity features: application consistency, hypervisor awareness, continuous capture, PITR, block-level transfer."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AcfRealtimeStatus />
        </div>

        {isSyncing && (
          <AcfSyncProgressCard
            replicationIdentifier={id}
            title="Live sync"
            subtitle={`Replication ${id}`}
          />
        )}

        <AcfFailoverStageIndicator
          replicationIdentifier={id}
          forceVisible={isFailedOver}
        />

        {isZfsReplication && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-[#172036] dark:bg-[#0c1427]">
            <span className="text-sm text-gray-700 dark:text-gray-200">
              This replication uses a ZFS transfer method.
            </span>
            <ZfsHealthBadge id={id} />
            {/* Show the billing tier chip so admins can spot pairs that
                are mis-tiered (e.g. a ZFS pair that somehow billed at
                rsync rate) before signing off on a partner payout. */}
            <BillingTierBadge transferMethod={zfsTransferMethod} />
            <Link
              to={`/admin-dashboard/integrations/anycloudflow/replications/${id}/zfs`}
              className="ml-auto inline-flex items-center text-sm text-primary-500 underline"
            >
              ZFS: view pool status →
            </Link>
          </div>
        )}
        <div className="flex gap-2 border-b border-gray-200 dark:border-[#172036] overflow-x-auto">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm whitespace-nowrap ${
                tab === key ? "border-b-2 border-primary-500 text-primary-500" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "consistency" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">Application Consistency</h3>
              <pre className="text-xs bg-gray-100 dark:bg-[#15203c] p-3 rounded">
                {JSON.stringify((consistencyCaps.data as { data?: unknown })?.data ?? consistencyCaps.data, null, 2)}
              </pre>
              <ModernSelect
                label="Consistency level"
                value={consistencyLevel}
                onChange={(e) => setConsistencyLevel(e.target.value)}
                options={[
                  { value: "none", label: "None — fastest, no consistency guarantees" },
                  { value: "fs_sync", label: "FS Sync — flush filesystem buffers" },
                  { value: "app_aware", label: "App-aware — quiesce databases" },
                  { value: "snapshot", label: "Snapshot — LVM/ZFS snapshot" },
                ]}
              />
              <ModernButton onClick={() => setLevel.mutate()} disabled={setLevel.isPending}>Save</ModernButton>
            </div>
          </ModernCard>
        )}

        {tab === "hypervisor" && (
          <ModernCard>
            <div className="p-6 space-y-3">
              <h3 className="font-semibold">Hypervisor</h3>
              <pre className="text-xs bg-gray-100 dark:bg-[#15203c] p-3 rounded">
                {JSON.stringify((hypervisorInfo.data as { data?: unknown })?.data ?? hypervisorInfo.data, null, 2)}
              </pre>
            </div>
          </ModernCard>
        )}

        {tab === "capture" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">Continuous Capture (inotifywait)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Captures filesystem changes in near-real-time for sub-minute RPO. Journal retained for 30 days by default.
              </p>
              <div className="flex gap-2">
                <ModernButton onClick={() => startCapture.mutate()}>Start capture</ModernButton>
                <ModernButton variant="secondary" onClick={() => stopCapture.mutate()}>Stop capture</ModernButton>
                <Link
                  to={`/admin-dashboard/integrations/anycloudflow/replications/${id}/journal`}
                  className="inline-flex items-center px-3 py-1 text-sm underline"
                >
                  View journal →
                </Link>
              </div>
            </div>
          </ModernCard>
        )}

        {tab === "pitr" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">Point-in-Time Recovery</h3>
              <pre className="text-xs bg-gray-100 dark:bg-[#15203c] p-3 rounded">
                {JSON.stringify((pitrRange.data as { data?: unknown })?.data ?? pitrRange.data, null, 2)}
              </pre>
              <input
                type="datetime-local"
                className="px-3 py-2 rounded border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427]"
                value={pitrTimestamp}
                onChange={(e) => setPitrTimestamp(e.target.value)}
              />
              <ModernButton
                variant="danger"
                onClick={() => {
                  if (confirm(`Recover to ${pitrTimestamp}? This rolls back changes on the target.`)) {
                    recoverPitr.mutate();
                  }
                }}
                disabled={!pitrTimestamp}
              >
                Recover to this timestamp
              </ModernButton>
            </div>
          </ModernCard>
        )}

        {tab === "block" && (
          <ModernCard>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold">Block-Level Replication</h3>
              <pre className="text-xs bg-gray-100 dark:bg-[#15203c] p-3 rounded">
                {JSON.stringify((blockCaps.data as { data?: unknown })?.data ?? blockCaps.data, null, 2)}
              </pre>
              <ModernSelect
                label="Transfer method"
                value={transferMethod}
                onChange={(e) => setTransferMethod(e.target.value)}
                options={[
                  { value: "rsync", label: "rsync (file-level)" },
                  { value: "block_diff_rdiff", label: "rdiff (block-diff, best compression)" },
                  { value: "block_diff_xdelta", label: "xdelta3 (block-diff, fast)" },
                  { value: "block_dd", label: "dd (raw block, slowest)" },
                ]}
              />
              <ModernButton onClick={() => setMethod.mutate()}>Save method</ModernButton>
            </div>
          </ModernCard>
        )}
      </div>
    </AdminPageShell>
  );
}
