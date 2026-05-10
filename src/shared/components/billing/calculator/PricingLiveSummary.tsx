import React from "react";
import { ModernCard } from "../../ui";
import { RESILIENCE } from "@/shared/branding";
import {
  Server,
  Inbox,
  Globe,
  HardDrive,
  Cpu,
  Monitor,
  Network,
  Rocket,
  Shield as ShieldIcon,
  CloudCog,
  Gauge,
} from "lucide-react";
import { CalculatorData, ShieldServiceLineItem } from "../types";

interface PricingLiveSummaryProps {
  calculatorData: CalculatorData;
  currency: string;
}

const formatMoney = (amount: number, ccy: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const PricingLiveSummary: React.FC<PricingLiveSummaryProps> = ({ calculatorData, currency }) => {
  const workloadCount = calculatorData.pricing_requests?.length || 0;
  const storageCount = calculatorData.object_storage_items?.length || 0;
  const flowPlanItems = calculatorData.flow_plan_items ?? [];
  const shieldItems = calculatorData.shield_items ?? [];
  const anycloudflowItems = calculatorData.anycloudflow_items ?? [];
  const meteredItems = calculatorData.metered_items ?? [];

  // Per-bucket subtotals in their native currency. We don't FX-convert
  // here — the right rail is a configuration mirror, not the canonical
  // total — so each bucket prints in the currency the rows were quoted
  // in. The summary step is responsible for the cross-currency rollup
  // after the API priceAddOns() call.
  const flowPlanTotal = flowPlanItems.reduce(
    (sum, row) => sum + row.monthly_naira * row.quantity * (row.months || 1),
    0,
  );
  const sumIntegration = (rows: ShieldServiceLineItem[]) =>
    rows.reduce((sum, row) => {
      const months = row.billing_model === "monthly_flat" ? row.months || 1 : 1;
      return sum + row.unit_price * row.quantity * months;
    }, 0);
  const shieldTotal = sumIntegration(shieldItems);
  const anycloudflowTotal = sumIntegration(anycloudflowItems);
  const meteredTotal = meteredItems.reduce((sum, row) => {
    const isMonthly = /\bmonth\b/i.test(row.unit || "");
    const months = isMonthly ? row.months || 1 : 1;
    return sum + row.unit_price * row.estimated_quantity * months;
  }, 0);

  const shieldCurrency = shieldItems[0]?.currency ?? "USD";
  const anycloudflowCurrency = anycloudflowItems[0]?.currency ?? "USD";
  const meteredCurrency = meteredItems[0]?.currency ?? "NGN";

  return (
    <div className="sticky top-24 space-y-4">
      <ModernCard padding="default" className="space-y-4 border-l-4 border-l-primary-500">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Configuration Summary</h3>
          {currency && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
              {currency}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Location */}
          <div className="flex items-start gap-3 text-sm">
            <Globe className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-700">Location</p>
              <p className="text-slate-500">{calculatorData.country_code || "Not selected"}</p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Compute Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Server className="h-4 w-4 text-slate-400" />
              <span>Compute Workloads ({workloadCount})</span>
            </div>

            {workloadCount > 0 ? (
              <div className="space-y-3 pl-6">
                {calculatorData.pricing_requests.map((req, i) => (
                  <div
                    key={`${req.compute_instance_id}-${req.region}-${i}`}
                    className="text-xs space-y-1 border-l-2 border-slate-100 pl-3 py-1"
                  >
                    <p className="font-medium text-slate-900">
                      Workload #{i + 1}
                      {req.region_name && (
                        <span className="text-slate-500 font-normal"> • {req.region_name}</span>
                      )}
                    </p>

                    {/* Instance */}
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <Cpu className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>
                        {req.number_of_instances}x{" "}
                        {req.compute_instance_name?.split("•")[0] || "Instance"}
                      </span>
                    </div>

                    {/* OS */}
                    {req.os_image_name && (
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <Monitor className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{req.os_image_name.split("•")[0]}</span>
                      </div>
                    )}

                    {/* Volumes */}
                    {req.volumes && req.volumes.length > 0 && (
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <HardDrive className="h-3 w-3 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          {req.volumes.map((vol, vIdx) => (
                            <div key={`${vol.volume_type_id}-${vIdx}`}>
                              {vol.storage_size_gb}GB{" "}
                              {vol.volume_type_name?.split("•")[0] || "Volume"}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Networking */}
                    {(req.bandwidth_name || req.floating_ip_name || req.cross_connect_name) && (
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <Network className="h-3 w-3 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          {req.bandwidth_name && <div>{req.bandwidth_name}</div>}
                          {req.floating_ip_name && (
                            <div>
                              {req.floating_ip_count || 1}x {req.floating_ip_name}
                            </div>
                          )}
                          {req.cross_connect_name && <div>{req.cross_connect_name}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 pl-6">No workloads configured</p>
            )}
          </div>

          {/* Object Storage Details */}
          {storageCount > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Inbox className="h-4 w-4 text-slate-400" />
                  <span>Object Storage ({storageCount})</span>
                </div>
                <div className="space-y-2 pl-6">
                  {calculatorData.object_storage_items.map((item, i) => (
                    <div
                      key={`${item.tier_id}-${item.product_name}-${i}`}
                      className="text-xs text-slate-600 border-l-2 border-slate-100 pl-3 py-1"
                    >
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      <p>
                        {item.quantity} GB • {item.months} Month
                        {Number(item.months) === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SlimDeploy plan subscriptions */}
          {flowPlanItems.length > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-slate-400" />
                    <span>SlimDeploy Plans ({flowPlanItems.length})</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatMoney(flowPlanTotal, "NGN")}
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  {flowPlanItems.map((row) => (
                    <div
                      key={row.id}
                      className="text-xs text-slate-600 border-l-2 border-slate-100 pl-3 py-1"
                    >
                      <p className="font-medium text-slate-900">{row.plan_name}</p>
                      <p>
                        {row.quantity} × {row.months} Month{row.months === 1 ? "" : "s"} •{" "}
                        {formatMoney(row.monthly_naira, "NGN")}/mo
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Shield services */}
          {shieldItems.length > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-slate-400" />
                    <span>Shield Services ({shieldItems.length})</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatMoney(shieldTotal, shieldCurrency)}
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  {shieldItems.map((row) => (
                    <div
                      key={row.id}
                      className="text-xs text-slate-600 border-l-2 border-slate-100 pl-3 py-1"
                    >
                      <p className="font-medium text-slate-900">{row.service_name}</p>
                      <p>
                        {row.quantity} {row.unit_label || "unit"}
                        {row.billing_model === "monthly_flat"
                          ? ` × ${row.months} Month${row.months === 1 ? "" : "s"}`
                          : ""}{" "}
                        • {formatMoney(row.unit_price, row.currency || "USD")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AnyCloudFlow services */}
          {anycloudflowItems.length > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <CloudCog className="h-4 w-4 text-slate-400" />
                    <span>{RESILIENCE} ({anycloudflowItems.length})</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatMoney(anycloudflowTotal, anycloudflowCurrency)}
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  {anycloudflowItems.map((row) => {
                    const bucketSize = (
                      row as ShieldServiceLineItem & { bucket_size_gb?: number }
                    ).bucket_size_gb;
                    return (
                      <div
                        key={row.id}
                        className="text-xs text-slate-600 border-l-2 border-slate-100 pl-3 py-1"
                      >
                        <p className="font-medium text-slate-900">{row.service_name}</p>
                        <p>
                          {row.quantity} {row.unit_label || "unit"}
                          {row.billing_model === "monthly_flat"
                            ? ` × ${row.months} Month${row.months === 1 ? "" : "s"}`
                            : ""}{" "}
                          • {formatMoney(row.unit_price, row.currency || "USD")}
                        </p>
                        {typeof bucketSize === "number" && bucketSize > 0 && (
                          <p className="text-slate-500">Bucket size: {bucketSize} GB</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Pay-as-you-go metrics */}
          {meteredItems.length > 0 && (
            <>
              <div className="h-px bg-slate-100" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-slate-400" />
                    <span>Pay-as-you-go ({meteredItems.length})</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatMoney(meteredTotal, meteredCurrency)} <em>(est.)</em>
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  {meteredItems.map((row) => (
                    <div
                      key={row.id}
                      className="text-xs text-slate-600 border-l-2 border-slate-100 pl-3 py-1"
                    >
                      <p className="font-medium text-slate-900">{row.metric_label}</p>
                      <p>
                        ~{row.estimated_quantity} {row.unit} • {formatMoney(row.unit_price, row.currency || "USD")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ModernCard>
    </div>
  );
};

export default PricingLiveSummary;
