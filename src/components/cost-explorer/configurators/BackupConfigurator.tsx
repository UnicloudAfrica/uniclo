import { useState } from "react";
import { Plus, Archive, Info } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchAcfPublicServices } from "@/hooks/useCostExplorer";

/**
 * Backup Configurator — flat per-VM/month pricing.
 *
 * AnyCloudFlow ORCHESTRATES backups on the customer's own servers via SSH.
 * We do NOT provide storage. Customer provides the destination (S3, SFTP, NFS).
 * No per-GB charges — data volume is the customer's cost, not ours.
 */
export default function BackupConfigurator() {
  const { data: services } = useFetchAcfPublicServices();
  const addItem = useCartStore((s) => s.addItem);
  const [vmCount, setVmCount] = useState(1);
  const [months, setMonths] = useState(1);

  const svcList = Array.isArray(services) ? services : [];
  const backupSvc = svcList.find((s) => s.service_type === "backup");

  const perVmPrice = backupSvc?.unit_price ?? 3.0;
  const monthlyCost = perVmPrice * vmCount;
  const totalCost = monthlyCost * months;

  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><Archive className="h-5 w-5 text-violet-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Backup Orchestration</h3>
          <p className="text-xs text-gray-500">Flat per-VM pricing — we orchestrate backups on your servers, you provide the destination</p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div className="text-xs text-blue-700">
            <p className="font-semibold">How it works</p>
            <p className="mt-0.5">AnyCloudFlow orchestrates backups via SSH on your servers. You provide the backup destination (S3, SFTP, NFS, or another VM). No per-GB charges — data volume is your cost, not ours.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Configuration</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Number of VMs</label>
            <input type="number" value={vmCount} onChange={(e) => setVmCount(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Billing Duration</label>
            <select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Included Features</h4>
        <ul className="grid gap-1.5 text-xs text-gray-600 sm:grid-cols-2">
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Scheduled & on-demand backups</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Customer-provided destinations</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Compression & encryption</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Retention policy management</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Backup verification</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Unlimited data — no per-GB fees</li>
        </ul>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-5">
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Backup orchestration ({vmCount} VM{vmCount > 1 ? "s" : ""} × {fmt(perVmPrice)}/VM/mo)</span>
            <span>{fmt(monthlyCost)}/mo</span>
          </div>
          {months > 1 && (
            <div className="flex justify-between">
              <span>× {months} months</span>
              <span>{fmt(totalCost)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-violet-200 pt-1 font-semibold text-gray-800">
            <span>Total</span>
            <span>{fmt(totalCost)}</span>
          </div>
        </div>
        <button onClick={() => addItem({
          category: "backup",
          name: `Backup Orchestration (${vmCount} VM${vmCount > 1 ? "s" : ""})`,
          description: `${vmCount} VM${vmCount > 1 ? "s" : ""} × ${months} month${months > 1 ? "s" : ""}`,
          config: { service_type: "backup", qty: vmCount, months },
          monthly_cost: monthlyCost,
          one_time_cost: 0,
          quantity: 1,
          currency: "NGN",
        })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">
          <Plus className="h-4 w-4" />Add to Cart
        </button>
      </div>
    </div>
  );
}
