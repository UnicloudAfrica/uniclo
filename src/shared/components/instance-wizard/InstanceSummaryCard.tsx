import React, { useMemo } from "react";
import {
  Server,
  HardDrive,
  Network,
  Calendar,
  Cpu,
  Image,
  KeyRound,
  Folder,
  Shield,
} from "lucide-react";
import { Configuration } from "../../../types/InstanceConfiguration";
import { ModernCard } from "../ui";
import { DEFAULT_PRESETS } from "../network/NetworkPresetSelector";
import { formatCurrencyValue, toNumber } from "../../../utils/instanceCreationUtils";
import { useNetworkPresets } from "../../../hooks/networkPresetHooks";

interface ConfigurationSummary {
  id: string;
  title?: string;
  regionLabel?: string;
  computeLabel?: string;
  osLabel?: string;
  storageLabel?: string;
  termLabel?: string;
  keypairLabel?: string;
  subnetLabel?: string;
  floatingIpLabel?: string;
}

interface InstanceSummaryCardProps {
  configurations: Configuration[];
  configurationSummaries?: ConfigurationSummary[];
  contextType: string;
  selectedClientName?: string;
  selectedTenantName?: string;
  billingCountry?: string;
  summaryTitle?: string;
  summaryDescription?: string;
  resourceLabel?: string;
  summarySubtotalValue?: number;
  summaryTaxValue?: number;
  summaryGatewayFeesValue?: number;
  summaryGrandTotalValue?: number;
  summaryDisplayCurrency?: string;
  effectivePaymentOption?: any;
  backendPricingData?: any;
}

