import { useState } from "react";
import { Loader2, Play, RotateCcw, Plus, ChevronRight } from "lucide-react";
import {
  useProviderMigrations,
  useProviderMigration,
  usePlanMigration,
  useExecuteMigration,
  useRollbackMigration,
} from "@/hooks/adminHooks/providerMigrationHooks";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  preflight: "bg-amber-50 text-amber-700",
  snapshotting: "bg-blue-50 text-blue-700",
  importing: "bg-blue-50 text-blue-700",
  provisioning: "bg-blue-50 text-blue-700",
  finalising: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  rolled_back: "bg-slate-100 text-slate-700",
  rolled_back_with_errors: "bg-orange-50 text-orange-700",
};

const StatusPill = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"
    }`}
  >
    {status}
  </span>
);

const PlanModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({
    tenant_id: "",
    source_provider: "zadara",
    source_region: "",
    target_provider: "openstack",
    target_region: "",
    strategy: "snapshot_restore",
  });
  const plan = usePlanMigration();

  if (!open) return null;

  const submit = () => {
    plan.mutate(form, {
      onSuccess: () => {
        ToastUtils.success("Migration planned.");
        onClose();
      },
      onError: () => ToastUtils.error("Failed to plan migration."),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Plan Provider Migration</h3>
        <div className="space-y-3">
          <input
            placeholder="Tenant ID (UUID)"
            value={form.tenant_id}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.source_provider}
              onChange={(e) => setForm({ ...form, source_provider: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="zadara">zadara</option>
              <option value="nobus">nobus</option>
            </select>
            <input
              placeholder="Source region"
              value={form.source_region}
              onChange={(e) => setForm({ ...form, source_region: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value="openstack"
              disabled
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
            <input
              placeholder="Target region (e.g. lagos-os-1)"
              value={form.target_region}
              onChange={(e) => setForm({ ...form, target_region: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <select
            value={form.strategy}
            onChange={(e) => setForm({ ...form, strategy: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="snapshot_restore">snapshot_restore</option>
            <option value="live_export">live_export</option>
            <option value="manual">manual</option>
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <ModernButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </ModernButton>
          <ModernButton size="sm" onClick={submit} disabled={plan.isPending}>
            {plan.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Plan
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

const DetailDrawer = ({
  identifier,
  onClose,
}: {
  identifier: string | null;
  onClose: () => void;
}) => {
  const { data: migration } = useProviderMigration(identifier);
  const exec = useExecuteMigration();
  const rollback = useRollbackMigration();

  if (!identifier) return null;

  const m = migration as unknown;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[480px] overflow-auto border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Migration</p>
          <h3 className="text-base font-semibold">{identifier}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      {!m ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="space-y-4 p-5 text-sm">
          <div className="flex items-center gap-2">
            <StatusPill status={m.status} />
            <span className="text-xs text-slate-400">{m.strategy}</span>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <dt className="text-slate-400">Source</dt>
              <dd>{m.source_provider} / {m.source_region}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Target</dt>
              <dd>{m.target_provider} / {m.target_region}</dd>
            </div>
          </dl>

          {m.resource_summary && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Resource summary</p>
              <ul className="rounded-lg border border-slate-200 p-2 text-xs">
                {Object.entries(m.resource_summary).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.progress?.plan_delta && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
              <p className="mb-1 font-medium text-amber-800">Plan delta detected</p>
              <pre className="overflow-x-auto text-amber-700">
                {JSON.stringify(m.progress.plan_delta, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {m.status === "pending" && (
              <ModernButton
                size="sm"
                onClick={() =>
                  exec.mutate(m.identifier, {
                    onSuccess: () => ToastUtils.success("Execution queued"),
                  })
                }
                disabled={exec.isPending}
              >
                <Play className="mr-1 h-3.5 w-3.5" />
                Execute
              </ModernButton>
            )}
            {(m.status === "completed" || m.status === "failed") && (
              <ModernButton
                size="sm"
                variant="secondary"
                onClick={() =>
                  rollback.mutate(m.identifier, {
                    onSuccess: () => ToastUtils.success("Rollback initiated"),
                  })
                }
                disabled={rollback.isPending}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Rollback
              </ModernButton>
            )}
          </div>

          {m.items && (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Items ({m.items.length})</p>
              <div className="space-y-1">
                {m.items.map((item: unknown) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border border-slate-100 px-2 py-1 text-xs"
                  >
                    <span className="font-mono text-slate-500">
                      {item.resource_type} · {item.source_resource_id}
                    </span>
                    <StatusPill status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AdminProviderMigrations() {
  const { data, isFetching } = useProviderMigrations();
  const [planOpen, setPlanOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const rows = (data?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <AdminPageShell
      title="Provider Migrations"
      description="Plan, execute, and roll back tenant migrations from Zadara/Nobus to OpenStack."
      headerAction={
        <ModernButton size="sm" onClick={() => setPlanOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Plan Migration
        </ModernButton>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Identifier</th>
              <th className="px-4 py-2.5 text-left">Source</th>
              <th className="px-4 py-2.5 text-left">Target</th>
              <th className="px-4 py-2.5 text-left">Strategy</th>
              <th className="px-4 py-2.5 text-center">Items</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {isFetching && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No migrations yet. Click &ldquo;Plan Migration&rdquo; to create one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id as string}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/50"
                  onClick={() => setActiveId(row.identifier as string)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.identifier as string}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.source_provider as string} / {row.source_region as string}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.target_provider as string} / {row.target_region as string}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.strategy as string}</td>
                  <td className="px-4 py-3 text-center">{(row.items_count as number) ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status as string} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    <ChevronRight className="inline h-4 w-4" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
      <DetailDrawer identifier={activeId} onClose={() => setActiveId(null)} />
    </AdminPageShell>
  );
}
