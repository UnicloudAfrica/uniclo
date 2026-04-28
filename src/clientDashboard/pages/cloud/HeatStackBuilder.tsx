import { useState, useEffect } from "react";
import { Loader2, Play, Trash2, Layers, Sparkles } from "lucide-react";
import { heatStacks } from "@/hooks/openstackResourceHooks";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import HeroSection from "@/shared/components/ui/HeroSection";
import MetricTile from "@/shared/components/ui/MetricTile";
import GradientCard from "@/shared/components/ui/GradientCard";
import EmptyState from "@/shared/components/ui/EmptyState";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { api } from "../../../lib/api";
import ToastUtils from "@/utils/toastUtil";

interface TemplateLibraryItem {
  key: string;
  title: string;
  description: string;
  category: string;
  template: string;
  parameters: Array<{ name: string; type: string; description?: string; default?: string | number }>;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Compute: "from-blue-500 to-cyan-500",
  Network: "from-emerald-500 to-teal-500",
  Storage: "from-amber-500 to-orange-500",
  Container: "from-violet-500 to-purple-500",
  "Web Application": "from-pink-500 to-rose-500",
};

export default function BlueprintBuilder() {
  const term = CLOUD_TERMS.blueprint;
  const { data, isFetching } = heatStacks.useList();
  const create = heatStacks.useCreate();
  const remove = heatStacks.useDelete();

  const [library, setLibrary] = useState<TemplateLibraryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateLibraryItem | null>(null);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});
  const [customYaml, setCustomYaml] = useState("");
  const [mode, setMode] = useState<"library" | "custom">("library");

  useEffect(() => {
    api.get<{ data: TemplateLibraryItem[] }>("/heat-stacks/templates", { silent: true })
      .then((r) => setLibrary(r?.data ?? []))
      .catch(() => setLibrary([]));
  }, []);

  const stacks = (data?.data ?? []) as Array<Record<string, unknown>>;

  const submit = () => {
    const template = mode === "library" ? selectedTemplate?.template : customYaml;
    if (!template || !name || !projectId) {
      ToastUtils.error("Fill in name, workspace, and pick a template.");
      return;
    }
    create.mutate(
      { project_id: projectId, name, template, parameters: params },
      {
        onSuccess: () => {
          ToastUtils.success(`${term.singular} deployment started.`);
          setName("");
          setParams({});
        },
      },
    );
  };

  const activeCount = stacks.filter((s) => s.status === "active").length;
  const inProgressCount = stacks.filter((s) => ["creating", "updating", "deleting"].includes(s.status)).length;
  const failedCount = stacks.filter((s) => s.status === "failed").length;

  return (
    <div className="space-y-6 p-6">
      <HeroSection
        term={term}
        accent="from-indigo-600 via-violet-600 to-purple-700"
        icon={<Layers className="h-7 w-7 text-white" />}
        metrics={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricTile glass label="Total" value={stacks.length} />
            <MetricTile glass label="Active" value={activeCount} />
            <MetricTile glass label="In progress" value={inProgressCount} />
            <MetricTile glass label="Failed" value={failedCount} />
          </div>
        }
      />

      <GradientCard
        title="Start with a template"
        subtitle="Pre-built recipes you can deploy in seconds."
        accent="from-indigo-500 to-violet-500"
        actions={
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("library")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                mode === "library" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                mode === "custom" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              Write your own
            </button>
          </div>
        }
      >
        {mode === "library" ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {library.map((item) => {
              const gradient = CATEGORY_GRADIENTS[item.category] ?? "from-slate-500 to-slate-700";
              const selected = selectedTemplate?.key === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(item);
                    const defaults: Record<string, string> = {};
                    item.parameters.forEach((p) => {
                      defaults[p.name] = String(p.default ?? "");
                    });
                    setParams(defaults);
                  }}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                    selected ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                  <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${gradient} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm`}>
                    {item.category}
                  </span>
                  <p className="mt-2 font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  {selected && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      <Sparkles className="h-3 w-3" />
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            rows={14}
            value={customYaml}
            onChange={(e) => setCustomYaml(e.target.value)}
            placeholder={"heat_template_version: 2018-08-31\n\ndescription: My infrastructure\n\nresources: ..."}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-xs"
          />
        )}
      </GradientCard>

      {(selectedTemplate || mode === "custom") && (
        <GradientCard
          title={`Configure your ${term.singular.toLowerCase()}`}
          subtitle="Tweak the parameters, give it a name, hit deploy."
          accent="from-emerald-500 to-teal-500"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Workspace ID (e.g. proj-abc123)"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <input
              placeholder={`${term.singular} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>

          {selectedTemplate && selectedTemplate.parameters.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parameters</p>
              {selectedTemplate.parameters.map((p) => (
                <div key={p.name} className="grid grid-cols-3 gap-3">
                  <label className="self-center text-xs text-slate-600">
                    <span className="font-mono">{p.name}</span>
                    {p.description && <span className="ml-2 text-slate-400">{p.description}</span>}
                  </label>
                  <input
                    className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={params[p.name] ?? ""}
                    onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={create.isPending}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition group-hover:translate-x-full" />
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Deploy
            </button>
          </div>
        </GradientCard>
      )}

      <GradientCard title={`Your ${term.plural.toLowerCase()}`} accent="from-slate-400 to-slate-500">
        {isFetching && stacks.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : stacks.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-7 w-7" />}
            title={`No ${term.plural.toLowerCase()} yet`}
            description="Pick a template above to deploy your first one."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {stacks.map((s) => (
              <li key={s.id} className="group flex items-center justify-between py-3 text-sm transition hover:bg-slate-50/50">
                <div>
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <p className="font-mono text-xs text-slate-400">{s.identifier}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={s.status} />
                  <button
                    type="button"
                    onClick={() => remove.mutate(s.identifier, { onSuccess: () => ToastUtils.success("Deleting...") })}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GradientCard>
    </div>
  );
}
