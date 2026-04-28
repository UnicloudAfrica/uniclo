import { useState } from "react";
import { Loader2, KeyRound, Trash2, Eye } from "lucide-react";
import { managedSecrets } from "@/hooks/openstackResourceHooks";
import { useQuery } from "@tanstack/react-query";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import ResourcePageHeader from "@/shared/components/ui/ResourcePageHeader";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { api } from "../../../lib/api";
import ToastUtils from "@/utils/toastUtil";

export default function Secrets() {
  const term = CLOUD_TERMS.secret;
  const { data, isFetching } = managedSecrets.useList();
  const create = managedSecrets.useCreate();
  const remove = managedSecrets.useDelete();

  const [form, setForm] = useState({
    region: "",
    name: "",
    payload: "",
    algorithm: "aes",
    bit_length: 256,
  });
  const [revealId, setRevealId] = useState<string | null>(null);

  const reveal = useQuery({
    queryKey: ["secret-payload", revealId],
    queryFn: async () =>
      (await api.get<{ data: unknown }>(`/managed-secrets/${revealId}/payload`, { silent: true }))?.data,
    enabled: !!revealId,
  });

  const rows = (data?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6 p-6">
      <ResourcePageHeader term={term} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Region (e.g. lagos-os-1)"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Secret name (e.g. db-password)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          rows={4}
          placeholder="Secret content (encrypted at rest)"
          value={form.payload}
          onChange={(e) => setForm({ ...form, payload: e.target.value })}
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() =>
              create.mutate(form, {
                onSuccess: () => {
                  ToastUtils.success(`${term.singular} stored.`);
                  setForm({ ...form, name: "", payload: "" });
                },
              })
            }
            disabled={create.isPending || !form.payload}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {term.cta}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        {isFetching && rows.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No {term.plural.toLowerCase()} yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {r.algorithm}-{r.bit_length} · {r.region}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <button
                    type="button"
                    onClick={() => setRevealId(r.identifier)}
                    title="Reveal payload"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(r.identifier)}
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

      {revealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Secret payload</h3>
              <button onClick={() => setRevealId(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-amber-700">⚠️ This action is logged in the activity log.</p>
            {reveal.isLoading ? (
              <div className="py-6 text-center text-slate-400">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <pre className="max-h-72 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
                {JSON.stringify(reveal.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
