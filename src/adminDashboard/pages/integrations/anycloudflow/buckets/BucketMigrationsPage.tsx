import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import {
  ModernButton,
  ModernCard,
  ModernSelect,
  ModernTable,
  ModernModal,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "../api";
import {
  BucketStatusBadge,
  type BucketMigrationStatus,
} from "@/shared/components/bucket-replication";

/**
 * List all bucket migrations with a live status badge. Admins click through
 * to the detail page for progress + failure log + actions.
 *
 * Egress-cost warning: the creation flow enforces explicit-acknowledge before
 * live migrations start. This list page just surfaces state — it doesn't
 * re-warn. If we added a "re-run" button here we'd have to re-prompt.
 */

interface Migration {
  identifier: string;
  status: BucketMigrationStatus;
  dry_run: boolean;
  source_endpoint?: { label?: string; bucket_name?: string };
  target_endpoint?: { label?: string; bucket_name?: string };
  objects_copied?: number;
  bytes_copied?: number;
  started_at?: string | null;
  completed_at?: string | null;
}

interface EndpointLite {
  identifier: string;
  label: string;
  bucket_name: string;
  provider: string;
  preflight_passed_at?: string | null;
}

// statusBadge() removed — BucketStatusBadge owns the migration status mapping.

function formatBytes(b?: number): string {
  if (!b) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
}

export default function BucketMigrationsPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["acf-bucket-migrations", statusFilter],
    queryFn: () => acfApi.listBucketMigrations(statusFilter ? { status: statusFilter } : {}),
    // Poll every 15s so in-flight migrations show live status without
    // requiring the tenant to refresh. Detail page polls faster (3s).
    refetchInterval: 15_000,
  });
  const rows: Migration[] = (data as { data?: unknown })?.data ?? (data as unknown) ?? [];

  const { data: endpointsData } = useQuery({
    queryKey: ["acf-bucket-endpoints-lite"],
    queryFn: () => acfApi.listBucketEndpoints(),
  });
  const endpoints: EndpointLite[] = (endpointsData as { data?: unknown })?.data ?? (endpointsData as unknown) ?? [];
  const hasEnoughEndpoints = endpoints.filter((e) => !!e.preflight_passed_at).length >= 2;

  const columns = [
    { key: "src", header: "Source → Target", render: (m: Migration) => (
      <div className="text-xs">
        <div className="font-mono">{m.source_endpoint?.bucket_name ?? "—"}</div>
        <div className="text-gray-500 dark:text-gray-400">→ {m.target_endpoint?.bucket_name ?? "—"}</div>
      </div>
    )},
    { key: "mode", header: "Mode", render: (m: Migration) => (
      <span className="text-xs">{m.dry_run ? "Dry-run" : "Live"}</span>
    )},
    { key: "status", header: "Status", render: (m: Migration) => (
      <BucketStatusBadge variant="migration" status={m.status} />
    )},
    { key: "progress", header: "Objects / Bytes", render: (m: Migration) => (
      <span className="text-xs">
        {m.objects_copied?.toLocaleString() ?? 0} · {formatBytes(m.bytes_copied)}
      </span>
    )},
    { key: "started", header: "Started", render: (m: Migration) => m.started_at ?? "—" },
    { key: "actions", header: "", render: (m: Migration) => (
      <ModernButton size="sm" onClick={() => navigate(`/admin-dashboard/integrations/anycloudflow/buckets/migrations/${m.identifier}`)}>
        View
      </ModernButton>
    )},
  ];

  return (
    <AdminPageShell
      title="Bucket Migrations"
      description="One-time object-storage migrations. Dry-run mode is recommended before every live run."
      actions={
        <ModernButton
          onClick={() => setCreating(true)}
          disabled={!hasEnoughEndpoints}
          title={!hasEnoughEndpoints ? "Need at least 2 preflight-passed endpoints" : undefined}
        >
          + New Migration
        </ModernButton>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="w-48">
            <ModernSelect
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All" },
                { value: "scheduled", label: "Scheduled" },
                { value: "listing", label: "Listing" },
                { value: "transferring", label: "Transferring" },
                { value: "verifying", label: "Verifying" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>

        {!hasEnoughEndpoints && (
          <ModernCard>
            <div className="p-4 text-sm text-yellow-900 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              You need at least 2 bucket endpoints with passing preflights to run a migration.{" "}
              <a href="/admin-dashboard/integrations/anycloudflow/buckets/endpoints" className="underline font-semibold">
                Register endpoints →
              </a>
            </div>
          </ModernCard>
        )}

        {rows.length === 0 && !isLoading && hasEnoughEndpoints ? (
          <ModernCard>
            <div className="p-8 text-center">
              <p className="font-semibold">No migrations yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Start with a dry-run to preview what would be copied. No charges apply to dry-runs.
              </p>
              <div className="mt-4">
                <ModernButton onClick={() => setCreating(true)}>Start first migration</ModernButton>
              </div>
            </div>
          </ModernCard>
        ) : (
          <ModernTable columns={columns} data={rows as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
        )}

        {creating && (
          <CreateMigrationModal
            endpoints={endpoints.filter((e) => !!e.preflight_passed_at)}
            onClose={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false);
              navigate(`/admin-dashboard/integrations/anycloudflow/buckets/migrations/${id}`);
            }}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

function CreateMigrationModal({
  endpoints,
  onClose,
  onCreated,
}: {
  endpoints: EndpointLite[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [typedTarget, setTypedTarget] = useState("");
  const [egressAcknowledged, setEgressAcknowledged] = useState(false);

  const targetBucket = endpoints.find((e) => e.identifier === targetId)?.bucket_name ?? "";
  const sourceProvider = endpoints.find((e) => e.identifier === sourceId)?.provider;
  const targetProvider = endpoints.find((e) => e.identifier === targetId)?.provider;
  const providerMismatch = sourceId && targetId && sourceProvider !== targetProvider;

  // Cost preview — we don't know bucket size until preflight, so the preview
  // is "up to" bounded by the source's estimate once the preflight has run.
  // In MVP we fetch pricing for a 1TB quote as an illustration.
  const { data: pricingData } = useQuery({
    queryKey: ["acf-bucket-pricing", 1024],
    queryFn: () => acfApi.getBucketMigrationPricing(1024),
  });
  const pricing = (pricingData as { data?: unknown })?.data ?? pricingData;

  const create = useMutation({
    mutationFn: () => acfApi.createBucketMigration({
      source_endpoint_identifier: sourceId,
      target_endpoint_identifier: targetId,
      dry_run: dryRun,
      confirm_target_bucket: dryRun ? undefined : typedTarget,
    }),
    onSuccess: (res: unknown) => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-migrations"] });
      const id = res?.data?.identifier ?? res?.identifier;
      if (id) onCreated(id);
      else ToastUtils.success("Migration created");
    },
    onError: (err: unknown) => ToastUtils.error(err?.response?.data?.message ?? "Creation failed"),
  });

  const live = !dryRun;
  const typedCorrectly = !live || (typedTarget === targetBucket);
  const canSubmit =
    sourceId &&
    targetId &&
    sourceId !== targetId &&
    !providerMismatch &&
    (!live || (egressAcknowledged && typedCorrectly));

  return (
    <ModernModal isOpen={true} onClose={onClose} title="New bucket migration">
      <div className="p-4 space-y-4">
        <ModernSelect
          label="Source bucket"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          options={[
            { value: "", label: "— choose —" },
            ...endpoints.map((e) => ({ value: e.identifier, label: `${e.label} (${e.bucket_name})` })),
          ]}
        />
        <ModernSelect
          label="Target bucket"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          options={[
            { value: "", label: "— choose —" },
            ...endpoints
              .filter((e) => e.identifier !== sourceId)
              .map((e) => ({ value: e.identifier, label: `${e.label} (${e.bucket_name})` })),
          ]}
        />

        {providerMismatch && (
          <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200">
            Source and target use different providers. Cross-provider migration is a Phase 3 feature and will be rejected.
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <strong>Dry-run first</strong> (recommended).{" "}
            <span className="text-gray-500 dark:text-gray-400">
              No objects are copied. The run produces an estimate of what would transfer + cost.
            </span>
          </span>
        </label>

        {pricing && (
          <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
            <strong>Pricing:</strong>{" "}
            ${((pricing.rate_cents_per_gb ?? 1) / 100).toFixed(3)}/GB, rounded up to next GB, $
            {((pricing.minimum_cents ?? 500) / 100).toFixed(2)} minimum.
            <div className="mt-1">
              Example: a 1 TB migration = ${(((pricing.estimated_cost_cents ?? 102400) / 100)).toFixed(2)}.
            </div>
          </div>
        )}

        {live && (
          <>
            <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              <strong>Warning — egress charges.</strong> AnyCloudFlow does not pass through your cloud provider's egress or
              request costs. Cross-region S3 transfers typically run ~$0.02/GB on the AWS bill;
              API calls (LIST/GET/PUT) add $0.005/1000 calls. This fee is separate from AnyCloudFlow's charges.
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={egressAcknowledged}
                onChange={(e) => setEgressAcknowledged(e.target.checked)}
                className="mt-0.5"
              />
              <span>I understand AnyCloudFlow is not liable for cloud-provider egress charges.</span>
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type the target bucket name to confirm live migration
              </label>
              <input
                type="text"
                value={typedTarget}
                onChange={(e) => setTypedTarget(e.target.value)}
                placeholder={targetBucket}
                className="w-full rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-3 py-2 text-sm"
              />
              {typedTarget && !typedCorrectly && (
                <p className="text-xs text-red-600 mt-1">Bucket name doesn't match.</p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <ModernButton variant="secondary" onClick={onClose}>Cancel</ModernButton>
          <ModernButton
            variant={live ? "danger" : "primary"}
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? "Creating…" : live ? "Start live migration" : "Create dry-run"}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
}
