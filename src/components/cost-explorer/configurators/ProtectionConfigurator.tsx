import { useState } from "react";
import { Plus, ShieldCheck, Shield, ArrowUpDown, RefreshCw } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchAcfPublicServices } from "@/hooks/useCostExplorer";

type ProtectionPlan = "none" | "backup_only" | "dr_standby" | "dr_replication";

export default function ProtectionConfigurator() {
  const { data: services } = useFetchAcfPublicServices();
  const addItem = useCartStore((s) => s.addItem);

  const [plan, setPlan] = useState<ProtectionPlan>("backup_only");
  const [instanceCount, setInstanceCount] = useState(1);
  const [storageGb, setStorageGb] = useState(100);
  const [months, setMonths] = useState(1);

  const svcList = Array.isArray(services) ? services : [];
  const backupSvc = svcList.find((s) => s.service_type === "backup");
  const replicationSvc = svcList.find((s) => s.service_type === "replication" || s.service_type === "dr_replication");
  const drStandbySvc = svcList.find((s) => s.service_type === "dr_standby");

  const backupPerGb = backupSvc?.unit_price ?? 16;
  const replicationPerVm = replicationSvc?.unit_price ?? 12000;
  const drStandbyPerVm = drStandbySvc?.unit_price ?? 8000;

  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Calculate costs based on plan
  const backupCost = plan !== "none" ? backupPerGb * storageGb * instanceCount : 0;
  const drStandbyCost = (plan === "dr_standby" || plan === "dr_replication") ? drStandbyPerVm * instanceCount : 0;
  const replicationCost = plan === "dr_replication" ? replicationPerVm * instanceCount : 0;
  const totalMonthly = backupCost + drStandbyCost + replicationCost;

  const plans: { id: ProtectionPlan; label: string; description: string; icon: typeof Shield; accent: string }[] = [
    {
      id: "none",
      label: "No Protection",
      description: "No backup or DR. Not recommended for production.",
      icon: Shield,
      accent: "border-gray-200",
    },
    {
      id: "backup_only",
      label: "Backup Only",
      description: "Daily snapshots with configurable retention. Restore within 24hrs.",
      icon: Shield,
      accent: "border-amber-300 bg-amber-50/30",
    },
    {
      id: "dr_standby",
      label: "DR Standby",
      description: "Standby VM in secondary AZ. Snapshot-based sync included.",
      icon: ArrowUpDown,
      accent: "border-blue-300 bg-blue-50/30",
    },
    {
      id: "dr_replication",
      label: "DR + AnyCloudFlow Replication",
      description: "Continuous block-level replication, automated failover, sub-minute RPO.",
      icon: ShieldCheck,
      accent: "border-green-300 bg-green-50/30",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Protection Plan</h3>
          <p className="text-xs text-gray-500">Backup, DR standby, and AnyCloudFlow replication for instances and storage</p>
        </div>
      </div>

      {/* Plan selection */}
      <div className="space-y-2">
        {plans.map((p) => {
          const isSelected = plan === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${isSelected ? p.accent + " ring-1 ring-offset-1" : "border-gray-200 hover:border-gray-300"}`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
              <div className="flex-1">
                <div className={`text-sm font-semibold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{p.label}</div>
                <div className="text-[11px] text-gray-500">{p.description}</div>
              </div>
              {p.id !== "none" && (
                <div className="text-right text-xs font-semibold text-gray-600">
                  {p.id === "backup_only" && <span>{fmt(backupPerGb)}/GB</span>}
                  {p.id === "dr_standby" && <span>{fmt(drStandbyPerVm)}/VM</span>}
                  {p.id === "dr_replication" && <span>+{fmt(replicationPerVm)}/VM</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Configuration */}
      {plan !== "none" && (
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Configuration</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Instances to Protect</label>
              <input
                type="number"
                value={instanceCount}
                onChange={(e) => setInstanceCount(Math.max(1, +e.target.value))}
                min={1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Storage per Instance (GB)</label>
              <input
                type="number"
                value={storageGb}
                onChange={(e) => setStorageGb(Math.max(1, +e.target.value))}
                min={1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Billing Duration</label>
              <select
                value={months}
                onChange={(e) => setMonths(+e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {[1, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pricing breakdown */}
      {plan !== "none" && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 p-5">
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Backup ({instanceCount} × {storageGb}GB × {fmt(backupPerGb)}/GB)</span>
              <span>{fmt(backupCost)}/mo</span>
            </div>
            {(plan === "dr_standby" || plan === "dr_replication") && (
              <div className="flex justify-between">
                <span>DR Standby VM ({instanceCount} × {fmt(drStandbyPerVm)}/VM)</span>
                <span>{fmt(drStandbyCost)}/mo</span>
              </div>
            )}
            {plan === "dr_replication" && (
              <div className="flex justify-between">
                <span>
                  <RefreshCw className="mr-1 inline h-3 w-3" />
                  AnyCloudFlow Replication ({instanceCount} × {fmt(replicationPerVm)}/VM)
                </span>
                <span>{fmt(replicationCost)}/mo</span>
              </div>
            )}
            <div className="flex justify-between border-t border-emerald-200 pt-1 font-semibold text-gray-800">
              <span>Monthly Total</span>
              <span>{fmt(totalMonthly)}/mo</span>
            </div>
            {months > 1 && (
              <div className="flex justify-between text-gray-500">
                <span>{months}-month total</span>
                <span>{fmt(totalMonthly * months)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() =>
              addItem({
                category: "protection",
                name: plans.find((p) => p.id === plan)?.label ?? "Protection",
                description: `${instanceCount} instance${instanceCount > 1 ? "s" : ""}, ${storageGb}GB each`,
                config: { plan, instance_count: instanceCount, storage_gb: storageGb, months },
                monthly_cost: totalMonthly,
                one_time_cost: 0,
                quantity: 1,
                currency: "NGN",
              })
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
