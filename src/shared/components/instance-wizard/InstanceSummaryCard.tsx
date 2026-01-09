import React from "react";
import { Server, HardDrive, Network, Calendar } from "lucide-react";
import { Configuration } from "../../../types/InstanceConfiguration";
import { ModernCard } from "../ui";

interface InstanceSummaryCardProps {
  configurations: Configuration[];
  contextType: string;
  selectedClientName?: string;
  selectedTenantName?: string;
  billingCountry?: string;
  summaryTitle?: string;
  summaryDescription?: string;
  resourceLabel?: string;
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
}) => {
  const resourceLabelPlural = resourceLabel.toLowerCase().endsWith("s")
    ? resourceLabel
    : `${resourceLabel}s`;
  const totalInstances = configurations.reduce(
    (sum, cfg) => sum + Number(cfg.instance_count || 0),
    0
  );
  const hasConfigurations =
    configurations.length > 0 &&
    configurations.some((cfg) => cfg.region || cfg.compute_instance_id);

  return (
    <ModernCard variant="outlined" padding="lg" className="sticky top-4" onClick={undefined}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {summaryTitle || "Order Summary"}
          </h3>
          <p className="text-sm text-slate-600">
            {summaryDescription || "Auto-calculated from the captured configuration."}
          </p>
        </div>

        {/* Customer Context */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">Customer Context</h4>
          <div className="text-sm text-slate-600">
            {contextType === "tenant" && (
              <p>
                Tenant:{" "}
                <span className="font-medium text-slate-900">
                  {selectedTenantName || "Tenant selected"}
                </span>
              </p>
            )}
            {contextType === "user" && (
              <p>
                User:{" "}
                <span className="font-medium text-slate-900">
                  {selectedClientName || "User selected"}
                </span>
              </p>
            )}
            {contextType === "client" && (
              <p>
                Client:{" "}
                <span className="font-medium text-slate-900">{selectedClientName || "Self"}</span>
              </p>
            )}
            {contextType === "unassigned" && <p className="text-amber-600">⚠ Unassigned</p>}
          </div>
        </div>

        {/* Billing Country */}
        {billingCountry && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Billing Country</h4>
            <p className="text-sm text-slate-900">{billingCountry}</p>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            {resourceLabel} configurations
          </h4>

          {!hasConfigurations ? (
            <p className="text-sm text-slate-500 italic">
              No {resourceLabelPlural.toLowerCase()} configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {configurations.map((cfg, idx) => {
                const hasBasicInfo = cfg.region || cfg.compute_instance_id;
                if (!hasBasicInfo) return null;

                return (
                  <div
                    key={cfg.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        {resourceLabel} #{idx + 1}
                      </span>
                      {cfg.name && (
                        <span className="text-xs text-slate-600 truncate max-w-[120px]">
                          {cfg.name}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {cfg.region && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Network className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{cfg.region}</span>
                        </div>
                      )}

                      {cfg.instance_count && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Server className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {cfg.instance_count} instance
                            {Number(cfg.instance_count) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {cfg.storage_size_gb && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <HardDrive className="h-3 w-3 flex-shrink-0" />
                          <span>{cfg.storage_size_gb} GB storage</span>
                        </div>
                      )}

                      {cfg.months && (
                        <div className="flex items-center gap-2 text-slate-600">
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
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      Total {resourceLabelPlural}
                    </span>
                    <span className="font-bold text-slate-900">{totalInstances}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Taxes are estimated and may change after finance review.
          </p>
        </div>
      </div>
    </ModernCard>
  );
};

export default InstanceSummaryCard;
