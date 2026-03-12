import React, { useMemo } from "react";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { ModernButton, ModernCard } from "@/shared/components/ui";

import type { GenericRecord, LifecycleEvent } from "./instanceDetailsTypes";
import { formatStatusText, LOG_LINE_OPTIONS } from "./instanceDetailsUtils";

// ---------------------------------------------------------------------------
// Console Logs Viewer
// ---------------------------------------------------------------------------

interface ConsoleLogsViewerProps {
  logsData: GenericRecord | null;
  isLogsLoading: boolean;
  logLines: number;
  setLogLines: (lines: number) => void;
  refetchLogs: () => void;
}

export const ConsoleLogsViewer: React.FC<ConsoleLogsViewerProps> = ({
  logsData,
  isLogsLoading,
  logLines,
  setLogLines,
  refetchLogs,
}) => {
  const logsContent = useMemo(() => {
    if (isLogsLoading) {
      return (
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          Loading logs...
        </div>
      );
    }
    if (Array.isArray(logsData?.["logs"]) && logsData["logs"].length) {
      return (
        <pre className="whitespace-pre-wrap break-words text-left">
          {logsData["logs"].join("\n")}
        </pre>
      );
    }
    return <span className="text-slate-400">No log lines returned for this interval.</span>;
  }, [isLogsLoading, logsData]);

  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Provider Logs</h2>
          <p className="text-sm text-slate-500">
            Recent log lines fetched directly from the compute console.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600" htmlFor="log-lines">
            Lines
          </label>
          <select
            id="log-lines"
            value={logLines}
            onChange={(event) => setLogLines(Number(event.target.value))}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {LOG_LINE_OPTIONS.map((option: number) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ModernButton variant="ghost" size="sm" onClick={() => refetchLogs()}>
            Refresh
          </ModernButton>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-900/95 p-4 text-xs font-mono text-slate-100">
        {logsContent}
      </div>
    </ModernCard>
  );
};

// ---------------------------------------------------------------------------
// Lifecycle Timeline
// ---------------------------------------------------------------------------

interface LifecycleTimelineProps {
  lifecycleEvents: LifecycleEvent[];
  refetchLifecycle: () => void;
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({
  lifecycleEvents,
  refetchLifecycle,
}) => {
  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Lifecycle Timeline</h2>
          <p className="text-sm text-slate-500">
            Status transitions with the most recent events first.
          </p>
        </div>
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() => refetchLifecycle()}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </ModernButton>
      </div>
      <div className="space-y-4">
        {lifecycleEvents.length ? (
          lifecycleEvents.map((event: LifecycleEvent) => (
            <div key={event.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Zap className="h-4 w-4 text-amber-500" />
                  {event.label}
                </div>
                <span className="text-xs text-slate-500">{event.timestampLabel}</span>
              </div>
              {event.description && (
                <p className="mt-2 text-sm text-slate-600">{event.description}</p>
              )}
              {event.status && (
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {formatStatusText(event.status)}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No lifecycle events recorded yet.</p>
        )}
      </div>
    </ModernCard>
  );
};

export default ConsoleLogsViewer;
