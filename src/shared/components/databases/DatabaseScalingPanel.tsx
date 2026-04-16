/**
 * DatabaseScalingPanel -- Vertical scaling controls for a managed database.
 *
 * Displays current instance class + storage, provides resize forms with
 * instance class dropdown, storage slider, "apply immediately" toggle,
 * and pending-modifications indicator.
 */
import React, { useState, useEffect } from "react";
import {
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  Loader2,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchInstanceClasses,
  useResizeDatabase,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { ManagedDatabase, InstanceClass } from "@/types/managedDatabase";

// ─── Types ──────────────────────────────────────────────────────

interface DatabaseScalingPanelProps {
  database: ManagedDatabase;
  onRefresh?: () => void;
}

// ─── Main Component ─────────────────────────────────────────────

const DatabaseScalingPanel: React.FC<DatabaseScalingPanelProps> = ({ database, onRefresh }) => {
  const { data: instanceClassesRaw, isLoading: classesLoading } = useFetchInstanceClasses(
    database.engine
  );
  const resizeMutation = useResizeDatabase();

  const instanceClasses = Array.isArray(instanceClassesRaw)
    ? (instanceClassesRaw as InstanceClass[])
    : [];

  const [selectedClass, setSelectedClass] = useState("");
  const [storageGb, setStorageGb] = useState(database.storage_gb ?? 20);
  const [applyImmediately, setApplyImmediately] = useState(false);
  const [showResizeForm, setShowResizeForm] = useState(false);
  const [resizeResult, setResizeResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Track current storage for min validation
  const currentStorageGb = database.storage_gb ?? 20;

  useEffect(() => {
    setStorageGb(currentStorageGb);
  }, [currentStorageGb]);

  const handleResize = async () => {
    setResizeResult(null);
    try {
      const params: { identifier: string | number; instance_class?: string; storage_gb?: number; apply_immediately?: boolean } = {
        identifier: database.identifier ?? database.id,
        apply_immediately: applyImmediately,
      };
      if (selectedClass) params.instance_class = selectedClass;
      if (storageGb > currentStorageGb) params.storage_gb = storageGb;

      await resizeMutation.mutateAsync(params);
      setResizeResult({
        success: true,
        message: applyImmediately
          ? "Resize initiated. Changes are being applied now."
          : "Resize scheduled for the next maintenance window.",
      });
      setShowResizeForm(false);
      onRefresh?.();
    } catch (err: unknown) {
      setResizeResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to resize database.",
      });
    }
  };

  const hasChanges = selectedClass !== "" || storageGb > currentStorageGb;

  // ── Current Configuration Display ──

  return (
    <div className="space-y-4">
      {/* Current Configuration */}
      <ModernCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Server size={16} className="text-blue-500" />
            Instance Configuration
          </h3>
          {!showResizeForm && (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => setShowResizeForm(true)}
            >
              <ArrowUpCircle size={14} className="mr-1" />
              Resize
            </ModernButton>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Cpu size={12} />
              vCPUs
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {database.vcpu_count ?? "---"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <MemoryStick size={12} />
              Memory
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {database.memory_mb ? `${(database.memory_mb / 1024).toFixed(1)} GB` : "---"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <HardDrive size={12} />
              Storage
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {currentStorageGb} GB
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Server size={12} />
              Plan
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
              {database.plan_size ?? "---"}
            </div>
          </div>
        </div>
      </ModernCard>

      {/* Resize Form */}
      {showResizeForm && (
        <ModernCard className="p-5 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Resize Database
          </h3>

          <div className="space-y-5">
            {/* Instance Class Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Instance Class
              </label>
              {classesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  Loading instance classes...
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Keep current instance class</option>
                  {instanceClasses.map((ic) => (
                    <option key={ic.name} value={ic.name}>
                      {ic.label} -- ${ic.monthly_cost}/mo
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Storage Slider */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Storage Size: {storageGb} GB
                {storageGb > currentStorageGb && (
                  <span className="ml-2 text-blue-500">
                    (+{storageGb - currentStorageGb} GB)
                  </span>
                )}
              </label>
              <input
                type="range"
                min={currentStorageGb}
                max={Math.max(currentStorageGb * 4, 500)}
                step={10}
                value={storageGb}
                onChange={(e) => setStorageGb(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>{currentStorageGb} GB (current)</span>
                <span>{Math.max(currentStorageGb * 4, 500)} GB</span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                Storage can only be increased, not decreased.
              </p>
            </div>

            {/* Apply Immediately Toggle */}
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <input
                type="checkbox"
                id="apply-immediately"
                checked={applyImmediately}
                onChange={(e) => setApplyImmediately(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label
                  htmlFor="apply-immediately"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  Apply immediately
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {applyImmediately
                    ? "Changes will be applied now. Instance class changes may cause brief downtime."
                    : "Changes will be applied during the next maintenance window (no downtime)."}
                </p>
              </div>
            </div>

            {/* Downtime Warning */}
            {applyImmediately && selectedClass && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Downtime Expected
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Changing the instance class requires a brief restart. Your database will be
                    unavailable for 1-3 minutes during the transition.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <ModernButton
                variant="primary"
                size="sm"
                disabled={!hasChanges}
                loading={resizeMutation.isPending}
                onClick={handleResize}
              >
                {applyImmediately ? "Apply Now" : "Schedule Resize"}
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResizeForm(false);
                  setSelectedClass("");
                  setStorageGb(currentStorageGb);
                  setApplyImmediately(false);
                }}
              >
                Cancel
              </ModernButton>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Resize Result */}
      {resizeResult && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 ${
            resizeResult.success
              ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
          }`}
        >
          {resizeResult.success ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
          )}
          <p
            className={`text-sm ${
              resizeResult.success
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {resizeResult.message}
          </p>
        </div>
      )}

      {/* Pending Modifications Indicator */}
      {database.metadata?.pending_modifications && (
        <ModernCard className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-2">
            <Clock size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Pending Modifications
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Changes are scheduled to be applied during the next maintenance window.
              </p>
            </div>
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default DatabaseScalingPanel;
