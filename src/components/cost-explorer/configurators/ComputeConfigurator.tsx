import { useState, useMemo } from "react";
import { Plus, Server } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchCalculatorOptions, useFetchPublicRegions } from "@/hooks/useCostExplorer";

export default function ComputeConfigurator() {
  const { data: regions } = useFetchPublicRegions();
  const [region, setRegion] = useState("");
  const { data: options } = useFetchCalculatorOptions(region);
  const addItem = useCartStore((s) => s.addItem);

  const [az, setAz] = useState("");
  const [flavorId, setFlavorId] = useState(0);
  const [osId, setOsId] = useState(0);
  const [volumeTypeId, setVolumeTypeId] = useState(0);
  const [storageGb, setStorageGb] = useState(50);
  const [bandwidthId, setBandwidthId] = useState(0);
  const [bandwidthCount, setBandwidthCount] = useState(1);
  const [floatingIpCount, setFloatingIpCount] = useState(0);
  const [instanceCount, setInstanceCount] = useState(1);
  const [months, setMonths] = useState(1);

  const regionList = Array.isArray(regions) ? regions : [];
  const selectedRegion = regionList.find((r) => r.code === region);
  const azList = selectedRegion?.availability_zones ?? [];
  const flavors = options?.compute_flavors ?? [];
  const osImages = options?.os_images ?? [];
  const volumeTypes = options?.block_storage ?? [];
  const bandwidths = options?.bandwidth ?? [];

  const flavor = flavors.find((f: any) => f.id === flavorId);
  const os = osImages.find((o: any) => o.id === osId);
  const volType = volumeTypes.find((v: any) => v.id === volumeTypeId);
  const bw = bandwidths.find((b: any) => b.id === bandwidthId);

  const flavorPrice = (flavor as any)?.unit_local ?? (flavor as any)?.price ?? 0;
  const osPrice = (os as any)?.unit_local ?? (os as any)?.price ?? 0;
  const storagePrice = ((volType as any)?.unit_local ?? (volType as any)?.price_per_gb ?? 0) * storageGb;
  const bwPrice = bw ? ((bw as any)?.unit_local ?? (bw as any)?.price ?? 0) * bandwidthCount : 0;
  const ipPrice = floatingIpCount * ((options?.floating_ips?.[0] as any)?.unit_local ?? 0);

  const unitMonthly = flavorPrice + osPrice + storagePrice + bwPrice + ipPrice;
  const totalMonthly = unitMonthly * instanceCount;
  const totalForPeriod = totalMonthly * months;

  const currency = (flavor as any)?.currency ?? "NGN";
  const sym = currency === "NGN" ? "₦" : "$";
  const fmt = (v: number) => `${sym}${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handleAdd = () => {
    if (!flavor) return;
    addItem({
      category: "compute",
      name: `${(flavor as any).name} × ${instanceCount}`,
      description: `${(flavor as any).vcpus} vCPU, ${Math.round(((flavor as any).memory_mb ?? (flavor as any).memory_gib * 1024) / 1024)}GB RAM, ${storageGb}GB ${(volType as any)?.name ?? "storage"}`,
      config: { flavor_id: flavorId, os_id: osId, volume_type_id: volumeTypeId, storage_gb: storageGb, bandwidth_id: bandwidthId, bandwidth_count: bandwidthCount, floating_ip_count: floatingIpCount, region, az, months },
      monthly_cost: totalMonthly,
      one_time_cost: 0,
      quantity: 1,
      currency,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Server className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Compute Instance</h3>
          <p className="text-xs text-gray-500">Virtual machines with customizable CPU, RAM, storage, and networking</p>
        </div>
      </div>

      {/* Region + AZ */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Location</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Region *</label>
            <select value={region} onChange={(e) => { setRegion(e.target.value); setAz(""); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select region</option>
              {regionList.map((r) => <option key={r.code} value={r.code}>{r.name} ({r.country_code})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Availability Zone</label>
            <select value={az} onChange={(e) => setAz(e.target.value)} disabled={!region || azList.length === 0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">Auto-select</option>
              {azList.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Compute Plan */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Compute Plan</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Instance Type *</label>
            <select value={flavorId} onChange={(e) => setFlavorId(+e.target.value)} disabled={!region} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value={0}>Select instance type</option>
              {flavors.map((f: any) => <option key={f.id} value={f.id}>{f.name} — {f.vcpus} vCPU, {Math.round((f.memory_mb ?? f.memory_gib * 1024) / 1024)}GB RAM — {fmt(f.unit_local ?? f.price ?? 0)}/mo</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Operating System *</label>
            <select value={osId} onChange={(e) => setOsId(+e.target.value)} disabled={!region} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value={0}>Select OS</option>
              {osImages.map((o: any) => <option key={o.id} value={o.id}>{o.display_name || o.name}{o.unit_local > 0 ? ` — ${fmt(o.unit_local)}/mo` : " — Free"}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Storage</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Volume Type *</label>
            <select value={volumeTypeId} onChange={(e) => setVolumeTypeId(+e.target.value)} disabled={!region} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value={0}>Select volume type</option>
              {volumeTypes.map((v: any) => <option key={v.id} value={v.id}>{v.name} — {fmt(v.unit_local ?? v.price_per_gb ?? 0)}/GB/mo</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Storage Size (GB)</label>
            <input type="number" value={storageGb} onChange={(e) => setStorageGb(Math.max(10, +e.target.value))} min={10} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Networking */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Networking</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Bandwidth</label>
            <select value={bandwidthId} onChange={(e) => setBandwidthId(+e.target.value)} disabled={!region} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value={0}>None</option>
              {bandwidths.map((b: any) => <option key={b.id} value={b.id}>{b.name} — {fmt(b.unit_local ?? b.price ?? 0)}/mo</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Bandwidth Units</label>
            <input type="number" value={bandwidthCount} onChange={(e) => setBandwidthCount(Math.max(0, +e.target.value))} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Floating IPs</label>
            <input type="number" value={floatingIpCount} onChange={(e) => setFloatingIpCount(Math.max(0, +e.target.value))} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Quantity + Duration */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Billing</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Number of Instances</label>
            <input type="number" value={instanceCount} onChange={(e) => setInstanceCount(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Duration (months)</label>
            <select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {[1, 3, 6, 12, 24, 36].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Price Summary */}
      {flavor && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
          <div className="mb-3 text-sm font-semibold text-gray-700">Cost Breakdown</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between"><span>Compute ({(flavor as any).name})</span><span>{fmt(flavorPrice)}/mo</span></div>
            {osPrice > 0 && <div className="flex justify-between"><span>OS License</span><span>{fmt(osPrice)}/mo</span></div>}
            <div className="flex justify-between"><span>Storage ({storageGb}GB {(volType as any)?.name ?? ""})</span><span>{fmt(storagePrice)}/mo</span></div>
            {bwPrice > 0 && <div className="flex justify-between"><span>Bandwidth × {bandwidthCount}</span><span>{fmt(bwPrice)}/mo</span></div>}
            {ipPrice > 0 && <div className="flex justify-between"><span>Floating IPs × {floatingIpCount}</span><span>{fmt(ipPrice)}/mo</span></div>}
            <div className="flex justify-between border-t border-blue-200 pt-1 font-semibold text-gray-800"><span>Per instance/mo</span><span>{fmt(unitMonthly)}</span></div>
            {instanceCount > 1 && <div className="flex justify-between font-semibold text-gray-800"><span>× {instanceCount} instances</span><span>{fmt(totalMonthly)}/mo</span></div>}
            {months > 1 && <div className="flex justify-between text-blue-700"><span>Total for {months} months</span><span className="font-bold">{fmt(totalForPeriod)}</span></div>}
          </div>
          <button onClick={handleAdd} disabled={!flavorId} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <Plus className="h-4 w-4" />Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
