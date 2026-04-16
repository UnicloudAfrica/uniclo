import { useState, useMemo } from "react";
import { Plus, Database, Search } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchPublicRegions } from "@/hooks/useCostExplorer";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const publicApi = axios.create({ baseURL: `${API_BASE}/api/v1`, headers: { Accept: "application/json" } });

interface EngineConfig {
  key: string;
  label: string;
  category: string;
  description: string;
  versions: string[];
  default_version: string;
  port: number;
  license: string;
  supports_replication: boolean;
  max_replicas: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  relational: "Relational",
  timeseries: "Time-Series",
  document: "Document",
  key_value: "Key-Value / Cache",
  wide_column: "Wide-Column",
  search: "Search",
  vector: "Vector / AI",
  graph: "Graph",
  messaging: "Messaging",
  analytics: "Analytics",
  infrastructure: "Infrastructure",
  object_storage: "Object Storage",
};

const PLANS = [
  { id: "micro", label: "Micro", vcpu: 1, ram: 1, storage: 10, price: 5000 },
  { id: "small", label: "Small", vcpu: 2, ram: 2, storage: 25, price: 10000 },
  { id: "medium", label: "Medium", vcpu: 4, ram: 4, storage: 50, price: 20000 },
  { id: "large", label: "Large", vcpu: 8, ram: 8, storage: 100, price: 40000 },
  { id: "xlarge", label: "XLarge", vcpu: 16, ram: 16, storage: 250, price: 80000 },
];

