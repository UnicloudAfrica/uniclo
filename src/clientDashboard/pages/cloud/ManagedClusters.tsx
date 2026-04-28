import { useState } from "react";
import { Loader2, Plus, Trash2, Download, Settings } from "lucide-react";
import { managedClusters } from "@/hooks/openstackResourceHooks";
import { useQuery } from "@tanstack/react-query";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import ResourcePageHeader from "@/shared/components/ui/ResourcePageHeader";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { api } from "../../../lib/api";
import ToastUtils from "@/utils/toastUtil";

export default function KubernetesClusters() {
  const term = CLOUD_TERMS.cluster;
  const { data, isFetching } = managedClusters.useList();
  const create = managedClusters.useCreate();
  const remove = managedClusters.useDelete();

  const [form, setForm] = useState({
    project_id: "",
    name: "",
    cluster_template_id: "",
    node_count: 3,
    master_count: 1,
  });

  const [scaling, setScaling] = useState<{ id: string; current: number } | null>(null);
  const [scaleTo, setScaleTo] = useState<number>(3);
  const [showKubeconfig, setShowKubeconfig] = useState<string | null>(null);

  const clusters = (data?.data ?? []) as Array<Record<string, unknown>>;

  const kubeconfig = useQuery({
    queryKey: ["kubeconfig", showKubeconfig],
    queryFn: async () => (await api.get<{ data: unknown }>(`/managed-clusters/${showKubeconfig}/kubeconfig`, { silent: true }))?.data,
    enabled: !!showKubeconfig,
  });

  const scale = async () => {
    if (!scaling) return;
    try {
      await api.post(`/managed-clusters/${scaling.id}/scale`, { node_count: scaleTo });
      ToastUtils.success(`Cluster scaling to ${scaleTo} nodes.`);
      setScaling(null);
    } catch {
      ToastUtils.error("Scale failed.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <ResourcePageHeader term={term} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-medium text-slate-700">Create a new {term.singular.toLowerCase()}</h3>
        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Workspace ID"
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Cluster name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Template ID (ask admin)"
            value={form.cluster_template_id}
            onChange={(e) => setForm({ ...form, cluster_template_id: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div>
            <label className="text-xs text-slate-500">Worker nodes</label>
            <input
              type="number"
              min={1}
              value={form.node_count}
              onChange={(e) => setForm({ ...form, node_count: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Master nodes</label>
            <input
              type="number"
              min={1}
              value={form.master_count}
              onChange={(e) => setForm({ ...form, master_count: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              create.mutate(form, {
                onSuccess: () => ToastUtils.success("Cluster provisioning started."),
              })
            }
            disabled={create.isPending}
            className="self-end inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {term.cta}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-600">
          Your {term.plural.toLowerCase()}
        </div>
        {isFetching && clusters.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Loading...</div>
        ) : clusters.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No {term.plural.toLowerCase()} yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {clusters.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    {c.node_count} workers / {c.master_count} masters · {c.region}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <button
                    type="button"
                    title="Scale node count"
                    onClick={() => {
                      setScaling({ id: c.identifier, current: c.node_count });
                      setScaleTo(c.node_count);
                    }}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Download kubeconfig"
                    onClick={() => setShowKubeconfig(c.identifier)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(c.identifier)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scale modal */}
      {scaling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Scale cluster</h3>
            <p className="mb-3 text-sm text-slate-500">
              Currently {scaling.current} worker nodes. New count:
            </p>
            <input
              type="number"
              min={1}
              value={scaleTo}
              onChange={(e) => setScaleTo(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setScaling(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button onClick={scale} className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm text-white">
                Scale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kubeconfig modal */}
      {showKubeconfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Kubeconfig</h3>
              <button onClick={() => setShowKubeconfig(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            {kubeconfig.isLoading ? (
              <div className="py-6 text-center text-slate-400">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <>
                <p className="mb-2 text-xs text-slate-500">
                  Save this to <code>~/.kube/config</code> on your machine to use kubectl.
                </p>
                <pre className="max-h-96 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
                  {JSON.stringify(kubeconfig.data, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
