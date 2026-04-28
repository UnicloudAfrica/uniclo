import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Activity, ExternalLink } from "lucide-react";
import { useFetchPublicBranding } from "@/hooks/useCostExplorer";
import { api } from "@/lib/api";

/**
 * GAP-037 — public status page (status.unicloudafrica.ng).
 *
 * Reads `/api/v1/status` (component summary + open incidents) and
 * `/api/v1/status/uptime` (90-day grid). No auth required; the API
 * controller doesn't apply tenant scoping or role checks. Branding
 * pulled from the same `/branding` endpoint the cost explorer uses.
 *
 * Layout deliberately mirrors statuspage.io's familiar pattern: overall
 * banner at the top, component grid with status dots, 90-day uptime
 * bars below, open + recent incidents at the bottom.
 */

type Outcome = "up" | "degraded" | "down" | "unknown";

interface StatusComponent {
  slug: string;
  name: string;
  description: string | null;
  outcome: Outcome;
  last_checked_at: string | null;
}

interface StatusIncident {
  id: number;
  title: string;
  summary: string | null;
  status: "identifying" | "investigating" | "resolved";
  impact: "minor" | "major" | "critical";
  started_at: string;
  resolved_at: string | null;
  components: string[];
}

interface SummaryResponse {
  overall: Outcome;
  components: StatusComponent[];
  incidents: StatusIncident[];
}

interface UptimeRow {
  slug: string;
  name: string;
  days: { day: string; outcome: Outcome }[];
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  up: "All systems operational",
  degraded: "Partially degraded",
  down: "Major outage",
  unknown: "Status unavailable",
};

const OUTCOME_BANNER: Record<Outcome, string> = {
  up: "bg-emerald-50 border-emerald-200 text-emerald-800",
  degraded: "bg-amber-50 border-amber-200 text-amber-800",
  down: "bg-red-50 border-red-200 text-red-800",
  unknown: "bg-slate-100 border-slate-200 text-slate-700",
};

const OUTCOME_BAR: Record<Outcome, string> = {
  up: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-slate-300",
};

const ImpactBadge: Record<StatusIncident["impact"], string> = {
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

function OutcomeIcon({ outcome }: { outcome: Outcome }) {
  if (outcome === "up") return <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />;
  if (outcome === "degraded") return <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />;
  if (outcome === "down") return <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />;
  return <Activity className="h-5 w-5 text-slate-400" aria-hidden="true" />;
}

export default function PublicStatusPage() {
  const { data: branding } = useFetchPublicBranding();
  const brandName = branding?.branding?.company?.name || "UniCloud Africa";
  const logoUrl = branding?.branding?.logo || null;

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [uptime, setUptime] = useState<UptimeRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const s = await api.get<SummaryResponse>("/status", { silent: true });
        const u = await api.get<{ data: UptimeRow[] }>("/status/uptime", { silent: true });
        if (cancelled) return;
        setSummary(s);
        setUptime(u.data ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load status");
      }
    };
    void load();
    // Auto-refresh every 60s so visitors don't have to mash F5 during an
    // incident. Cheap query; no rate-limit concern at the volumes a
    // status page sees.
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          Couldn&apos;t load status: {error}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Loading status…</div>
      </div>
    );
  }

  const overall = summary.overall;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
            ) : (
              <div className="text-lg font-bold text-slate-900">{brandName}</div>
            )}
            <span className="text-sm text-slate-500">Status</span>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            Dashboard
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div
          className={`mb-8 flex items-center gap-3 rounded-xl border px-5 py-4 ${OUTCOME_BANNER[overall]}`}
          role="status"
          aria-live="polite"
        >
          <OutcomeIcon outcome={overall} />
          <p className="text-base font-medium">{OUTCOME_LABEL[overall]}</p>
        </div>

        {/* Components */}
        <section aria-labelledby="components-heading" className="mb-10">
          <h2 id="components-heading" className="mb-4 text-lg font-semibold text-slate-900">
            Services
          </h2>
          <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {summary.components.map((c) => (
              <li
                key={c.slug}
                className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.name}</p>
                  {c.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <OutcomeIcon outcome={c.outcome} />
                  <span className="text-sm capitalize text-slate-700">{c.outcome}</span>
                </div>
              </li>
            ))}
            {summary.components.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-slate-500">
                No services registered yet.
              </li>
            )}
          </ul>
        </section>

        {/* 90-day uptime grid */}
        {uptime.length > 0 && (
          <section aria-labelledby="uptime-heading" className="mb-10">
            <h2 id="uptime-heading" className="mb-4 text-lg font-semibold text-slate-900">
              Last 90 days
            </h2>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              {uptime.map((row) => (
                <div key={row.slug}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">{row.name}</span>
                    <span>{row.days.length} days</span>
                  </div>
                  <div className="flex h-6 gap-[2px] overflow-hidden">
                    {row.days.map((d) => (
                      <span
                        key={d.day}
                        className={`flex-1 rounded-sm ${OUTCOME_BAR[d.outcome]}`}
                        title={`${d.day}: ${d.outcome}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Incidents */}
        <section aria-labelledby="incidents-heading">
          <h2 id="incidents-heading" className="mb-4 text-lg font-semibold text-slate-900">
            {summary.incidents.some((i) => !i.resolved_at) ? "Active incidents" : "Recent incidents"}
          </h2>
          {summary.incidents.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              No incidents in the last 7 days.
            </p>
          ) : (
            <ul className="space-y-3">
              {summary.incidents.map((i) => (
                <li
                  key={i.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ImpactBadge[i.impact]}`}
                    >
                      {i.impact.toUpperCase()}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {i.status}
                    </span>
                    {i.resolved_at && (
                      <span className="text-xs text-emerald-600">resolved</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{i.title}</p>
                  {i.summary && (
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                      {i.summary}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Started {new Date(i.started_at).toLocaleString()}
                    {i.resolved_at && ` · resolved ${new Date(i.resolved_at).toLocaleString()}`}
                    {i.components.length > 0 && ` · affects ${i.components.join(", ")}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-12 text-center text-xs text-slate-500">
          Auto-refreshes every 60s · Powered by {brandName}
        </footer>
      </main>
    </div>
  );
}