export default function DatabaseConfigurator() {
  const { data: regions } = useFetchPublicRegions();
  const { data: engineData } = useQuery({
    queryKey: ["db-engines"],
    queryFn: async () => {
      const res = await publicApi.get("/cost-explorer/database-engines");
      return res.data?.data as { engines: Record<string, EngineConfig>; categories: Record<string, EngineConfig[]>; total: number };
    },
    staleTime: 60_000 * 30,
  });
  const addItem = useCartStore((s) => s.addItem);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [engine, setEngine] = useState("");
  const [version, setVersion] = useState("");
  const [planId, setPlanId] = useState("small");
  const [region, setRegion] = useState("");
  const [replicaCount, setReplicaCount] = useState(0);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [months, setMonths] = useState(1);

  const regionList = Array.isArray(regions) ? regions : [];
  const allEngines = engineData?.engines ?? {};
  const categories = engineData?.categories ?? {};
  const totalEngines = engineData?.total ?? 0;

  // Filter engines
  const filteredEngines = useMemo(() => {
    let engines = Object.entries(allEngines).map(([key, config]) => ({ key, ...config }));
    if (selectedCategory !== "all") {
      engines = engines.filter((e) => e.category === selectedCategory);
    }
    if (search) {
      const s = search.toLowerCase();
      engines = engines.filter((e) => e.label.toLowerCase().includes(s) || e.description.toLowerCase().includes(s) || e.key.includes(s));
    }
    return engines;
  }, [allEngines, selectedCategory, search]);

  const selectedEngine = engine ? allEngines[engine] : null;
  const plan = PLANS.find((p) => p.id === planId);
  const basePrice = plan?.price ?? 0;
  const replicaPrice = basePrice * replicaCount * 0.8;
  const backupPrice = backupEnabled ? basePrice * 0.1 : 0;
  const totalMonthly = basePrice + replicaPrice + backupPrice;

  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><Database className="h-5 w-5 text-emerald-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Managed Database</h3>
          <p className="text-xs text-gray-500">
            {totalEngines} database engines across {Object.keys(categories).length} categories — fully managed with automated backups and high availability
          </p>
        </div>
      </div>

      {/* Engine Selection */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Select Database Engine ({totalEngines} available)</h4>

        {/* Search + Category Filter */}
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search engines..." className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs" />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs">
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              categories[key] ? <option key={key} value={key}>{label} ({categories[key]?.length ?? 0})</option> : null
            ))}
          </select>
        </div>

        {/* Engine Grid */}
        <div className="grid max-h-64 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {filteredEngines.map((eng) => (
            <button
              key={eng.key}
              onClick={() => { setEngine(eng.key); setVersion(eng.default_version); }}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all ${engine === eng.key ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 truncate">{eng.label}</span>
                  {eng.license === "commercial" && <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[8px] font-bold text-amber-700">BYOL</span>}
                  {eng.license === "free_edition" && <span className="shrink-0 rounded bg-blue-100 px-1 py-0.5 text-[8px] font-bold text-blue-700">FREE</span>}
                </div>
                <div className="truncate text-[10px] text-gray-400">{eng.description}</div>
              </div>
            </button>
          ))}
        </div>
        {filteredEngines.length === 0 && <p className="py-4 text-center text-xs text-gray-400">No engines match your search</p>}
      </div>

      {/* Version + Config */}
      {selectedEngine && (
        <>
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Configuration</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Engine</label>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  {selectedEngine.label} <span className="text-xs text-emerald-500">(port {selectedEngine.port})</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Version</label>
                <select value={version} onChange={(e) => setVersion(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {selectedEngine.versions.map((v: string) => <option key={v} value={v}>{v}{v === selectedEngine.default_version ? " (recommended)" : ""}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Plan Size</h4>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {PLANS.map((p) => (
                <button key={p.id} onClick={() => setPlanId(p.id)} className={`rounded-lg border-2 p-3 text-center text-xs transition-all ${planId === p.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="font-bold text-gray-900">{p.label}</div>
                  <div className="text-gray-500">{p.vcpu} vCPU</div>
                  <div className="text-gray-500">{p.ram} GB RAM</div>
                  <div className="text-gray-500">{p.storage} GB SSD</div>
                  <div className="mt-1 font-semibold text-emerald-700">{fmt(p.price)}/mo</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Location & Replicas</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Region *</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select region</option>
                  {regionList.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Read Replicas</label>
                <select value={replicaCount} onChange={(e) => setReplicaCount(+e.target.value)} disabled={!selectedEngine.supports_replication} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
                  {selectedEngine.supports_replication ? (
                    Array.from({ length: (selectedEngine.max_replicas || 3) + 1 }, (_, i) => (
                      <option key={i} value={i}>{i === 0 ? "No replicas" : `${i} replica${i > 1 ? "s" : ""}`}</option>
                    ))
                  ) : (
                    <option value={0}>Not supported</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Duration</label>
                <select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Features</h4>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={backupEnabled} onChange={(e) => setBackupEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
              <span>Automated daily backups (+10% of plan cost)</span>
            </label>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
            <div className="mb-3 text-sm font-semibold text-gray-700">Cost Breakdown</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>{selectedEngine.label} {version} — {plan?.label}</span><span>{fmt(basePrice)}/mo</span></div>
              {replicaCount > 0 && <div className="flex justify-between"><span>Read replicas × {replicaCount} (80% of plan)</span><span>{fmt(replicaPrice)}/mo</span></div>}
              {backupEnabled && <div className="flex justify-between"><span>Automated backups</span><span>{fmt(backupPrice)}/mo</span></div>}
              <div className="flex justify-between border-t border-emerald-200 pt-1 font-semibold text-gray-800"><span>Total</span><span>{fmt(totalMonthly)}/mo</span></div>
              {months > 1 && <div className="flex justify-between text-emerald-700"><span>Total for {months} months</span><span className="font-bold">{fmt(totalMonthly * months)}</span></div>}
            </div>
            <button onClick={() => addItem({ category: "databases", name: `${selectedEngine.label} ${version} ${plan?.label}`, description: `${plan?.vcpu} vCPU, ${plan?.ram}GB RAM, ${plan?.storage}GB SSD${replicaCount > 0 ? `, ${replicaCount} replicas` : ""}`, config: { engine, version, plan: planId, region, replicas: replicaCount, backup: backupEnabled, months }, monthly_cost: totalMonthly, one_time_cost: 0, quantity: 1, currency: "NGN" })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" />Add to Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}
