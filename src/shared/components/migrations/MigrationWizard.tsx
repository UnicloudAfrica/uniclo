/**
 * MigrationWizard — Multi-step wizard for creating an external migration.
 *
 * Steps: Resource Type → Source → Target → Config → Cost → Review → Progress
 * Uses ProvisioningWizardLayout for consistent layout.
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProvisioningWizardLayout from "@/shared/components/instance-wizard/ProvisioningWizardLayout";
import ResourceTypeStep from "./ResourceTypeStep";
import EndpointStep from "./EndpointStep";
import MigrationConfigStep from "./MigrationConfigStep";
import CostEstimateStep from "./CostEstimateStep";
import MigrationProgressStep from "./MigrationProgressStep";
import AutoProvisionTargetStep from "./AutoProvisionTargetStep";
import NetworkConfigStep from "./NetworkConfigStep";
import {
  useInitiateExternalMigration,
  useConfirmExternalMigration,
} from "@/shared/hooks/resources";
import type {
  AutoProvisionSpecs,
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
  Cloud,
} from "lucide-react";

interface MigrationWizardProps {
  context: "admin" | "tenant" | "client";
  listPath?: string;
}

const STEPS = [
  { id: "type", title: "Resource Type", desc: "What to migrate" },
  { id: "source", title: "Source", desc: "Where data is now" },
  { id: "target", title: "Target", desc: "Where data goes" },
  // RES-163: target VM network reconfiguration. Without this step
  // the migrated VM boots with the SOURCE's IP/hostname baked into
  // /etc/netplan or /etc/network/interfaces — networking won't come
  // up after reboot. The `network` step is gated to VM migrations
  // only (databases / object-storage don't need it).
  { id: "network", title: "Network", desc: "Target hostname & IP" },
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

/**
 * Cheap IPv4 validator — server-side does the real validation, but
 * we want to give the user immediate feedback so they don't have to
 * round-trip to find out they fat-fingered an IP. IPv6 is allowed
 * by passing through (server validates).
 */
