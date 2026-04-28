import React, { useEffect, useMemo, useState } from "react";
import { FileText, Search, RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react";
import DashboardPageShell from "@/shared/layouts/DashboardPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import { api } from "@/lib/api";
import ToastUtils from "@/utils/toastUtil";

/**
 * GAP-038 — centralised log viewer (UniCloud port).
 *
 * Reads /client/logs with the same filter set the LogStore service exposes:
 *   q, source, level, since, limit. Auto-refreshes every 30s in
 *   live-tail mode; one-shot mode just shows the latest 200.
 *
 * Retention is plan-driven (LogRetentionPolicy::daysFor(tenant)) — the
 * UI shows "showing last 30 days" badge so the user knows why older
 * lines aren't returned.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  id: number;
  source: string;
  source_id: number | null;
  level: LogLevel;
  message: string;
  fields: Record<string, unknown> | null;
  logged_at: string;
}

const LEVEL_BADGE: Record<LogLevel, string> = {
  info: "bg-slate-100 text-slate-700",
  warn: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
};

function LevelIcon({ level }: { level: LogLevel }) {
  if (level === "error") return <AlertCircle className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />;
  if (level === "warn") return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />;
  return <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />;
}

const ClientLogViewer: React.FC = () => {
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [level, setLevel] = useState<"" | LogLevel>("");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveTail, setLiveTail] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    if (level) params.set("level", level);
    params.set("limit", "200");
    return params.toString();
  }, [q, source, level]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ data: LogEntry[] }>(`/client/logs?${queryString}`, {
        silent: true,
      });
      setEntries(r.data ?? []);
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    if (!liveTail) return;
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTail, queryString]);

  return (
    <DashboardPageShell
      title="Logs"
      description="Search and filter logs ingested from your services."
      homeHref="/client-dashboard"
      mainClassName="client-dashboard-shell"
    >
      <div className="space-y-4">
        {/* Filters */}
        <ModernCard>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search log messages…"
                aria-label="Search log messages"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. instance, api)"
              aria-label="Filter by source"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as LogLevel | "")}
              aria-label="Filter by level"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="">All levels</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={liveTail}
                onChange={(e) => setLiveTail(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus-visible:ring-blue-500"
              />
              Live tail (refresh every 30s)
            </label>
            <ModernButton variant="secondary" size="sm" onClick={load} loading={loading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </ModernButton>
          </div>
        </ModernCard>

        {/* Entries */}
        <ModernCard>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-900">No log entries match these filters</p>
              <p className="mt-1 text-xs text-slate-500">
                Retention is plan-driven; older lines may have been pruned.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Log entries">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Time</th>
                    <th scope="col" className="px-3 py-2 font-medium">Source</th>
                    <th scope="col" className="px-3 py-2 font-medium">Level</th>
                    <th scope="col" className="px-3 py-2 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                        {new Date(e.logged_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700">
                        {e.source}
                        {e.source_id !== null && (
                          <span className="ml-1 text-slate-400">#{e.source_id}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[e.level]}`}
                        >
                          <LevelIcon level={e.level} />
                          {e.level}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">
                        {e.message}
                        {e.fields && Object.keys(e.fields).length > 0 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[10px] uppercase text-slate-400 hover:text-slate-600">
                              fields
                            </summary>
                            <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-slate-600">
                              {JSON.stringify(e.fields, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModernCard>
      </div>
    </DashboardPageShell>
  );
};

export default ClientLogViewer;
