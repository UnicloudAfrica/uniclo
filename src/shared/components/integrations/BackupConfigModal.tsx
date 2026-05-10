/**
 * BackupConfigModal — Configure and enable backup for a resource.
 *
 * Allows the user to pick a backup schedule, type, retention period,
 * and — critically — choose where the backup is stored (destination).
 *
 * Responsive: full-width on mobile, centered modal on desktop.
 */
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ModernButton } from "../ui";
import {
  useFetchDestinations,
  DESTINATION_TYPE_LABELS,
} from "@/shared/hooks/resources/integrationHooks";
import type { IntegrationDestination } from "@/shared/hooks/resources/integrationHooks";

interface BackupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: BackupConfig) => void;
  isSubmitting?: boolean;
  resourceName?: string;
  integrationKey?: string;
  resourceRegion?: string;
}

export interface BackupConfig {
  schedule_type: string;
  cron_expression?: string;
  backup_type: string;
  retention_days: number;
  destination_id?: number;
}

const SCHEDULE_OPTIONS = [
  { value: "daily", label: "Daily", cron: "0 2 * * *", description: "Every day at 2:00 AM" },
  { value: "weekly", label: "Weekly", cron: "0 2 * * 0", description: "Every Sunday at 2:00 AM" },
  { value: "hourly", label: "Hourly", cron: "0 * * * *", description: "Every hour on the hour" },
];

const RETENTION_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const BackupConfigModal: React.FC<BackupConfigModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  resourceName,
  integrationKey = "anycloudflow",
  resourceRegion,
}) => {
  const [scheduleType, setScheduleType] = useState("daily");
  const [backupType, setBackupType] = useState("full");
  const [retentionDays, setRetentionDays] = useState(30);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | undefined>(undefined);

  const { data: allDestinations = [], isLoading: loadingDestinations } = useFetchDestinations(
    integrationKey,
    { enabled: isOpen },
  );

  const activeDestinations = (allDestinations as IntegrationDestination[]).filter(
    (d) => d.is_active,
  );

  const regionDestinations = resourceRegion
    ? activeDestinations.filter((d) => d.source_region === resourceRegion)
    : activeDestinations;

  const defaultDest = regionDestinations.find((d) => d.is_default);

  useEffect(() => {
    if (defaultDest && !selectedDestinationId) {
      setSelectedDestinationId(defaultDest.id);
    }
  }, [defaultDest, selectedDestinationId]);

  if (!isOpen) return null;

  const selectedSchedule = SCHEDULE_OPTIONS.find((s) => s.value === scheduleType);

  const handleSubmit = () => {
    onSubmit({
      schedule_type: scheduleType,
      cron_expression: selectedSchedule?.cron,
      backup_type: backupType,
      retention_days: retentionDays,
      destination_id: selectedDestinationId,
    });
  };

  const noDestinations = !loadingDestinations && regionDestinations.length === 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-gray-900/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-md sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-2xl">🛟</span>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Set up safety backups
              </h3>
              {resourceName ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">For {resourceName}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">Pick where + when. We'll handle the rest.</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5 sm:p-6">
          {/* Destination */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Where should backups land?
            </label>
            {loadingDestinations ? (
              <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ) : noDestinations ? (
              <div className="flex items-start gap-2 rounded-lg bg-warning-50 px-4 py-3 dark:bg-warning-900/20">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">📍</span>
                <p className="text-xs text-warning-700 dark:text-warning-300">
                  No destinations set up{resourceRegion ? ` in "${resourceRegion}"` : ""} yet.
                  Add one on the Destinations page first — an S3 bucket, SFTP, NFS, or another VM all work.
                </p>
              </div>
            ) : (
              <>
                <select
                  value={selectedDestinationId ?? ""}
                  onChange={(e) => setSelectedDestinationId(Number(e.target.value) || undefined)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select a destination...</option>
                  {regionDestinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} — {DESTINATION_TYPE_LABELS[dest.destination_type] ?? dest.destination_type} → {dest.target_region}
                      {dest.is_default ? " (Default)" : ""}
                    </option>
                  ))}
                  {/* Show other destinations from different regions as fallback */}
                  {resourceRegion && activeDestinations.filter((d) => d.source_region !== resourceRegion).length > 0 && (
                    <optgroup label="Other regions">
                      {activeDestinations
                        .filter((d) => d.source_region !== resourceRegion)
                        .map((dest) => (
                          <option key={dest.id} value={dest.id}>
                            {dest.name} — {dest.source_region} → {dest.target_region}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Where your backup data will be stored.
                  {defaultDest ? " The default destination for this region is pre-selected." : ""}
                </p>
              </>
            )}
          </div>

          {/* Schedule */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Schedule
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScheduleType(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    scheduleType === opt.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Backup Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "full", label: "Full", desc: "Complete backup each time" },
                { value: "incremental", label: "Incremental", desc: "Only changed data" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBackupType(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    backupType === opt.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Retention */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Retention Period
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <ModernButton variant="outline" onClick={onClose} disabled={isSubmitting}>
            Not yet
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || noDestinations || !selectedDestinationId}
          >
            {isSubmitting ? "Setting up backups…" : "Start backing up"}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default BackupConfigModal;