function isValidIp(value: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = value.match(v4);
  if (m) {
    return m.slice(1).every((n) => Number(n) >= 0 && Number(n) <= 255);
  }
  // Permissive IPv6 — accept anything with colons and hex digits;
  // server (Laravel `ip` rule) will reject malformed values.
  if (/:/.test(value) && /^[0-9a-fA-F:]+$/.test(value)) return true;
  return false;
}

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
  const [targetMode, setTargetMode] = useState<"existing" | "auto">("existing");
  const [provisionSpecs, setProvisionSpecs] = useState<AutoProvisionSpecs>({
    provider_id: "",
    provider: "",
    name: "",
    type: "app",
    region: "",
    size: "",
    image_id: "",
    offer_id: "",
    ssh_key_ids: [],
    ssh_user: "root",
    auth_method: "key",
    ssh_private_key: "",
    ssh_password: "",
  });
  const [transferMethod, setTransferMethod] = useState("rsync");
  const [estimate, setEstimate] = useState<MigrationEstimate | null>(null);
  const [migration, setMigration] = useState<ExternalMigration | null>(null);

  // RES-163: target VM network reconfiguration. All sub-fields are
  // optional — empty values cause AcF's ConfigAdapterService::adapt()
  // to skip that particular reconfiguration step. For auto-provision
  // we recommend the user fill at least `hostname` so the migrated
  // VM doesn't try to claim the source's name on the same network.
  const [adaptHostname, setAdaptHostname] = useState("");
  const [adaptIp, setAdaptIp] = useState("");
  const [adaptMask, setAdaptMask] = useState("");
  const [adaptGateway, setAdaptGateway] = useState("");
  const [adaptDns, setAdaptDns] = useState(""); // comma-separated

  const initiateMutation = useInitiateExternalMigration();
  const confirmMutation = useConfirmExternalMigration();

  const currentStepId = STEPS[activeStep]?.id;

  useEffect(() => {
    if (resourceType !== "vm" && targetMode === "auto") {
      setTargetMode("existing");
    }
  }, [resourceType, targetMode]);

  useEffect(() => {
    setEstimate(null);
  }, [sourceEndpointId, targetEndpointId, targetMode, provisionSpecs, transferMethod]);

  const isProvisionReady = useMemo(() => {
    if (targetMode !== "auto") return true;

    const authMethod = provisionSpecs.auth_method ?? "key";
    const hasCredential =
      authMethod === "password"
        ? !!provisionSpecs.ssh_password
        : !!provisionSpecs.ssh_private_key;

    return (
      resourceType === "vm" &&
      !!provisionSpecs.provider_id &&
      !!provisionSpecs.region &&
      !!provisionSpecs.size &&
      hasCredential
    );
  }, [provisionSpecs, resourceType, targetMode]);

  // Navigation helpers
  const canGoNext = useMemo(() => {
    switch (currentStepId) {
      case "type":
        return !!resourceType;
      case "source":
        return !!sourceEndpointId;
      case "target":
        return targetMode === "auto"
          ? isProvisionReady
          : !!targetEndpointId && targetEndpointId !== sourceEndpointId;
      case "network":
        // Network step is informational/optional — user can skip
        // every field. We only block on obviously-malformed input
        // (a non-empty IP/gateway that doesn't parse). Empty is
        // always allowed; AcF skips that sub-field server-side.
        return (
          (adaptIp === "" || isValidIp(adaptIp)) &&
          (adaptGateway === "" || isValidIp(adaptGateway))
        );
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
    targetMode,
    isProvisionReady,
    transferMethod,
    estimate,
    adaptIp,
    adaptGateway,
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

  // Build the adapt_config object from per-field state. Empty
  // sub-fields are dropped so the server-side optional-field rule
  // sees `null` rather than `""` (which would fail the `ip` rule
  // and reject the whole request).
  const adaptConfigPayload = useMemo(() => {
    if (resourceType !== "vm") return undefined;
    const dns = adaptDns
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const cfg: Record<string, unknown> = {};
    if (adaptHostname.trim()) cfg.hostname = adaptHostname.trim();
    if (adaptIp.trim() && isValidIp(adaptIp.trim())) cfg.ip = adaptIp.trim();
    if (adaptMask.trim()) cfg.mask = adaptMask.trim();
    if (adaptGateway.trim() && isValidIp(adaptGateway.trim())) cfg.gateway = adaptGateway.trim();
    if (dns.length > 0) cfg.dns = dns;
    return Object.keys(cfg).length > 0 ? cfg : undefined;
  }, [resourceType, adaptHostname, adaptIp, adaptMask, adaptGateway, adaptDns]);

  // Submit handler — initiate + confirm in one step
  const handleStartMigration = useCallback(async () => {
    initiateMutation.mutate(
      {
        source_endpoint_id: sourceEndpointId,
        ...(targetMode === "existing"
          ? { target_endpoint_id: targetEndpointId }
          : {
              auto_provision_destination: true,
              provision_specs: provisionSpecs,
            }),
        transfer_method: transferMethod,
        ...(adaptConfigPayload ? { adapt_config: adaptConfigPayload } : {}),
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
    targetMode,
    provisionSpecs,
    transferMethod,
    adaptConfigPayload,
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
          <div className="space-y-4">
            {resourceType === "vm" && (
              <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setTargetMode("existing")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    targetMode === "existing"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode("auto")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                    targetMode === "auto"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <Cloud size={14} />
                  Auto-provision
                </button>
              </div>
            )}
            {targetMode === "auto" ? (
              <AutoProvisionTargetStep
                value={provisionSpecs}
                onChange={setProvisionSpecs}
              />
            ) : (
              <EndpointStep
                label="Target"
                resourceType={resourceType}
                selectedEndpointId={targetEndpointId}
                onSelect={setTargetEndpointId}
                excludeEndpointId={sourceEndpointId}
              />
            )}
          </div>
        );
      case "network":
        return resourceType !== "vm" ? (
          <ModernCard>
            <div className="p-6 text-sm text-gray-600 dark:text-gray-300">
              Network reconfiguration only applies to VM migrations. Skipping —
              click <strong>Next</strong> to continue.
            </div>
          </ModernCard>
        ) : (
          <NetworkConfigStep
            targetMode={targetMode}
            hostname={adaptHostname}
            ip={adaptIp}
            mask={adaptMask}
            gateway={adaptGateway}
            dns={adaptDns}
            onHostnameChange={setAdaptHostname}
            onIpChange={setAdaptIp}
            onMaskChange={setAdaptMask}
            onGatewayChange={setAdaptGateway}
            onDnsChange={setAdaptDns}
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
            targetEndpointId={targetMode === "existing" ? targetEndpointId : undefined}
            autoProvisionDestination={targetMode === "auto"}
            provisionSpecs={targetMode === "auto" ? provisionSpecs : undefined}
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
    targetMode,
    provisionSpecs,
    transferMethod,
    adaptHostname,
    adaptIp,
    adaptMask,
    adaptGateway,
    adaptDns,
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
          {(targetEndpointId || targetMode === "auto") && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Target</span>
              <span className="max-w-[120px] truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                {targetMode === "auto"
                  ? "Auto-provision"
                  : `${targetEndpointId.slice(0, 8)}...`}
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
    targetMode,
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
                Target
              </p>
              <p className="mt-0.5 text-gray-900 dark:text-gray-100">
                {targetMode === "auto"
                  ? `${provisionSpecs.provider || "Provider"} / ${provisionSpecs.region || "region"}`
                  : targetEndpointId}
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
    targetEndpointId,
    targetMode,
    provisionSpecs,
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
