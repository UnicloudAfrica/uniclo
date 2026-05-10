/**
 * ChangeJournalPanel — Manages file-level CDC (change journal) on an external endpoint.
 *
 * Displays journal status (engine, events buffered, size, paths) and provides
 * enable/disable controls. Used in endpoint detail views and protection tabs.
 */
import React, { useState } from "react";
import { History, Play, Square, FileText, HardDrive, Activity, Zap, RefreshCw } from "lucide-react";
import { ModernButton } from "../ui";
import {
  useChangeJournalStatus,
  useChangeJournalEntries,
  useEnableChangeJournal,
  useDisableChangeJournal,
} from "../../hooks/resources/integrationHooks";

interface ChangeJournalPanelProps {
  endpointId: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  running: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  stopped: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  not_configured: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

const statusLabels: Record<string, string> = {
  running: "Running",
  stopped: "Stopped",
  error: "Error",
  not_configured: "Not Configured",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

const ChangeJournalPanel: React.FC<ChangeJournalPanelProps> = ({ endpointId, className = "" }) => {
  const { data: journal, isLoading, refetch: refetchStatus, isFetching: isRefreshingStatus } = useChangeJournalStatus(endpointId);
  const enableJournal = useEnableChangeJournal();
  const disableJournal = useDisableChangeJournal();

  const [showEnableForm, setShowEnableForm] = useState(false);
  const [paths, setPaths] = useState("/var/www");
  const [engine, setEngine] = useState<string>("");

  const status = journal?.status ?? "not_configured";
  const isEnabled = status === "running" || status === "stopped" || status === "error";
  const {
    data: entries = [],
    isLoading: entriesLoading,
    refetch: refetchEntries,
    isFetching: isRefreshingEntries,
  } = useChangeJournalEntries(
    endpointId,
    undefined,
    { enabled: isEnabled },
  );

  const handleEnable = () => {
    const pathList = paths
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (pathList.length === 0) return;

    enableJournal.mutate(
      { endpointId, paths: pathList, engine: engine || undefined },
      { onSuccess: () => setShowEnableForm(false) },
    );
  };

  const handleDisable = () => {
    disableJournal.mutate({ endpointId });
  };

  const handleRefresh = async () => {
    await Promise.all([refetchStatus(), isEnabled ? refetchEntries() : Promise.resolve()]);
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <History size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Change Journal</h3>
        </div>
        <div className="flex items-center gap-2">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshingStatus || isRefreshingEntries}
            className="!px-2.5"
          >
            <RefreshCw size={14} />
            Refresh
          </ModernButton>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
            {statusLabels[status] ?? status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400">Loading...</div>
        ) : isEnabled && journal ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Zap size={12} />
                  Engine
                </div>
                <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                  {journal.engine ?? "---"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <FileText size={12} />
                  Watched Paths
                </div>
                <p className="mt-1 font-mono text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={journal.paths?.join(", ")}>
                  {journal.paths?.join(", ") ?? "---"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Activity size={12} />
                  Events Buffered
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {(journal.events_buffered ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <HardDrive size={12} />
                  Journal Size
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatBytes(journal.size_bytes ?? 0)}
                </p>
              </div>
            </div>

            {/* Last Flush */}
            {journal.last_flush_at && (
              <p className="mt-3 text-xs text-gray-400">
                Last flushed: {new Date(journal.last_flush_at).toLocaleString()}
              </p>
            )}

            {/* Disable Button */}
            <div className="mt-4 flex justify-end">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={handleDisable}
                loading={disableJournal.isPending}
                className="!border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-800 dark:!text-red-400"
              >
                <Square size={14} />
                Disable Journal
              </ModernButton>
            </div>

            {/* Recent Entries */}
            <div className="mt-5 rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Recent Journal Entries
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Latest file events captured by the journal.
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {entries.length} shown
                </span>
              </div>

              {entriesLoading ? (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                  <span aria-hidden="true">📓</span> Loading recent changes…
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <span aria-hidden="true" className="text-3xl">📓</span>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    No changes recorded yet
                  </p>
                  <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
                    The journal records every file write on this VM. Make a change on the source — it'll show up here.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-auto">
                  {entries.slice(0, 10).map((entry, index) => (
                    <div
                      key={`${entry.timestamp ?? "unknown"}-${entry.path ?? index}-${index}`}
                      className="grid gap-2 border-t border-gray-100 px-4 py-3 text-sm first:border-t-0 dark:border-gray-800 md:grid-cols-[160px_120px_1fr]"
                    >
                      <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "---"}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {entry.event ?? "EVENT"}
                      </div>
                      <div className="truncate font-mono text-xs text-gray-600 dark:text-gray-300" title={entry.path}>
                        {entry.path ?? "---"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Empty State */}
            <div className="py-6 text-center">
              <History size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Change journal is not enabled on this endpoint.
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Enable it to speed up replication sync detection from full filesystem scans to instant journal reads.
              </p>
              {!showEnableForm && (
                <ModernButton
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowEnableForm(true)}
                >
                  <Play size={14} />
                  Enable Journal
                </ModernButton>
              )}
            </div>

            {/* Enable Form */}
            {showEnableForm && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  A lightweight daemon will be installed on this VM via SSH to track filesystem changes in real time.
                </p>

                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Paths to watch (comma-separated)
                </label>
                <input
                  type="text"
                  value={paths}
                  onChange={(e) => setPaths(e.target.value)}
                  placeholder="/var/www, /etc/nginx"
                  className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />

                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Engine (optional, auto-detected if empty)
                </label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Auto-detect</option>
                  <option value="fanotify">fanotify (recommended)</option>
                  <option value="inotify">inotify</option>
                </select>

                <div className="flex items-center justify-end gap-2">
                  <ModernButton variant="ghost" size="sm" onClick={() => setShowEnableForm(false)}>
                    Cancel
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={handleEnable}
                    loading={enableJournal.isPending}
                    disabled={!paths.trim()}
                  >
                    Enable
                  </ModernButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChangeJournalPanel;
