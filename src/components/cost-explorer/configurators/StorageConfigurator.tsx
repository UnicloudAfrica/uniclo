import { useState } from "react";
import { Plus, HardDrive } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchCalculatorOptions, useFetchPublicRegions } from "@/hooks/useCostExplorer";

export default function StorageConfigurator() {
  const { data: regions } = useFetchPublicRegions();
  const [region, setRegion] = useState("");
  const { data: options } = useFetchCalculatorOptions(region);
  const addItem = useCartStore((s) => s.addItem);
  const [volumeTypeId, setVolumeTypeId] = useState(0);
  const [sizeGb, setSizeGb] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [months, setMonths] = useState(1);

  const regionList = Array.isArray(regions) ? regions : [];
  const volumeTypes = options?.block_storage ?? [];
  const volType = volumeTypes.find((v: any) => v.id === volumeTypeId);
  const pricePerGb = (volType as any)?.unit_local ?? (volType as any)?.price_per_gb ?? 0;
  const totalMonthly = pricePerGb * sizeGb * quantity;
  const currency = (volType as any)?.currency ?? "NGN";
  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50"><HardDrive className="h-5 w-5 text-orange-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Block Storage</h3>
          <p className="text-xs text-gray-500">Persistent block volumes (SSD/HDD) attachable to compute instances</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Region *</label><select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">Select region</option>{regionList.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Volume Type *</label><select value={volumeTypeId} onChange={(e) => setVolumeTypeId(+e.target.value)} disabled={!region} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"><option value={0}>Select type</option>{volumeTypes.map((v: any) => <option key={v.id} value={v.id}>{v.name} — {fmt(v.unit_local ?? v.price_per_gb ?? 0)}/GB/mo</option>)}</select></div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Size (GB)</label><input type="number" value={sizeGb} onChange={(e) => setSizeGb(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Quantity</label><input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Duration</label><select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}</select></div>
        </div>
      </div>

      {volType && (
        <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 p-5">
          <div className="flex items-center justify-between">
            <div><span className="text-sm font-semibold text-gray-800">{(volType as any).name} — {sizeGb}GB × {quantity}</span></div>
            <span className="text-xl font-bold text-orange-700">{fmt(totalMonthly)}/mo</span>
          </div>
          <button onClick={() => addItem({ category: "storage", name: `${(volType as any).name} ${sizeGb}GB × ${quantity}`, description: `${(volType as any).name} block storage`, config: { volume_type_id: volumeTypeId, size_gb: sizeGb, quantity, region, months }, monthly_cost: totalMonthly, one_time_cost: 0, quantity: 1, currency })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">
            <Plus className="h-4 w-4" />Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
