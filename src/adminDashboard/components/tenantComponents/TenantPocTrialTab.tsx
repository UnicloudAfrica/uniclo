import React, { useState, useEffect } from "react";
import { FlaskConical, Layers, ListChecks, Plus, Save } from "lucide-react";
import { ModernButton, StatusPill, SkeletonCard } from "@/shared/components/ui";
import ModernTable, { type Column } from "@/shared/components/ui/ModernTable";
import MobileRecordCards from "@/shared/components/ui/MobileRecordCards";
import ModernInput from "@/shared/components/ui/ModernInput";
import {
  useFetchTenantPocConfig,
  useUpdateTenantPocConfig,
  useUpdateTenantPocOverrides,
  useFetchTenantPocTrials,
} from "@/hooks/adminHooks/pocTrialHooks";
import type { PocTrial, PocOverride } from "@/types/pocTrial";
import { PRODUCT_TYPES } from "@/types/pocTrial";
import ExtendTrialModal from "../pocTrialComponents/ExtendTrialModal";
import CancelTrialModal from "../pocTrialComponents/CancelTrialModal";
import ToastUtils from "@/utils/toastUtil";

interface TenantPocTrialTabProps {
  tenantId: string;
}

const SectionCard = ({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--theme-color-10)", color: "var(--theme-color)" }}
        >
          {icon}
        </span>
        <h3 className="min-w-0 break-words text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </div>
);

