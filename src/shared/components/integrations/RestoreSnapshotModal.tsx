/**
 * RestoreSnapshotModal — Confirm and initiate a backup restore.
 *
 * Shows snapshot details, restore method selection, and confirmation.
 * Responsive: full-width on mobile, centered modal on desktop.
 */
import React, { useState, useEffect } from "react";
import { X, RotateCcw, AlertTriangle, Monitor, Server } from "lucide-react";
import { ModernButton } from "../ui";
import { useRestoreBackup } from "@/shared/hooks/resources/integrationHooks";

interface RestoreSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: Record<string, unknown> | null;
  resourceName?: string;
  integrationKey?: string;
}

const RESTORE_METHODS = [
  {
    value: "in_place",
    label: "In-place Restore",
    description: "Overwrite current resource data with backup",
    icon: Monitor,
    enabled: true,
  },
  {
    value: "to_new",
    label: "Restore to New",
    description: "Coming soon",
    icon: Server,
    enabled: false,
  },
];

const RestoreSnapshotModal: React.FC<RestoreSnapshotModalProps> = ({
  isOpen,
  onClose,
  snapshot,
  resourceName,
  integrationKey = "anycloudflow",
}) => {
  const [restoreMethod, setRestoreMethod] = useState("in_place");
  const [confirmed, setConfirmed] = useState(false);
  const restoreBackup = useRestoreBackup();

  useEffect(() => {
    if (isOpen) {
      setRestoreMethod("in_place");
      setConfirmed(false);
    }
  }, [isOpen]);

  if (!isOpen || !snapshot) return null;

  const snapshotId = (snapshot.identifier ?? snapshot.external_operation_id ?? snapshot.id) as string;
  const completedAt = snapshot.completed_at as string | undefined;
  const config = (snapshot.config ?? {}) as Record<string, unknown>;
  const backupType = (config.backup_type as string) ?? "full";

  const handleRestore = () => {
    restoreBackup.mutate(
      {
        integrationKey,
        snapshotId,
        options: { restore_method: restoreMethod },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-gray-900/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-md sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <RotateCcw size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Restore Backup
              </h3>
              {resourceName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{resourceName}</p>
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
          {/* Snapshot Info */}
          <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Snapshot Details
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {completedAt
                    ? new Date(completedAt).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="mt-0.5 text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                  {backupType}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                <p className="mt-0.5 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {snapshotId}
                </p>
              </div>
            </div>
          </div>

          {/* Restore Method */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Restore Method
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RESTORE_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={!method.enabled}
                    onClick={() => method.enabled && setRestoreMethod(method.value)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                      !method.enabled
                        ? "cursor-not-allowed border-gray-200 opacity-50 dark:border-gray-700"
                        : restoreMethod === method.value
                          ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500 dark:border-amber-400 dark:bg-amber-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-gray-500 dark:text-gray-400" />
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                        {method.label}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {method.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This will overwrite the current resource data with the selected backup snapshot.
              This action cannot be undone.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I understand this will replace the current data and cannot be reversed.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <ModernButton variant="outline" onClick={onClose} disabled={restoreBackup.isPending}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleRestore}
            disabled={!confirmed || restoreBackup.isPending}
          >
            {restoreBackup.isPending ? "Restoring..." : "Start Restore"}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default RestoreSnapshotModal;
