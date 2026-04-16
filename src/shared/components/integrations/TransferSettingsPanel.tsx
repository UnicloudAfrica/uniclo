/**
 * TransferSettingsPanel — Manages bandwidth limits, schedule, compression, and retention
 * for a replication pair's transfer tuning settings.
 *
 * Uses useUpdateReplicationSettings mutation to persist changes via
 * PUT /integrations/replication-pairs/{pairId}/settings
 */
import React, { useState } from "react";
import { Gauge, Plus, Trash2, Save } from "lucide-react";
import { ModernButton } from "../ui";
import { useUpdateReplicationSettings } from "../../hooks/resources/integrationHooks";

interface TransferSettingsPanelProps {
  pairId: string;
  className?: string;
}

interface BandwidthScheduleEntry {
  start_hour: number;
  end_hour: number;
  limit_kbps: number;
}

const COMPRESSION_PROFILES = [
  { value: "none", label: "None" },
  { value: "fast", label: "Fast" },
  { value: "balanced", label: "Balanced" },
  { value: "max", label: "Max" },
] as const;

const inputClasses =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const selectClasses =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const TransferSettingsPanel: React.FC<TransferSettingsPanelProps> = ({ pairId, className = "" }) => {
  const updateSettings = useUpdateReplicationSettings();
  const [showForm, setShowForm] = useState(false);

  // Transfer tuning fields
  const [baseIntervalMinutes, setBaseIntervalMinutes] = useState<number | "">("");
  const [bandwidthLimitKbps, setBandwidthLimitKbps] = useState<number>(0);
  const [bandwidthSchedule, setBandwidthSchedule] = useState<BandwidthScheduleEntry[]>([]);
  const [compressionProfile, setCompressionProfile] = useState<string>("balanced");
  const [syncRetentionDays, setSyncRetentionDays] = useState<number>(30);

  // New schedule row inputs
  const [newStartHour, setNewStartHour] = useState<number>(0);
  const [newEndHour, setNewEndHour] = useState<number>(6);
  const [newLimitKbps, setNewLimitKbps] = useState<number>(0);

  const handleAddScheduleRow = () => {
    setBandwidthSchedule([
      ...bandwidthSchedule,
      { start_hour: newStartHour, end_hour: newEndHour, limit_kbps: newLimitKbps },
    ]);
    setNewStartHour(0);
    setNewEndHour(6);
    setNewLimitKbps(0);
  };

  const handleRemoveScheduleRow = (idx: number) => {
    setBandwidthSchedule(bandwidthSchedule.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const settings: Record<string, unknown> = {
      bandwidth_limit_kbps: bandwidthLimitKbps,
      compression_profile: compressionProfile,
      sync_retention_days: syncRetentionDays,
    };
    if (baseIntervalMinutes !== "" && baseIntervalMinutes > 0) {
      settings.base_interval_minutes = baseIntervalMinutes;
    }
    if (bandwidthSchedule.length > 0) {
      settings.bandwidth_schedule = bandwidthSchedule;
    }
    updateSettings.mutate({ pairId, settings });
  };

  const formatHour = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:00 ${suffix}`;
  };

  const formatKbps = (kbps: number) => {
    if (kbps === 0) return "Unlimited";
    if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} Mbps`;
    return `${kbps} Kbps`;
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Gauge size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Transfer Settings</h3>
        </div>
        {!showForm && (
          <ModernButton variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Configure
          </ModernButton>
        )}
      </div>

      <div className="space-y-4 p-5">
        {!showForm ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">Base Sync Interval</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {baseIntervalMinutes ? `${baseIntervalMinutes} min` : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">Bandwidth Limit</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatKbps(bandwidthLimitKbps)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">Compression</span>
              <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                {compressionProfile}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sync Retention</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {syncRetentionDays} days
              </span>
            </div>
            {bandwidthSchedule.length > 0 && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Bandwidth Schedule</p>
                <div className="space-y-1">
                  {bandwidthSchedule.map((row, idx) => (
                    <p key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                      {formatHour(row.start_hour)} – {formatHour(row.end_hour)}: {formatKbps(row.limit_kbps)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {/* Base Sync Interval */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Base Sync Interval (minutes)
              </label>
              <input
                type="number"
                value={baseIntervalMinutes}
                onChange={(e) => setBaseIntervalMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                max={1440}
                placeholder="e.g. 15"
                className={inputClasses}
              />
              <p className="mt-1 text-xs text-gray-400">
                Adaptive scheduling will auto-adjust from this base value
              </p>
            </div>

            {/* Bandwidth Limit */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Bandwidth Limit (Kbps)
              </label>
              <input
                type="number"
                value={bandwidthLimitKbps}
                onChange={(e) => setBandwidthLimitKbps(Number(e.target.value))}
                min={0}
                placeholder="0 = unlimited"
                className={inputClasses}
              />
              <p className="mt-1 text-xs text-gray-400">Set to 0 for unlimited bandwidth</p>
            </div>

            {/* Compression Profile */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Compression Profile
              </label>
              <select
                value={compressionProfile}
                onChange={(e) => setCompressionProfile(e.target.value)}
                className={selectClasses}
              >
                {COMPRESSION_PROFILES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sync Retention Days */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Sync Retention (days)
              </label>
              <input
                type="number"
                value={syncRetentionDays}
                onChange={(e) => setSyncRetentionDays(Number(e.target.value))}
                min={1}
                max={3650}
                className={inputClasses}
              />
            </div>

            {/* Bandwidth Schedule */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Bandwidth Schedule
              </label>
              {bandwidthSchedule.length > 0 && (
                <div className="mb-3 space-y-2">
                  {bandwidthSchedule.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatHour(row.start_hour)} – {formatHour(row.end_hour)}: {formatKbps(row.limit_kbps)}
                      </span>
                      <button
                        onClick={() => handleRemoveScheduleRow(idx)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Start</label>
                  <select
                    value={newStartHour}
                    onChange={(e) => setNewStartHour(Number(e.target.value))}
                    className={selectClasses}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {formatHour(i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">End</label>
                  <select
                    value={newEndHour}
                    onChange={(e) => setNewEndHour(Number(e.target.value))}
                    className={selectClasses}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {formatHour(i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Limit (Kbps)</label>
                  <input
                    type="number"
                    value={newLimitKbps}
                    onChange={(e) => setNewLimitKbps(Number(e.target.value))}
                    min={0}
                    placeholder="0 = unlimited"
                    className={inputClasses}
                  />
                </div>
                <ModernButton variant="outline" size="sm" onClick={handleAddScheduleRow}>
                  <Plus size={14} />
                </ModernButton>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={updateSettings.isPending}
              >
                <Save size={14} />
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </ModernButton>
              <ModernButton variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </ModernButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferSettingsPanel;
