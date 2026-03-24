import React from "react";
import { CheckCircle } from "lucide-react";
import { ModernButton } from "../../ui";
import SetupProgressCard from "../../projects/details/SetupProgressCard";
import type { ConfigurationPipeline } from "./useProvisioningProgress";

interface ProvisioningPipelineSectionProps {
  isFastTrack: boolean;
  configurationPipelines: ConfigurationPipeline[];
  isRetryingHealthCheck: boolean;
  onRetryHealthCheck: (keys: string[]) => void;
  isRetryingProvisioning?: boolean;
  onRetryProvisioning?: (keys: string[]) => void;
}

const ProvisioningPipelineSection: React.FC<ProvisioningPipelineSectionProps> = ({
  isFastTrack,
  configurationPipelines,
  isRetryingHealthCheck,
  onRetryHealthCheck,
  isRetryingProvisioning,
  onRetryProvisioning,
}) => {
  return (
    <div className="border-t border-gray-100 pt-4 mt-6">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Order status</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Order confirmed</p>
                <p className="text-xs text-gray-500">Request accepted and queued for processing.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">
                  {isFastTrack ? "Fast-track approved" : "Payment verified"}
                </p>
                <p className="text-xs text-gray-500">
                  {isFastTrack
                    ? "Fast-track authorization granted for provisioning."
                    : "Payment confirmed and released to provisioning."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Provisioning pipeline by configuration
            </h3>
            <span className="text-xs text-gray-500">
              {configurationPipelines.length} configuration
              {configurationPipelines.length === 1 ? "" : "s"}
            </span>
          </div>
          {configurationPipelines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
              Provisioning steps will appear once instances are created.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {configurationPipelines.map((group) => (
                <div key={group.key} className="flex flex-col gap-3">
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                        <p className="text-xs text-gray-500">{group.subtitle}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>
                          {group.instanceCount} instance{group.instanceCount === 1 ? "" : "s"}
                        </p>
                        <p>Term: {group.termLabel}</p>
                      </div>
                    </div>
                    {group.instanceSummaries.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        {group.instanceSummaries.map((item) => (
                          <div key={item.key} className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-700">{item.name}</span>
                            <span className="font-mono text-gray-500">({item.identifier})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <SetupProgressCard steps={group.steps} isLoading={false} />
                  {group.steps.some(
                    (step) =>
                      (step.id === "wait_for_active") &&
                      step.status === "failed"
                  ) && (
                    <ModernButton
                      variant="outline"
                      onClick={() => onRetryHealthCheck(group.instanceIds)}
                      disabled={isRetryingHealthCheck}
                    >
                      {isRetryingHealthCheck ? "Retrying..." : "Retry Health Check"}
                    </ModernButton>
                  )}
                  {group.steps.some(
                    (step) =>
                      (step.id === "allocate_elastic_ip" ||
                        step.id === "attach_data_volumes" ||
                        step.id === "post_provision") &&
                      step.status === "failed"
                  ) &&
                    onRetryProvisioning && (
                      <ModernButton
                        variant="outline"
                        onClick={() => onRetryProvisioning(group.instanceIds)}
                        disabled={isRetryingProvisioning}
                      >
                        {isRetryingProvisioning
                          ? "Retrying failed steps..."
                          : "Retry Failed Steps"}
                      </ModernButton>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProvisioningPipelineSection;
