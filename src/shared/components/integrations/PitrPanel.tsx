/**
 * PitrPanel — Point-in-Time Recovery panel for a replication pair.
 *
 * Displays the recoverable time range (earliest to latest), snapshot count,
 * WAL archive availability, and a collapsible restore form bounded by the
 * recoverable window.
 */
import React, { useState, useMemo } from "react";
import { Clock, RotateCcw, Database, ChevronDown, ChevronUp } from "lucide-react";
import { ModernButton } from "../ui";
import { usePitrRange, useRestorePitr } from "../../hooks/resources/integrationHooks";

interface PitrPanelProps {
  pairId: string;
  integrationKey?: string;
  resourceType?: string;
  className?: string;
}

const formatDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
};

/** Convert an ISO string to the value format used by datetime-local inputs (YYYY-MM-DDTHH:mm). */
const toDatetimeLocalValue = (iso: string): string => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

const PitrPanel: React.FC<PitrPanelProps> = ({
  pairId,
  integrationKey = "anycloudflow",
  resourceType = "instances",
  className = "",
}) => {
  const { data: pitrRange, isLoading, isError } = usePitrRange(integrationKey, resourceType, pairId);
  const restorePitr = useRestorePitr();

  const [showForm, setShowForm] = useState(false);
  const [targetTime, setTargetTime] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "success" | "error">("idle");

  const minDatetime = useMemo(
    () => (pitrRange?.earliest ? toDatetimeLocalValue(pitrRange.earliest) : ""),
    [pitrRange?.earliest],
  );
  const maxDatetime = useMemo(
    () => (pitrRange?.latest ? toDatetimeLocalValue(pitrRange.latest) : ""),
    [pitrRange?.latest],
  );

  const handleRestore = () => {
    if (!targetTime) return;
    setRestoreStatus("idle");

    // Convert datetime-local value to ISO 8601
    const isoTime = new Date(targetTime).toISOString();

    restorePitr.mutate(
      {
        integrationKey,
        resourceType,
        resourceId: pairId,
        targetTime: isoTime,
      },
      {
        onSuccess: () => setRestoreStatus("success"),
        onError: () => setRestoreStatus("error"),
      },
    );
  };

  const inputClasses =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Point-in-Time Recovery</h3>
        </div>
        {!showForm && pitrRange && (
          <ModernButton variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <RotateCcw size={14} /> Restore
          </ModernButton>
        )}
      </div>

      {/* Body */}
      <div className="space-y-4 p-5">
        {isLoading && <p className="text-sm text-gray-500">Loading PITR range...</p>}

        {isError && (
          <p className="text-sm text-red-500">Failed to load point-in-time recovery information.</p>
        )}

        {!isLoading && !isError && !pitrRange && (
          <p className="text-sm text-gray-500">No backup policy found. Enable backups to use PITR.</p>
        )}

        {pitrRange && (
          <>
            {/* Recoverable Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Earliest Recovery Point</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDateTime(pitrRange.earliest)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Latest Recovery Point</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDateTime(pitrRange.latest)}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pitrRange.snapshot_count} snapshot{pitrRange.snapshot_count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    pitrRange.has_wal_archives ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  WAL Archives {pitrRange.has_wal_archives ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>

            {/* Collapsible Restore Form */}
            {showForm && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
                  onClick={() => setShowForm(!showForm)}
                >
                  <span>Restore to Point in Time</span>
                  {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Target Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={targetTime}
                    onChange={(e) => {
                      setTargetTime(e.target.value);
                      setRestoreStatus("idle");
                    }}
                    min={minDatetime}
                    max={maxDatetime}
                    className={inputClasses}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Must be between {formatDateTime(pitrRange.earliest)} and {formatDateTime(pitrRange.latest)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={handleRestore}
                    disabled={!targetTime || restorePitr.isPending}
                  >
                    <RotateCcw size={14} />
                    {restorePitr.isPending ? "Restoring..." : "Restore to Point in Time"}
                  </ModernButton>
                  <ModernButton variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </ModernButton>
                </div>

                {/* Status feedback */}
                {restoreStatus === "success" && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Point-in-time restore initiated successfully.
                  </p>
                )}
                {restoreStatus === "error" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Failed to initiate restore. Please try again.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PitrPanel;
