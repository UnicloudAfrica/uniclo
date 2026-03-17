import React, { useState, useEffect } from "react";
import { FlaskConical, Plus, Save } from "lucide-react";
import { ModernButton, ModernCard, StatusPill } from "@/shared/components/ui";
import ModernTable, { type Column } from "@/shared/components/ui/ModernTable";
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
          color={
            trial.status === "active"
              ? "success"
              : trial.status === "converted"
                ? "info"
                : trial.status === "expired"
                  ? "warning"
                  : "error"
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
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedTrial(trial); setShowExtendModal(true); }}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
            >
              Extend
            </button>
            <button
              onClick={() => { setSelectedTrial(trial); setShowCancelModal(true); }}
              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
            >
              Cancel
            </button>
          </div>
        ) : null,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* POC Configuration */}
      <ModernCard>
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <FlaskConical size={20} className="text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">POC Trial Configuration</h3>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
            </label>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Granted on {new Date(config.poc_trial_granted_at).toLocaleDateString()}
              {config.active_trials_count > 0 && ` · ${config.active_trials_count} active trial(s)`}
            </p>
          )}

          <div className="flex justify-end">
            <ModernButton
              onClick={handleSaveConfig}
              loading={updateConfig.isPending}
              icon={<Save size={16} />}
            >
              Save Configuration
            </ModernButton>
          </div>
        </div>
      </ModernCard>

      {/* Per-Product Overrides */}
      <ModernCard>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Per-Product Overrides</h3>
          <ModernButton variant="outline" size="sm" onClick={addOverride} icon={<Plus size={14} />}>
            Add Override
          </ModernButton>
        </div>
        <div className="p-6">
          {overrides.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No overrides configured. All product types use the default trial days.
            </p>
          ) : (
            <div className="space-y-3">
              {overrides.map((override, index) => (
                <div key={index} className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <select
                    value={override.product_type}
                    onChange={(e) => {
                      const updated = [...overrides];
                      updated[index].product_type = e.target.value;
                      setOverrides(updated);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Days"
                    min={1}
                    max={365}
                  />
                  <label className="flex items-center gap-2 text-sm">
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
                    className="ml-auto text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <ModernButton
                  variant="outline"
                  onClick={handleSaveOverrides}
                  loading={updateOverrides.isPending}
                  icon={<Save size={14} />}
                >
                  Save Overrides
                </ModernButton>
              </div>
            </div>
          )}
        </div>
      </ModernCard>

      {/* Active Trials */}
      <ModernCard>
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">POC Trials</h3>
        </div>
        <div className="p-6">
          <ModernTable<PocTrial> columns={trialColumns} data={trials} emptyMessage="No trials for this tenant" />
        </div>
      </ModernCard>

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
