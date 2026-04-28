import { useState } from "react";
import { Tag, Trash2, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";

interface Props {
  /** Morph alias e.g. "instance" / "heat_stack" / "managed_cluster". */
  type: string;
  /** Resource identifier or numeric id. */
  id: string;
}

/**
 * Sticky-Notes-on-your-folder UI. Drop into any resource detail page.
 * Backend morph map decides what `type` resolves to.
 */
export default function TagsSidebar({ type, id }: Props) {
  const term = CLOUD_TERMS.tag;
  const qc = useQueryClient();

  const tags = useQuery({
    queryKey: ["tags", type, id],
    queryFn: async () =>
      (await api.get<{ data: Record<string, string | null> }>(`/tags/${type}/${id}`, { silent: true }))?.data ?? {},
    staleTime: 1000 * 30,
  });

  const merge = useMutation({
    mutationFn: async (body: Record<string, string | null>) =>
      api.patch(`/tags/${type}/${id}`, { tags: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags", type, id] }),
  });

  const remove = useMutation({
    mutationFn: async (key: string) => api.delete(`/tags/${type}/${id}/${encodeURIComponent(key)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags", type, id] }),
  });

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const entries = Object.entries(tags.data ?? {});

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Tag className="h-4 w-4 text-slate-500" />
        {term.plural}
      </header>
      <p className="mb-3 text-xs text-slate-500">{term.eli5}</p>

      <div className="space-y-2">
        {tags.isLoading ? (
          <div className="py-2 text-center text-slate-400 text-xs">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-400">No tags yet.</p>
        ) : (
          entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs"
            >
              <span className="font-mono">
                <span className="text-slate-700">{key}</span>
                {value !== null && value !== "" && (
                  <>
                    <span className="mx-1 text-slate-400">=</span>
                    <span className="text-slate-600">{value}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate(key)}
                className="text-slate-400 hover:text-red-500"
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1">
        <input
          placeholder="key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
        />
        <input
          placeholder="value (optional)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (!newKey) return;
          merge.mutate({ [newKey]: newValue || null });
          setNewKey("");
          setNewValue("");
        }}
        disabled={!newKey || merge.isPending}
        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary-500 px-2 py-1 text-xs text-white"
      >
        <Plus className="h-3 w-3" />
        Add tag
      </button>
    </aside>
  );
}