const TenantPocTrialTab: React.FC<TenantPocTrialTabProps> = ({ tenantId }) => {
  const { data: config, isLoading } = useFetchTenantPocConfig(tenantId);
  const { data: trialsResponse } = useFetchTenantPocTrials(tenantId);
  const updateConfig = useUpdateTenantPocConfig();
  const updateOverrides = useUpdateTenantPocOverrides();

  const [enabled, setEnabled] = useState(false);
  const [trialDays, setTrialDays] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [overrides, setOverrides] = useState<
    Array<{ product_type: string; trial_days: number; enabled: boolean }>
  >([]);
  const [selectedTrial, setSelectedTrial] = useState<PocTrial | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (config) {
      setEnabled(config.poc_trial_enabled);
      setTrialDays(config.poc_trial_days?.toString() ?? "");
      setExpiresAt(config.poc_trial_expires_at?.split("T")[0] ?? "");
      setOverrides(
        config.overrides?.map((o: PocOverride) => ({
          product_type: o.product_type,
          trial_days: o.trial_days,
          enabled: o.enabled,
        })) ?? []
      );
    }
  }, [config]);

  const handleSaveConfig = () => {
    updateConfig.mutate(
      {
        tenantId,
        data: {
          poc_trial_enabled: enabled,
          poc_trial_days: trialDays ? parseInt(trialDays) : null,
          poc_trial_expires_at: expiresAt || null,
        },
      },
      {
        onSuccess: () => ToastUtils.success("POC trial configuration saved"),
        onError: () => ToastUtils.error("Failed to save configuration"),
      }
    );
  };

  const handleSaveOverrides = () => {
    if (overrides.length === 0) return;
    updateOverrides.mutate(
      { tenantId, overrides },
      {
        onSuccess: () => ToastUtils.success("Overrides saved"),
        onError: () => ToastUtils.error("Failed to save overrides"),
      }
    );
  };

  const addOverride = () => {
    const usedTypes = overrides.map((o) => o.product_type);
    const available = PRODUCT_TYPES.filter((t) => !usedTypes.includes(t.value));
    if (available.length === 0) return;
    setOverrides([...overrides, { product_type: available[0].value, trial_days: 30, enabled: true }]);
  };

  const removeOverride = (index: number) => {
    setOverrides(overrides.filter((_, i) => i !== index));
  };

  const trials = trialsResponse?.data ?? [];

  const trialColumns: Column<PocTrial>[] = [
    { key: "resource_name", header: "Resource" },
    { key: "product_type_label", header: "Type" },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, trial: PocTrial) => (
        <StatusPill
          status={trial.status}
          tone={
            trial.status === "active"
              ? "success"
              : trial.status === "converted"
                ? "info"
                : trial.status === "expired"
                  ? "warning"
                  : "danger"
          }
        />
      ),
    },
    { key: "trial_days", header: "Days" },
    {
      key: "trial_ends_at",
      header: "Expires",
      render: (_: unknown, trial: PocTrial) =>
        trial.trial_ends_at ? new Date(trial.trial_ends_at).toLocaleDateString() : "—",
    },
    { key: "days_remaining", header: "Remaining" },
    {
      key: "actions",
      header: "",
      render: (_: unknown, trial: PocTrial) =>
        trial.status === "active" ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedTrial(trial); setShowExtendModal(true); }}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Extend
            </button>
            <button
              onClick={() => { setSelectedTrial(trial); setShowCancelModal(true); }}
              className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
            >
              Cancel
            </button>
          </div>
        ) : null,
    },
  ];

  if (isLoading) {
    return <SkeletonCard className="my-4" />;
  }

  return (
    <div className="space-y-6">
      {/* POC Configuration */}
      <SectionCard icon={<FlaskConical size={16} />} title="POC Trial Configuration">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
            </label>
            <span className="min-w-0 text-sm font-medium text-gray-900 dark:text-gray-200">
              Enable POC Trial Capability
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModernInput
              label="Default Trial Days"
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              placeholder="e.g. 30"
              min={1}
              max={365}
            />
            <ModernInput
              label="POC Capability Expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {config?.poc_trial_granted_at && (
            <p className="break-words text-sm text-gray-500 dark:text-gray-400">
              Granted on {new Date(config.poc_trial_granted_at).toLocaleDateString()}
              {config.active_trials_count > 0 && ` · ${config.active_trials_count} active trial(s)`}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <ModernButton
              onClick={handleSaveConfig}
              loading={updateConfig.isPending}
              leftIcon={<Save size={16} />}
            >
              Save Configuration
            </ModernButton>
          </div>
        </div>
      </SectionCard>

      {/* Per-Product Overrides */}
      <SectionCard
        icon={<Layers size={16} />}
        title="Per-Product Overrides"
        action={
          <ModernButton variant="outline" size="sm" onClick={addOverride} leftIcon={<Plus size={14} />}>
            Add Override
          </ModernButton>
        }
      >
        {overrides.length === 0 ? (
          <p className="break-words text-sm text-gray-500 dark:text-gray-400">
            No overrides configured. All product types use the default trial days.
          </p>
        ) : (
          <div className="space-y-3">
            {overrides.map((override, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
              >
                <select
                  value={override.product_type}
                  onChange={(e) => {
                    const updated = [...overrides];
                    updated[index].product_type = e.target.value;
                    setOverrides(updated);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:flex-none"
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={override.trial_days}
                  onChange={(e) => {
                    const updated = [...overrides];
                    updated[index].trial_days = parseInt(e.target.value) || 0;
                    setOverrides(updated);
                  }}
                  className="w-24 shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Days"
                  min={1}
                  max={365}
                />
                <label className="flex shrink-0 items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={override.enabled}
                    onChange={(e) => {
                      const updated = [...overrides];
                      updated[index].enabled = e.target.checked;
                      setOverrides(updated);
                    }}
                    className="rounded border-gray-300"
                  />
                  Enabled
                </label>
                <button
                  onClick={() => removeOverride(index)}
                  className="ml-auto shrink-0 text-sm text-red-500 hover:text-red-700 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <ModernButton
                variant="outline"
                onClick={handleSaveOverrides}
                loading={updateOverrides.isPending}
                leftIcon={<Save size={14} />}
              >
                Save Overrides
              </ModernButton>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Active Trials */}
      <SectionCard icon={<ListChecks size={16} />} title="POC Trials">
        {/* Desktop / tablet: table */}
        <div className="hidden overflow-x-auto sm:block">
          <ModernTable<PocTrial> columns={trialColumns} data={trials} emptyMessage="No trials for this tenant" />
        </div>

        {/* Mobile: one card per row */}
        <div className="sm:hidden">
          <MobileRecordCards<PocTrial>
            rows={trials}
            getKey={(trial, index) => trial.id ?? index}
            title={(trial) => trial.resource_name}
            titleWrap="break-words"
            status={(trial) => (
              <StatusPill
                status={trial.status}
                tone={
                  trial.status === "active"
                    ? "success"
                    : trial.status === "converted"
                      ? "info"
                      : trial.status === "expired"
                        ? "warning"
                        : "danger"
                }
              />
            )}
            fields={[
              { label: "Type", render: (trial) => trial.product_type_label },
              { label: "Days", render: (trial) => trial.trial_days },
              {
                label: "Expires",
                render: (trial) =>
                  trial.trial_ends_at
                    ? new Date(trial.trial_ends_at).toLocaleDateString()
                    : "—",
              },
              { label: "Remaining", render: (trial) => trial.days_remaining },
            ]}
            action={(trial) =>
              trial.status === "active" ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setSelectedTrial(trial);
                      setShowExtendModal(true);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Extend
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTrial(trial);
                      setShowCancelModal(true);
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : null
            }
            emptyMessage="No trials for this tenant"
          />
        </div>
      </SectionCard>

      {selectedTrial && (
        <>
          <ExtendTrialModal
            isOpen={showExtendModal}
            onClose={() => { setShowExtendModal(false); setSelectedTrial(null); }}
            trial={selectedTrial}
          />
          <CancelTrialModal
            isOpen={showCancelModal}
            onClose={() => { setShowCancelModal(false); setSelectedTrial(null); }}
            trial={selectedTrial}
          />
        </>
      )}
    </div>
  );
};

export default TenantPocTrialTab;
