/**
 * DatabaseCreationWizard — Multi-step wizard for creating a managed database.
 *
 * Steps: Engine → Configure → Review → Payment (conditional) → Success
 * Uses ProvisioningWizardLayout + PaymentModal.
 */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Server,
  Shield,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Info,
} from "lucide-react";
import ProvisioningWizardLayout from "@/shared/components/instance-wizard/ProvisioningWizardLayout";
import PaymentModal from "@/shared/components/ui/payment/PaymentModal";
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import {
  useDatabaseProvisioningLogic,
  ENGINE_METADATA,
  PLAN_SPECS,
  getRegionLabel,
} from "@/hooks/useDatabaseProvisioningLogic";
import type { DatabaseEngine, PlanSize } from "@/types/managedDatabase";
import { sanitizeProviderLabel } from "@/utils/sanitizeProviderLabel";

interface DatabaseCreationWizardProps {
  context: "admin" | "tenant" | "client";
  listPath?: string;
}

const PLAN_SIZES: PlanSize[] = ["micro", "small", "medium", "large", "xlarge"];
const ENGINE_LIST: DatabaseEngine[] = ["mongodb", "postgresql", "mysql", "redis"];

// ─── Engine Selection Step ───────────────────────────────────────────

const EngineStep: React.FC<{
  selectedEngine: string;
  onSelect: (engine: DatabaseEngine) => void;
  engines: typeof ENGINE_METADATA;
}> = ({ selectedEngine, onSelect, engines }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Select Database Engine
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Choose the database engine that best fits your application needs.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {ENGINE_LIST.map((engine) => {
        const meta = engines[engine];
        const isSelected = selectedEngine === engine;
        return (
          <button
            key={engine}
            onClick={() => onSelect(engine)}
            className={`relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <EngineIcon engine={engine} size={32} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{meta.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {meta.description}
              </div>
              <div className="text-xs text-gray-400 mt-1">Versions: {meta.versions.join(", ")}</div>
            </div>
            {isSelected && (
              <CheckCircle2 className="absolute top-3 right-3 text-blue-500" size={20} />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Version Selector ─────────────────────────────────────────────

const VersionSelector: React.FC<{
  versions: string[];
  selected: string;
  onChange: (v: string) => void;
}> = ({ versions, selected, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Engine Version
    </label>
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      {versions.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  </div>
);

// ─── Configure Step ──────────────────────────────────────────────────

const ConfigureStep: React.FC<{
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  updateForm: ReturnType<typeof useDatabaseProvisioningLogic>["updateForm"];
  selectedEngineMeta: ReturnType<typeof useDatabaseProvisioningLogic>["selectedEngineMeta"];
  projects: { value: number; label: string }[];
  regions: { value: string; label: string }[];
  availabilityZones: { value: string; label: string }[];
  maxReplicaCount: number;
  replicaAvailableAzs: { value: string; label: string }[];
  toggleReplicaAz: (azCode: string) => void;
  context: "admin" | "tenant" | "client";
  profileCountry: string;
}> = ({ form, updateForm, selectedEngineMeta, projects, regions, availabilityZones, maxReplicaCount, replicaAvailableAzs, toggleReplicaAz, context, profileCountry }) => (
  <div className="space-y-6">
    {/* Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Database Name <span className="text-gray-400">(optional)</span>
      </label>
      <input
        type="text"
        value={form.name}
        onChange={(e) => updateForm({ name: e.target.value })}
        placeholder="my-database"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>

    {/* Version */}
    {selectedEngineMeta && (
      <VersionSelector
        versions={selectedEngineMeta.versions}
        selected={form.engineVersion}
        onChange={(v) => updateForm({ engineVersion: v })}
      />
    )}

    {/* Plan Size */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Plan Size
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PLAN_SIZES.map((size) => {
          const spec = PLAN_SPECS[size];
          const isSelected = form.planSize === size;
          return (
            <button
              key={size}
              onClick={() => updateForm({ planSize: size })}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {spec.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{spec.vcpu} vCPU</div>
              <div className="text-xs text-gray-500">
                {spec.memoryMb >= 1024
                  ? `${Math.round(spec.memoryMb / 1024)} GB RAM`
                  : `${spec.memoryMb} MB RAM`}
              </div>
              <div className="text-xs text-gray-500">{spec.storageGb} GB SSD</div>
            </button>
          );
        })}
      </div>
    </div>

    {/* Region */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Region
      </label>
      <select
        value={form.region}
        onChange={(e) => updateForm({ region: e.target.value, availabilityZone: "" })}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select region...</option>
        {regions.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>

    {/* Availability Zone */}
    {form.region && availabilityZones.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Availability Zone
        </label>
        <select
          value={form.availabilityZone}
          onChange={(e) => updateForm({ availabilityZone: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Auto-select (recommended)</option>
          {availabilityZones.map((az) => (
            <option key={az.value} value={az.value}>
              {az.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {availabilityZones.length} availability zone{availabilityZones.length !== 1 ? "s" : ""} available in this region.
        </p>
      </div>
    )}

    {/* Read Replicas — select AZs to place replicas in */}
    {form.region && form.availabilityZone && replicaAvailableAzs.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Read Replicas
        </label>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Select availability zones to place read replicas. Each selected AZ gets one replica for high availability.
        </p>
        <div className="space-y-2">
          {replicaAvailableAzs.map((az) => {
            const isSelected = form.replicaAzs.includes(az.value);
            const isDisabled = !isSelected && form.replicaAzs.length >= maxReplicaCount;
            return (
              <button
                key={az.value}
                onClick={() => toggleReplicaAz(az.value)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : isDisabled
                      ? "border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                  isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{az.label}</div>
                </div>
              </button>
            );
          })}
        </div>
        {form.replicaAzs.length > 0 && (
          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            {form.replicaAzs.length} read replica{form.replicaAzs.length !== 1 ? "s" : ""} will be created ({form.replicaCount} total nodes including primary)
          </p>
        )}
      </div>
    )}

    {/* Project (optional) */}
    {projects.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project <span className="text-gray-400">(optional)</span>
        </label>
        <select
          value={form.projectId ?? ""}
          onChange={(e) =>
            updateForm({ projectId: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    )}

    {/* Billing Period */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Billing Period
      </label>
      <select
        value={form.months}
        onChange={(e) => updateForm({ months: Number(e.target.value) })}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value={1}>1 month</option>
        <option value={3}>3 months</option>
        <option value={6}>6 months</option>
        <option value={12}>12 months</option>
        <option value={24}>24 months</option>
      </select>
    </div>

    {/* Backup Toggle */}
    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-gray-500" />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Automated Backups
          </div>
          <div className="text-xs text-gray-500">Daily backups with point-in-time recovery</div>
        </div>
      </div>
      <button
        onClick={() => updateForm({ backupEnabled: !form.backupEnabled })}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          form.backupEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            form.backupEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>

    {/* DR Toggle — Disabled / Coming Soon */}
    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 opacity-60">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-gray-400" />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Disaster Recovery
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Coming soon
            </span>
          </div>
          <div className="text-xs text-gray-500">Cross-region DR replication for business continuity</div>
        </div>
      </div>
      <button
        disabled
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
      >
        <span className="inline-block h-4 w-4 rounded-full bg-white translate-x-1" />
      </button>
    </div>

    {/* ── Workflow & Assignment ── */}

    {/* Customer Context Selector */}
    {context !== "client" && (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Customer Context
        </label>
        <div className="flex gap-3">
          {(context === "admin"
            ? (["tenant", "user", "unassigned"] as const)
            : (["tenant", "user"] as const)
          ).map((ctx) => {
            const labels: Record<string, string> = { tenant: "Tenant", user: context === "tenant" ? "Client" : "User", unassigned: "Unassigned" };
            return (
              <label
                key={ctx}
                className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm cursor-pointer transition-all ${
                  form.customerContext === ctx
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="customerContext"
                  value={ctx}
                  checked={form.customerContext === ctx}
                  onChange={() => updateForm({ customerContext: ctx, assignedTenantId: null, assignedClientId: null })}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">{labels[ctx]}</span>
              </label>
            );
          })}
        </div>
      </div>
    )}

    {/* Billing Country */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Billing Country
      </label>
      {context === "admin" ? (
        <input
          type="text"
          value={form.billingCountry}
          onChange={(e) => updateForm({ billingCountry: e.target.value })}
          placeholder="e.g. US, NG, GB"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
            {form.billingCountry || profileCountry || "Not set"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">(Default from profile)</span>
        </div>
      )}
    </div>
  </div>
);

// ─── Review Step Content ─────────────────────────────────────────────

const ReviewContent: React.FC<{
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  regions: { value: string; label: string }[];
  quoteResult: ReturnType<typeof useDatabaseProvisioningLogic>["quoteResult"];
  pricingSummary: ReturnType<typeof useDatabaseProvisioningLogic>["pricingSummary"];
  isQuoteLoading: boolean;
  onCreateOrder: () => void;
  isSubmitting: boolean;
  submissionErrorMessage: string | null;
  onBack: () => void;
}> = ({
  form,
  regions,
  quoteResult,
  pricingSummary,
  isQuoteLoading,
  onCreateOrder,
  isSubmitting,
  submissionErrorMessage,
  onBack,
}) => (
  <div className="mx-auto max-w-2xl space-y-6">
    {/* Configuration Summary */}
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Database size={18} />
          Database Configuration
        </h3>
      </div>
      <div className="p-5 space-y-3">
        <SummaryRow
          label="Engine"
          value={form.engine ? getEngineLabel(form.engine as DatabaseEngine) : "—"}
        />
        <SummaryRow label="Version" value={form.engineVersion || "—"} />
        <SummaryRow
          label="Plan"
          value={
            form.planSize ? PLAN_SPECS[form.planSize as PlanSize]?.label || form.planSize : "—"
          }
        />
        {form.planSize && (
          <SummaryRow
            label="Resources"
            value={`${PLAN_SPECS[form.planSize as PlanSize]?.vcpu} vCPU · ${Math.round((PLAN_SPECS[form.planSize as PlanSize]?.memoryMb || 0) / 1024)} GB RAM · ${PLAN_SPECS[form.planSize as PlanSize]?.storageGb} GB SSD`}
          />
        )}
        <SummaryRow label="Region" value={getRegionLabel(regions, form.region) || "—"} />
        {form.availabilityZone && (
          <SummaryRow label="Availability Zone" value={sanitizeProviderLabel(form.availabilityZone)} />
        )}
        {form.replicaCount > 1 && (
          <SummaryRow
            label="Read Replicas"
            value={`${form.replicaCount - 1} — ${form.replicaAzs.map(sanitizeProviderLabel).join(", ")}`}
          />
        )}
        <SummaryRow
          label="Billing Period"
          value={`${form.months} month${form.months > 1 ? "s" : ""}`}
        />
        <SummaryRow label="Backups" value={form.backupEnabled ? "Enabled" : "Disabled"} />
        {form.name && <SummaryRow label="Name" value={form.name} />}
      </div>
    </div>

    {/* Pricing */}
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pricing Breakdown</h3>
      </div>
      <div className="p-5">
        {isQuoteLoading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            Calculating pricing...
          </div>
        ) : quoteResult ? (
          <div className="space-y-3">
            {quoteResult.lines.map((line, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{line.name}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {quoteResult.currency} {line.total.toFixed(2)}
                </span>
              </div>
            ))}
            {quoteResult.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Discount{quoteResult.discount_label ? ` (${quoteResult.discount_label})` : ""}
                </span>
                <span>
                  -{quoteResult.currency} {quoteResult.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">
                  {pricingSummary.currency} {pricingSummary.subtotal.toFixed(2)}
                </span>
              </div>
              {pricingSummary.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium">
                    {pricingSummary.currency} {pricingSummary.tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span>
                  {pricingSummary.currency} {pricingSummary.grandTotal.toFixed(2)}
                </span>
              </div>
              {pricingSummary.monthlyCost > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Monthly cost</span>
                  <span>
                    {pricingSummary.currency} {pricingSummary.monthlyCost.toFixed(2)}/mo
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600 py-4">
            <Info size={16} />
            Pricing will be calculated when you create the order.
          </div>
        )}
      </div>
    </div>

    {/* Error */}
    {submissionErrorMessage && (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        {submissionErrorMessage}
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <button
        onClick={onCreateOrder}
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Creating Order...
          </>
        ) : (
          <>
            Create Database
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  </div>
);

// ─── Success Content ─────────────────────────────────────────────────

const SuccessContent: React.FC<{
  submissionResult: ReturnType<typeof useDatabaseProvisioningLogic>["submissionResult"];
  regions: { value: string; label: string }[];
  onViewDatabases: () => void;
}> = ({ submissionResult, regions, onViewDatabases }) => {
  const db = submissionResult?.data?.database;

  return (
    <div className="mx-auto max-w-lg text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="text-green-600 dark:text-green-400" size={48} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Database Created Successfully
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Your managed database is being provisioned. This typically takes 5-10 minutes.
        </p>
      </div>
      {db && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-left space-y-3">
          <SummaryRow label="Identifier" value={db.identifier} copyable />
          <SummaryRow label="Engine" value={`${getEngineLabel(db.engine)} v${db.engine_version}`} />
          <SummaryRow label="Plan" value={db.plan_size} />
          <SummaryRow label="Region" value={getRegionLabel(regions, db.region)} />
          {db.replica_count > 1 && (
            <SummaryRow label="Replicas" value={`${db.replica_count - 1} read replica(s)`} />
          )}
          <SummaryRow label="Status" value={db.status} />
        </div>
      )}
      <button
        onClick={onViewDatabases}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Database size={16} />
        View Databases
      </button>
    </div>
  );
};

// ─── Sidebar (Pricing Summary) ──────────────────────────────────────

const WizardSidebar: React.FC<{
  form: ReturnType<typeof useDatabaseProvisioningLogic>["form"];
  regions: { value: string; label: string }[];
  quoteResult: ReturnType<typeof useDatabaseProvisioningLogic>["quoteResult"];
  pricingSummary: ReturnType<typeof useDatabaseProvisioningLogic>["pricingSummary"];
}> = ({ form, regions, quoteResult, pricingSummary }) => (
  <div className="space-y-4">
    {/* Selected Configuration */}
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Server size={16} />
        Configuration
      </h4>
      <div className="space-y-2 text-sm">
        {form.engine && (
          <div className="flex items-center gap-2">
            <EngineIcon engine={form.engine as DatabaseEngine} size={14} />
            <span className="text-gray-700 dark:text-gray-300">
              {getEngineLabel(form.engine as DatabaseEngine)} {form.engineVersion}
            </span>
          </div>
        )}
        {form.planSize && (
          <div className="text-gray-600 dark:text-gray-400">
            {PLAN_SPECS[form.planSize as PlanSize]?.label} —{" "}
            {PLAN_SPECS[form.planSize as PlanSize]?.vcpu} vCPU,{" "}
            {Math.round((PLAN_SPECS[form.planSize as PlanSize]?.memoryMb || 0) / 1024)} GB RAM
          </div>
        )}
        {form.region && (
          <div className="text-gray-600 dark:text-gray-400">
            Region: {getRegionLabel(regions, form.region)}
          </div>
        )}
        {form.replicaCount > 1 && (
          <div className="text-gray-600 dark:text-gray-400">
            Replicas: {form.replicaCount - 1} ×{" "}
            {form.replicaAzs.map(sanitizeProviderLabel).join(", ")}
          </div>
        )}
      </div>
    </div>

    {/* Pricing Estimate */}
    {(quoteResult || pricingSummary.grandTotal > 0) && (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Estimated Cost
        </h4>
        <div className="space-y-2">
          {pricingSummary.subtotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 dark:text-gray-100">
                {pricingSummary.currency} {pricingSummary.subtotal.toFixed(2)}
              </span>
            </div>
          )}
          {pricingSummary.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>
                {pricingSummary.currency} {pricingSummary.tax.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>Total</span>
            <span>
              {pricingSummary.currency} {pricingSummary.grandTotal.toFixed(2)}
            </span>
          </div>
          {pricingSummary.monthlyCost > 0 && (
            <div className="text-xs text-gray-500 text-right">
              {pricingSummary.currency} {pricingSummary.monthlyCost.toFixed(2)}/month
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// ─── Helper: Summary Row ─────────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  copyable?: boolean;
}> = ({ label, value, copyable }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
      {copyable && (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Copy size={12} />
        </button>
      )}
    </div>
  </div>
);

// ─── Main Wizard ─────────────────────────────────────────────────────

const DatabaseCreationWizard: React.FC<DatabaseCreationWizardProps> = ({
  listPath = "databases",
}) => {
  const navigate = useNavigate();
  const logic = useDatabaseProvisioningLogic();

  // Fetch quote when entering review step
  useEffect(() => {
    if (logic.currentStepId === "review" && !logic.quoteResult && !logic.isQuoteLoading) {
      logic.fetchQuote();
    }
  }, [logic.currentStepId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build main content based on step
  const mainContent = (() => {
    switch (logic.currentStepId) {
      case "engine":
        return (
          <div className="space-y-6">
            <EngineStep
              selectedEngine={logic.form.engine}
              onSelect={logic.selectEngine}
              engines={logic.engines}
            />
            <div className="flex justify-end">
              <button
                onClick={logic.nextStep}
                disabled={!logic.isEngineStepValid}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      case "configure":
        return (
          <div className="space-y-6">
            <ConfigureStep
              form={logic.form}
              updateForm={logic.updateForm}
              selectedEngineMeta={logic.selectedEngineMeta}
              projects={logic.projects}
              regions={logic.regions}
              availabilityZones={logic.availabilityZones}
              maxReplicaCount={logic.maxReplicaCount}
              replicaAvailableAzs={logic.replicaAvailableAzs}
              toggleReplicaAz={logic.toggleReplicaAz}
              context={logic.context}
              profileCountry={logic.profileCountry}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={logic.prevStep}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                onClick={logic.nextStep}
                disabled={!logic.isConfigureStepValid}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review & Create
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="mx-auto max-w-2xl">
            <PaymentModal
              isOpen={true}
              onClose={() => logic.setActiveStep(2)} // Go back to review
              transactionData={{
                data: logic.orderReceipt as Record<string, unknown> & {
                  transaction?: Record<string, unknown>;
                  order?: Record<string, unknown>;
                  payment?: Record<string, unknown>;
                },
              }}
              onPaymentComplete={logic.handlePaymentCompleted}
              mode="inline"
              pricingSummary={{
                subtotal: logic.pricingSummary.subtotal,
                tax: logic.pricingSummary.tax,
                gatewayFees: logic.pricingSummary.gatewayFees,
                grandTotal: logic.pricingSummary.grandTotal,
                currency: logic.pricingSummary.currency,
              }}
            />
          </div>
        );

      default:
        return null;
    }
  })();

  const sidebarContent =
    logic.currentStepId === "engine" || logic.currentStepId === "configure" ? (
      <WizardSidebar
        form={logic.form}
        regions={logic.regions}
        quoteResult={logic.quoteResult}
        pricingSummary={logic.pricingSummary}
      />
    ) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(listPath)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create Managed Database
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Deploy a fully managed database cluster
          </p>
        </div>
      </div>

      <ProvisioningWizardLayout
        steps={[...logic.steps]}
        activeStep={logic.activeStep}
        onStepChange={logic.setActiveStep}
        currentStepId={logic.currentStepId}
        reviewStepId="review"
        successStepId="success"
        mainContent={mainContent}
        sidebarContent={sidebarContent}
        reviewContent={
          <ReviewContent
            form={logic.form}
            regions={logic.regions}
            quoteResult={logic.quoteResult}
            pricingSummary={logic.pricingSummary}
            isQuoteLoading={logic.isQuoteLoading}
            onCreateOrder={logic.handleCreateOrder}
            isSubmitting={logic.isSubmitting}
            submissionErrorMessage={logic.submissionErrorMessage}
            onBack={logic.prevStep}
          />
        }
        successContent={
          <SuccessContent
            submissionResult={logic.submissionResult}
            regions={logic.regions}
            onViewDatabases={() => navigate(listPath)}
          />
        }
      />
    </div>
  );
};

export default DatabaseCreationWizard;
