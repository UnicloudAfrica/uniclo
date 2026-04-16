import { useState } from "react";
import { Plus, Cloud } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchPublicRegions } from "@/hooks/useCostExplorer";

const TIERS = [
  { id: "standard", label: "Standard", desc: "General purpose, frequent access", pricePerGb: 120 },
  { id: "infrequent", label: "Infrequent Access", desc: "Lower cost, less frequent access", pricePerGb: 80 },
  { id: "archive", label: "Archive", desc: "Lowest cost, rare access", pricePerGb: 30 },
];

export default function ObjectStorageConfigurator() {
  const { data: regions } = useFetchPublicRegions();
  const addItem = useCartStore((s) => s.addItem);
  const [region, setRegion] = useState("");
  const [tier, setTier] = useState("standard");
  const [storageGb, setStorageGb] = useState(100);
  const [months, setMonths] = useState(1);

  const regionList = Array.isArray(regions) ? regions : [];
  const selectedTier = TIERS.find((t) => t.id === tier);
  const totalMonthly = (selectedTier?.pricePerGb ?? 120) * storageGb;
  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50"><Cloud className="h-5 w-5 text-sky-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Object Storage</h3>
          <p className="text-xs text-gray-500">S3-compatible object storage with multiple tiers for different access patterns</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Storage Tier</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => (
            <button key={t.id} onClick={() => setTier(t.id)} className={`rounded-lg border-2 p-4 text-left transition-all ${tier === t.id ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="text-sm font-bold text-gray-900">{t.label}</div>
              <div className="text-[11px] text-gray-500">{t.desc}</div>
              <div className="mt-1 text-sm font-semibold text-sky-700">{fmt(t.pricePerGb)}/GB/mo</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Region</label><select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">Select region</option>{regionList.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Storage (GB)</label><input type="number" value={storageGb} onChange={(e) => setStorageGb(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Duration</label><select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}</select></div>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 p-5">
        <div className="flex items-center justify-between">
          <div><span className="text-sm font-semibold text-gray-800">{selectedTier?.label} — {storageGb}GB</span><p className="text-xs text-gray-500">{fmt(selectedTier?.pricePerGb ?? 0)}/GB/mo</p></div>
          <span className="text-xl font-bold text-sky-700">{fmt(totalMonthly)}/mo</span>
        </div>
        <button onClick={() => addItem({ category: "object-storage", name: `Object Storage ${selectedTier?.label} ${storageGb}GB`, description: `${selectedTier?.label} tier, ${storageGb}GB`, config: { tier, storage_gb: storageGb, region, months }, monthly_cost: totalMonthly, one_time_cost: 0, quantity: 1, currency: "NGN" })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
          <Plus className="h-4 w-4" />Add to Cart
        </button>
      </div>
    </div>
  );
}
