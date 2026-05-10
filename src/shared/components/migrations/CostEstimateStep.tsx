/**
 * CostEstimateStep — Step 5: Display estimated migration cost from API.
 */
import React, { useEffect } from "react";
import { DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { useEstimateMigrationCost } from "@/shared/hooks/resources";
import type {
  AutoProvisionSpecs,
  MigrationEstimate,
} from "@/shared/hooks/resources/externalMigrationHooks";

const TIER_LABELS: Record<string, string> = {
  same_cloud: "Same Cloud",
  cross_cloud: "Cross Cloud",
  on_prem: "On-Premises",
};

interface CostEstimateStepProps {
  sourceEndpointId: string;
  targetEndpointId?: string;
  autoProvisionDestination?: boolean;
  provisionSpecs?: AutoProvisionSpecs;
  onEstimateReady?: (estimate: MigrationEstimate) => void;
}

const CostEstimateStep: React.FC<CostEstimateStepProps> = ({
  sourceEndpointId,
  targetEndpointId,
  autoProvisionDestination = false,
  provisionSpecs,
  onEstimateReady,
}) => {
  const estimateMutation = useEstimateMigrationCost();

  useEffect(() => {
    if (sourceEndpointId && (targetEndpointId || autoProvisionDestination)) {
      estimateMutation.mutate(
        {
          source_endpoint_id: sourceEndpointId,
          ...(targetEndpointId ? { target_endpoint_id: targetEndpointId } : {}),
          ...(autoProvisionDestination
            ? {
                auto_provision_destination: true,
                provision_specs: provisionSpecs,
              }
            : {}),
        },
        {
          onSuccess: (data) => {
            onEstimateReady?.(data);
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceEndpointId, targetEndpointId, autoProvisionDestination, provisionSpecs]);

  if (estimateMutation.isPending) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Loader2
          size={32}
          className="mb-4 animate-spin text-blue-500"
        />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Calculating migration cost...
        </p>
      </div>
    );
  }

  if (estimateMutation.isError) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle size={32} className="mb-3 text-red-500" />
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          Failed to estimate cost
        </p>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {estimateMutation.error?.message ?? "An error occurred"}
        </p>
        <button
          type="button"
          onClick={() =>
            estimateMutation.mutate({
              source_endpoint_id: sourceEndpointId,
              ...(targetEndpointId ? { target_endpoint_id: targetEndpointId } : {}),
              ...(autoProvisionDestination
                ? {
                    auto_provision_destination: true,
                    provision_specs: provisionSpecs,
                  }
                : {}),
            })
          }
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Retry
        </button>
      </div>
    );
  }

  const estimate = estimateMutation.data;
  if (!estimate) return null;

  const breakdown = estimate.estimate?.breakdown;
  const src = estimate.source as { provider?: string } | undefined;
  const tgt = estimate.target as { provider?: string } | undefined;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Cost Estimate
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review the estimated migration cost before proceeding.
        </p>
      </div>

      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {/* Tier & Route */}
        <div className="mb-4 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Migration Tier
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {TIER_LABELS[estimate.migration_tier] ?? estimate.migration_tier}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Route</span>
            <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
              {src?.provider ?? "Source"} → {tgt?.provider ?? "Auto"}
            </span>
          </div>
        </div>

        {/* Cost Breakdown */}
        {breakdown && (
          <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            {breakdown.estimated_data_gb > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Estimated Data
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  ~{breakdown.estimated_data_gb.toFixed(1)} GB
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Base Fee
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                ${breakdown.base_fee.toFixed(2)}
              </span>
            </div>
            {breakdown.data_cost > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Transfer ({breakdown.estimated_data_gb.toFixed(1)} GB ×
                  ${breakdown.per_gb_rate}/GB)
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  ${breakdown.data_cost.toFixed(2)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Estimated Total
              </span>
              <span className="flex items-center gap-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                <DollarSign size={16} />
                {estimate.estimate.estimated_cost_usd.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostEstimateStep;