const InstanceSummaryCard: React.FC<InstanceSummaryCardProps> = ({
  configurations,
  contextType,
  selectedClientName,
  selectedTenantName,
  billingCountry,
  summaryTitle,
  summaryDescription,
  resourceLabel = "Instance",
  configurationSummaries = [],
  summarySubtotalValue = 0,
  summaryTaxValue = 0,
  summaryGatewayFeesValue = 0,
  summaryGrandTotalValue = 0,
  summaryDisplayCurrency = "",
  effectivePaymentOption,
  backendPricingData,
}) => {
  const { data: networkPresets = DEFAULT_PRESETS } = useNetworkPresets();
  const presetCatalog = useMemo(
    () =>
      Array.isArray(networkPresets) && networkPresets.length > 0 ? networkPresets : DEFAULT_PRESETS,
    [networkPresets]
  );
  const resourceLabelPlural = resourceLabel.toLowerCase().endsWith("s")
    ? resourceLabel
    : `${resourceLabel}s`;
  const summaryById = useMemo(() => {
    if (!Array.isArray(configurationSummaries)) {
      return new Map<string, ConfigurationSummary>();
    }
    return new Map(configurationSummaries.map((summary) => [summary.id, summary]));
  }, [configurationSummaries]);
  const presetMap = useMemo(
    () => new Map(presetCatalog.map((preset) => [preset.id, preset.name])),
    [presetCatalog]
  );
  const totalInstances = configurations.reduce(
    (sum, cfg) => sum + Number(cfg.instance_count || 0),
    0
  );
  const resolvedSubtotal = toNumber(summarySubtotalValue || backendPricingData?.subtotal);
  const resolvedTax = toNumber(summaryTaxValue || backendPricingData?.tax);
  const resolvedGrandTotal = toNumber(summaryGrandTotalValue || backendPricingData?.total);
  const estimatedTotal = resolvedSubtotal + resolvedTax;
  const estimatedTotalResolved = estimatedTotal > 0 ? estimatedTotal : resolvedGrandTotal;
  const gatewayBreakdown = effectivePaymentOption?.charge_breakdown || {};
  const gatewayTotal = toNumber(
    gatewayBreakdown?.grand_total ?? effectivePaymentOption?.total ?? 0
  );
  const gatewayFees = toNumber(gatewayBreakdown?.total_fees ?? summaryGatewayFeesValue ?? 0);
  const payableTotal =
    gatewayTotal > 0 ? gatewayTotal : estimatedTotalResolved + (gatewayFees || 0);
  const difference = estimatedTotalResolved > 0 ? payableTotal - estimatedTotalResolved : 0;
  const showPricingBreakdown = estimatedTotalResolved > 0 || gatewayFees !== 0 || payableTotal > 0;
  const displayCurrency =
    summaryDisplayCurrency ||
    backendPricingData?.currency ||
    effectivePaymentOption?.currency ||
    "USD";
  const hasConfigurations =
    configurations.length > 0 &&
    configurations.some((cfg) => {
      const summary = summaryById.get(cfg.id);
      return Boolean(
        cfg.region ||
        cfg.compute_instance_id ||
        cfg.os_image_id ||
        cfg.volume_type_id ||
        cfg.compute_label ||
        cfg.os_image_label ||
        cfg.volume_type_label ||
        summary?.computeLabel ||
        summary?.osLabel ||
        summary?.storageLabel
      );
    });
  const sanitizeLabel = (label?: string) => {
    const normalized = (label || "").trim();
    if (!normalized) return "";
    const blocked = [
      "not selected",
      "selected",
      "instance selected",
      "volume selected",
      "os selected",
    ];
    if (blocked.includes(normalized.toLowerCase())) return "";
    return normalized;
  };

  return (
    <ModernCard variant="outlined" padding="lg" className="sticky top-4" onClick={undefined}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {summaryTitle || "Order Summary"}
          </h3>
          <p className="text-sm text-gray-600">
            {summaryDescription || "Auto-calculated from the captured configuration."}
          </p>
        </div>

        {/* Customer Context */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Customer Context</h4>
          <div className="text-sm text-gray-600">
            {contextType === "tenant" && (
              <p>
                Tenant:{" "}
                <span className="font-medium text-gray-900">
                  {selectedTenantName || "Tenant selected"}
                </span>
              </p>
            )}
            {contextType === "user" && (
              <p>
                User:{" "}
                <span className="font-medium text-gray-900">
                  {selectedClientName || "User selected"}
                </span>
              </p>
            )}
            {contextType === "client" && (
              <p>
                Client:{" "}
                <span className="font-medium text-gray-900">{selectedClientName || "Self"}</span>
              </p>
            )}
            {contextType === "unassigned" && <p className="text-amber-600">⚠ Unassigned</p>}
          </div>
        </div>

        {/* Billing Country */}
        {billingCountry && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Billing Country</h4>
            <p className="text-sm text-gray-900">{billingCountry}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {resourceLabel} configurations
          </h4>

          {!hasConfigurations ? (
            <p className="text-sm text-gray-500 italic">
              No {resourceLabelPlural.toLowerCase()} configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {configurations.map((cfg, idx) => {
                const summary = summaryById.get(cfg.id);
                const hasBasicInfo =
                  cfg.region || cfg.compute_instance_id || cfg.os_image_id || cfg.volume_type_id;
                if (!hasBasicInfo) return null;
                const projectLabel =
                  cfg.project_mode === "new" || cfg.template_locked
                    ? cfg.project_name
                    : cfg.project_name || cfg.project_id;
                const networkPresetLabel =
                  cfg.project_mode === "new" || cfg.template_locked
                    ? presetMap.get(String(cfg.network_preset || "")) || cfg.network_preset || ""
                    : "";
                const securityGroupCount = Array.isArray(cfg.security_group_ids)
                  ? cfg.security_group_ids.length
                  : 0;
                const extraVolumeCount = Array.isArray(cfg.additional_volumes)
                  ? cfg.additional_volumes.length
                  : 0;
                const computeLabel =
                  cfg.compute_instance_id &&
                  (sanitizeLabel(summary?.computeLabel) || sanitizeLabel(cfg.compute_label));
                const osLabel =
                  cfg.os_image_id &&
                  (sanitizeLabel(summary?.osLabel) || sanitizeLabel(cfg.os_image_label));
                const storageLabelBase =
                  cfg.volume_type_id &&
                  (sanitizeLabel(summary?.storageLabel) || sanitizeLabel(cfg.volume_type_label));
                const shouldAppendSize =
                  cfg.storage_size_gb && !storageLabelBase?.toLowerCase().includes("gb");
                const storageLabel = storageLabelBase
                  ? `${storageLabelBase}${shouldAppendSize ? ` • ${cfg.storage_size_gb} GB` : ""}`
                  : "";
                const keypairLabel =
                  cfg.keypair_name &&
                  (sanitizeLabel(summary?.keypairLabel) || sanitizeLabel(cfg.keypair_label));

                return (
                  <div
                    key={cfg.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">
                        {resourceLabel} #{idx + 1}
                      </span>
                      {cfg.name && (
                        <span className="text-xs text-gray-600 truncate max-w-[120px]">
                          {cfg.name}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {cfg.region && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Network className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{summary?.regionLabel || cfg.region}</span>
                        </div>
                      )}

                      {projectLabel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Folder className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Project: {projectLabel}</span>
                        </div>
                      )}

                      {networkPresetLabel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Network className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Network preset: {networkPresetLabel}</span>
                        </div>
                      )}

                      {computeLabel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Cpu className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{computeLabel}</span>
                        </div>
                      )}

                      {osLabel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Image className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{osLabel}</span>
                        </div>
                      )}

                      {storageLabel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <HardDrive className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{storageLabel}</span>
                        </div>
                      )}

                      {keypairLabel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <KeyRound className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{keypairLabel}</span>
                        </div>
                      )}

                      {securityGroupCount > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Shield className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {securityGroupCount} security group
                            {securityGroupCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {extraVolumeCount > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <HardDrive className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {extraVolumeCount} data volume
                            {extraVolumeCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {cfg.instance_count && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Server className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {cfg.instance_count} instance
                            {Number(cfg.instance_count) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {cfg.storage_size_gb && Number(cfg.storage_size_gb) > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <HardDrive className="h-3 w-3 flex-shrink-0" />
                          <span>Root Disk: {cfg.storage_size_gb} GB</span>
                        </div>
                      )}

                      {cfg.volume_types && cfg.volume_types.length > 0 && (
                        <div className="pl-5 border-l-2 border-gray-100 space-y-1">
                          {cfg.volume_types.map((vol, vIdx) => (
                            <div key={vIdx} className="flex items-center gap-2 text-gray-500">
                              <HardDrive className="h-3 w-3 flex-shrink-0" />
                              <span>
                                Data Vol {vIdx + 1}: {vol.storage_size_gb} GB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {cfg.months && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {cfg.months} month{Number(cfg.months) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              {totalInstances > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700">Total {resourceLabelPlural}</span>
                    <span className="font-bold text-gray-900">{totalInstances}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showPricingBreakdown && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Pricing breakdown</h4>
            <div className="space-y-2 text-xs text-gray-600">
              {resolvedSubtotal > 0 && (
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {displayCurrency} {formatCurrencyValue(resolvedSubtotal)}
                  </span>
                </div>
              )}
              {resolvedTax > 0 && (
                <div className="flex items-center justify-between">
                  <span>Estimated tax</span>
                  <span className="font-medium text-gray-900">
                    {displayCurrency} {formatCurrencyValue(resolvedTax)}
                  </span>
                </div>
              )}
              {estimatedTotalResolved > 0 && (resolvedSubtotal > 0 || resolvedTax > 0) && (
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Estimated total</span>
                  <span>
                    {displayCurrency} {formatCurrencyValue(estimatedTotalResolved)}
                  </span>
                </div>
              )}
              {gatewayFees > 0 && (
                <div className="flex items-center justify-between">
                  <span>Gateway fees</span>
                  <span className="font-medium text-gray-900">
                    {displayCurrency} {formatCurrencyValue(gatewayFees)}
                  </span>
                </div>
              )}
              {difference < -0.01 && (
                <div className="flex items-center justify-between">
                  <span>Gateway adjustment</span>
                  <span className="font-medium text-emerald-700">
                    {displayCurrency} {formatCurrencyValue(difference)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
                <span className="font-semibold text-gray-700">Total payable</span>
                <span className="font-bold text-gray-900">
                  {displayCurrency} {formatCurrencyValue(payableTotal)}
                </span>
              </div>
            </div>
            {difference > 0.01 && (
              <p className="text-[11px] text-gray-500">
                Gateway total is higher than the estimate by {displayCurrency}{" "}
                {formatCurrencyValue(difference)}.
              </p>
            )}
            {difference < -0.01 && (
              <p className="text-[11px] text-gray-500">
                Gateway total is lower than the estimate by {displayCurrency}{" "}
                {formatCurrencyValue(Math.abs(difference))}.
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Taxes are estimated and may change after finance review.
          </p>
        </div>
      </div>
    </ModernCard>
  );
};

export default InstanceSummaryCard;
