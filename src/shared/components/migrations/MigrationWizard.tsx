/**
 * MigrationWizard — Multi-step wizard for creating an external migration.
 *
 * Steps: Resource Type → Source → Target → Config → Cost → Review → Progress
 * Uses ProvisioningWizardLayout for consistent layout.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProvisioningWizardLayout from "@/shared/components/instance-wizard/ProvisioningWizardLayout";
import ResourceTypeStep from "./ResourceTypeStep";
import EndpointStep from "./EndpointStep";
import MigrationConfigStep from "./MigrationConfigStep";
import CostEstimateStep from "./CostEstimateStep";
import MigrationProgressStep from "./MigrationProgressStep";
import {
  useInitiateExternalMigration,
  useConfirmExternalMigration,
} from "@/shared/hooks/resources";
import type {
  ExternalMigration,
  MigrationEstimate,
} from "@/shared/hooks/resources/externalMigrationHooks";
import { ModernButton, ModernCard } from "../ui";
import {
  ArrowRight,
  ArrowLeft,
  Server,
  Database,
  HardDrive,
  DollarSign,
} from "lucide-react";

interface MigrationWizardProps {
  context: "admin" | "tenant" | "client";
  listPath?: string;
}

const STEPS = [
  { id: "type", title: "Resource Type", desc: "What to migrate" },
  { id: "source", title: "Source", desc: "Where data is now" },
  { id: "target", title: "Target", desc: "Where data goes" },
  { id: "config", title: "Configure", desc: "Transfer method" },
  { id: "cost", title: "Cost", desc: "Review estimate" },
  { id: "review", title: "Review", desc: "Confirm details" },
  { id: "progress", title: "Progress", desc: "Track migration" },
];

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  vm: <Server size={16} />,
  database: <Database size={16} />,
  storage: <HardDrive size={16} />,
};

const MigrationWizard: React.FC<MigrationWizardProps> = ({
  context: _context,
  listPath = "migrations",
}) => {
  const navigate = useNavigate();

  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [resourceType, setResourceType] = useState("");
  const [sourceEndpointId, setSourceEndpointId] = useState("");
  const [targetEndpointId, setTargetEndpointId] = useState("");
  const [transferMethod, setTransferMethod] = useState("rsync");
  const [estimate, setEstimate] = useState<MigrationEstimate | null>(null);
  const [migration, setMigration] = useState<ExternalMigration | null>(null);

  const initiateMutation = useInitiateExternalMigration();
  const confirmMutation = useConfirmExternalMigration();

  const currentStepId = STEPS[activeStep]?.id;

  // Navigation helpers
  const canGoNext = useMemo(() => {
    switch (currentStepId) {
      case "type":
        return !!resourceType;
      case "source":
        return !!sourceEndpointId;
      case "target":
        return !!targetEndpointId && targetEndpointId !== sourceEndpointId;
      case "config":
        return !!transferMethod;
      case "cost":
        return !!estimate;
      default:
        return true;
    }
  }, [
    currentStepId,
    resourceType,
    sourceEndpointId,
    targetEndpointId,
    transferMethod,
    estimate,
  ]);

  const goNext = useCallback(() => {
    if (activeStep < STEPS.length - 1 && canGoNext) {
      setActiveStep((s) => s + 1);
    }
  }, [activeStep, canGoNext]);

  const goBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    }
  }, [activeStep]);

  // Submit handler — initiate + confirm in one step
  const handleStartMigration = useCallback(async () => {
    initiateMutation.mutate(
      {
        source_endpoint_id: sourceEndpointId,
        target_endpoint_id: targetEndpointId,
        transfer_method: transferMethod,
      },
      {
        onSuccess: (data: unknown) => {
          const mig = data as ExternalMigration;
          setMigration(mig);
          // Auto-confirm
          confirmMutation.mutate(
            { migrationId: mig.identifier },
            {
              onSuccess: () => {
                setActiveStep(STEPS.findIndex((s) => s.id === "progress"));
              },
            },
          );
        },
      },
    );
  }, [
    sourceEndpointId,
    targetEndpointId,
    transferMethod,
    initiateMutation,
    confirmMutation,
  ]);

  // Main content per step
  const mainContent = useMemo(() => {
    switch (currentStepId) {
      case "type":
        return (
          <ResourceTypeStep value={resourceType} onChange={setResourceType} />
        );
      case "source":
        return (
          <EndpointStep
            label="Source"
            resourceType={resourceType}
            selectedEndpointId={sourceEndpointId}
            onSelect={setSourceEndpointId}
          />
        );
      case "target":
        return (
          <EndpointStep
            label="Target"
            resourceType={resourceType}
            selectedEndpointId={targetEndpointId}
            onSelect={setTargetEndpointId}
            excludeEndpointId={sourceEndpointId}
          />
        );
      case "config":
        return (
          <MigrationConfigStep
            resourceType={resourceType}
            transferMethod={transferMethod}
            onTransferMethodChange={setTransferMethod}
          />
        );
      case "cost":
        return (
          <CostEstimateStep
            sourceEndpointId={sourceEndpointId}
            targetEndpointId={targetEndpointId}
            onEstimateReady={setEstimate}
          />
        );
      default:
        return null;
    }
  }, [
    currentStepId,
    resourceType,
    sourceEndpointId,
    targetEndpointId,
    transferMethod,
  ]);

  // Sidebar summary
  const sidebarContent = useMemo(() => {
    if (currentStepId === "progress") return null;

    return (
      <ModernCard variant="outlined" padding="default">
        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Migration Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Type</span>
            <span className="flex items-center gap-1 font-medium capitalize text-gray-900 dark:text-gray-100">
              {RESOURCE_ICONS[resourceType]}
              {resourceType || "Not selected"}
            </span>
          </div>
          {sourceEndpointId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Source</span>
              <span className="max-w-[120px] truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                {sourceEndpointId.slice(0, 8)}...
              </span>
            </div>
          )}
          {targetEndpointId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Target</span>
              <span className="max-w-[120px] truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                {targetEndpointId.slice(0, 8)}...
              </span>
            </div>
          )}
          {transferMethod && activeStep >= 3 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Method</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {transferMethod}
              </span>
            </div>
          )}
          {estimate && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Estimated Cost
              </span>
              <span className="flex items-center gap-0.5 text-lg font-bold text-blue-600 dark:text-blue-400">
                <DollarSign size={14} />
                {estimate.estimate.estimated_cost_usd.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStepId !== "review" && (
          <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            {activeStep > 0 && (
              <ModernButton variant="outline" size="sm" onClick={goBack}>
                <ArrowLeft size={14} className="mr-1" />
                Back
              </ModernButton>
            )}
            <ModernButton
              variant="primary"
              size="sm"
              onClick={goNext}
              disabled={!canGoNext}
              className="flex-1"
            >
              Next
              <ArrowRight size={14} className="ml-1" />
            </ModernButton>
          </div>
        )}
      </ModernCard>
    );
  }, [
    currentStepId,
    resourceType,
    sourceEndpointId,
    targetEndpointId,
    transferMethod,
    activeStep,
    estimate,
    canGoNext,
    goNext,
    goBack,
  ]);

  // Review content
  const reviewContent = useMemo(() => {
    const breakdown = estimate?.estimate?.breakdown;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Review Migration
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Confirm the details below, then start the migration.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Resource Type
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 capitalize text-gray-900 dark:text-gray-100">
                {RESOURCE_ICONS[resourceType]} {resourceType}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Transfer Method
              </p>
              <p className="mt-0.5 text-gray-900 dark:text-gray-100">
                {transferMethod}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Migration Tier
              </p>
              <p className="mt-0.5 capitalize text-gray-900 dark:text-gray-100">
                {estimate?.migration_tier?.replace("_", " ") ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Estimated Data
              </p>
              <p className="mt-0.5 text-gray-900 dark:text-gray-100">
                {breakdown?.estimated_data_gb
                  ? `~${breakdown.estimated_data_gb.toFixed(1)} GB`
                  : "—"}
              </p>
            </div>
          </div>

          {breakdown && (
            <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Base Fee</span>
                <span>${breakdown.base_fee.toFixed(2)}</span>
              </div>
              {breakdown.data_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data Transfer</span>
                  <span>${breakdown.data_cost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Estimated Total</span>
                <span className="text-blue-600 dark:text-blue-400">
                  ${estimate?.estimate.estimated_cost_usd.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <ModernButton variant="outline" onClick={goBack}>
            <ArrowLeft size={16} className="mr-1" />
            Back
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleStartMigration}
            disabled={initiateMutation.isPending || confirmMutation.isPending}
          >
            {initiateMutation.isPending || confirmMutation.isPending
              ? "Starting..."
              : "Start Migration"}
          </ModernButton>
        </div>
      </div>
    );
  }, [
    estimate,
    resourceType,
    transferMethod,
    goBack,
    handleStartMigration,
    initiateMutation.isPending,
    confirmMutation.isPending,
  ]);

  // Success (progress) content
  const successContent = useMemo(() => {
    return (
      <MigrationProgressStep
        migrationId={migration?.identifier}
        migrationIdentifier={migration?.identifier}
        onDone={() => navigate(listPath)}
      />
    );
  }, [migration, navigate, listPath]);

  return (
    <ProvisioningWizardLayout
      steps={STEPS}
      activeStep={activeStep}
      onStepChange={(idx) => {
        if (idx < activeStep) setActiveStep(idx);
      }}
      currentStepId={currentStepId}
      reviewStepId="review"
      successStepId="progress"
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      reviewContent={reviewContent}
      successContent={successContent}
    />
  );
};

export default MigrationWizard;
