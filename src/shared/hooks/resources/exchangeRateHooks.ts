/**
 * Exchange Rate Hooks — Context-aware hooks for the Published FX Rates
 * resource (admin-only on the platform side, but exposed via the same
 * registry-driven shape every other resource hook uses).
 *
 * Backed by:
 *   - GET  /admin/v1/published-fx-rates                 (list, history-inclusive)
 *   - POST /admin/v1/published-fx-rates                 (publish, atomically
 *           closes the prior pair's effective_until)
 *   - GET  /admin/v1/published-fx-rates/active?...      (currently-in-force
 *           lookup for a single pair)
 *
 * Mirrors `web/src/shared/hooks/resources/invoiceHooks.ts` — uses
 * `useApiContext()` + `apiRegistry[context]`, surfaces the silent client
 * for reads and the toast client for the publish mutation.
 */
import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions<T = unknown> = Partial<
  Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Types ──────────────────────────────────────────────────────

export type FxRateSource = "admin" | "auto_refresh" | "manual" | string;

export interface PublishedFxRate {
  id: number;
  source_currency: string;
  target_currency: string;
  rate: string | number;
  effective_from: string | null;
  effective_until: string | null;
  source: FxRateSource;
  notes?: string | null;
  published_by?: number | string | null;
  published_by_name?: string | null;
  created_at?: string | null;
}

export interface PublishFxRatePayload {
  source_currency: string;
  target_currency: string;
  rate: number;
  effective_from?: string;
  notes?: string;
}

/**
 * The shape returned by `usePublishedFxRates` — preserves the raw rows
 * (sorted desc by `effective_from`) and a per-pair grouping ready for
 * the card-grid UI.
 */
export interface PublishedFxRateGroup {
  /** Stable key, e.g. "USD-NGN" */
  key: string;
  source_currency: string;
  target_currency: string;
  /** Currently-in-force row (effective_until === null), if any. */
  active: PublishedFxRate | null;
  /** All rows for this pair, newest first. */
  history: PublishedFxRate[];
}

export interface PublishedFxRateListResult {
  rows: PublishedFxRate[];
  groups: PublishedFxRateGroup[];
}

// ─── Path Helpers ──────────────────────────────────────────────

/**
 * The published-fx-rates resource is admin-only today. The tenant /
 * client urlPrefixes are kept here so a future read-only mirror lands
 * cleanly without rewiring callers.
 */
const fxRatesPath = (context: ApiContext): string => {
  if (context === "tenant") return "/admin/published-fx-rates";
  // admin uses prefix "" so absolute "/published-fx-rates" works.
  return "/published-fx-rates";
};

// ─── Query Keys ────────────────────────────────────────────────

export const fxRateKeys = {
  all: (context: ApiContext) => ["published-fx-rates", context] as const,
  list: (context: ApiContext) =>
    ["published-fx-rates", context, "list"] as const,
  active: (context: ApiContext, source: string, target: string) =>
    ["published-fx-rates", context, "active", source, target] as const,
};

// ─── Helpers ───────────────────────────────────────────────────

const toIsoTimestamp = (value: string | null | undefined): number => {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
};

const groupRatesByPair = (rows: PublishedFxRate[]): PublishedFxRateGroup[] => {
  const map = new Map<string, PublishedFxRateGroup>();
  for (const row of rows) {
    const src = (row.source_currency ?? "").toUpperCase();
    const tgt = (row.target_currency ?? "").toUpperCase();
    const key = `${src}-${tgt}`;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        source_currency: src,
        target_currency: tgt,
        active: null,
        history: [],
      };
      map.set(key, group);
    }
    group.history.push(row);
    if (row.effective_until === null && !group.active) {
      group.active = row;
    }
  }
  // Sort each group's history newest-first so the UI's collapsible
  // history table reads top-down chronologically.
  for (const group of map.values()) {
    group.history.sort(
      (a, b) =>
        toIsoTimestamp(b.effective_from) - toIsoTimestamp(a.effective_from)
    );
    if (!group.active) {
      // Fallback: if no row has a null `effective_until`, treat the
      // newest one as the active row so the UI still renders something.
      group.active = group.history[0] ?? null;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
};

// ─── List ──────────────────────────────────────────────────────

/**
 * Fetch the full FX rate history (active + past) and group it per pair.
 * The grouped shape is what the cards-per-pair UI consumes; consumers
 * that want the raw rows can read `data.rows`.
 */
export function usePublishedFxRates(
  options?: QueryOptions<PublishedFxRateListResult>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const query = useQuery<PublishedFxRateListResult, Error>({
    queryKey: fxRateKeys.list(context),
    queryFn: async () => {
      const res = await entry.silentApi.get<AnyRecord>(fxRatesPath(context));
      const envelope = asEnvelope<PublishedFxRate[] | AnyRecord>(res);
      const raw = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray((res as { data?: unknown })?.data)
          ? ((res as { data?: PublishedFxRate[] }).data ?? [])
          : [];
      const rows = raw as PublishedFxRate[];
      // Defensive: backend orders desc by effective_from already, but the
      // grouping helper does a final sort so we stay correct even if a
      // proxy / cache reorders the response.
      const groups = groupRatesByPair(rows);
      return { rows, groups };
    },
    ...options,
  });

  return query;
}

// ─── Live FX lookup (admin only) ───────────────────────────────

export interface FxLookupResult {
  rate: number;
  source_currency: string;
  target_currency: string;
  fx_source: string;
  fetched_at?: string;
  as_of?: string;
}

/**
 * One-shot live FX quote — used by the Publish modal's "Fetch latest"
 * button. Walks the backend's provider chain then falls back to the
 * free public API. The admin can edit the returned rate before
 * publishing — nothing is persisted by the lookup itself.
 */
export function useLookupFxRate() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<
    FxLookupResult,
    Error,
    { source_currency: string; target_currency: string }
  >({
    mutationFn: async ({ source_currency, target_currency }) => {
      const qs = new URLSearchParams({
        source_currency: source_currency.toUpperCase(),
        target_currency: target_currency.toUpperCase(),
      }).toString();
      const res = await entry.toastApi.get<AnyRecord>(
        `${fxRatesPath(context)}/lookup?${qs}`
      );
      const env = asEnvelope<FxLookupResult>(res);
      if (!env.data) {
        throw new Error(env.message ?? "No live rate available");
      }
      return env.data;
    },
  });
}

// ─── Active (single pair) ──────────────────────────────────────

export function useActivePublishedFxRate(
  source: string | null | undefined,
  target: string | null | undefined,
  options?: QueryOptions<PublishedFxRate | null>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const enabled = Boolean(source && target);
  const normalizedSource = (source ?? "").toUpperCase();
  const normalizedTarget = (target ?? "").toUpperCase();

  return useQuery<PublishedFxRate | null, Error>({
    queryKey: fxRateKeys.active(context, normalizedSource, normalizedTarget),
    queryFn: async () => {
      const qs = new URLSearchParams({
        source: normalizedSource,
        target: normalizedTarget,
      }).toString();
      const res = await entry.silentApi.get<AnyRecord>(
        `${fxRatesPath(context)}/active?${qs}`
      );
      const data = asEnvelope<PublishedFxRate>(res).data ?? null;
      return data;
    },
    enabled,
    ...options,
  });
}

// ─── Publish (mutation) ────────────────────────────────────────

export function usePublishFxRate() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    { message?: string; data?: PublishedFxRate },
    Error,
    PublishFxRatePayload
  >({
    mutationFn: async (payload) => {
      const res = await entry.toastApi.post<AnyRecord>(
        fxRatesPath(context),
        {
          source_currency: payload.source_currency.toUpperCase(),
          target_currency: payload.target_currency.toUpperCase(),
          rate: payload.rate,
          ...(payload.effective_from
            ? { effective_from: payload.effective_from }
            : {}),
          ...(payload.notes ? { notes: payload.notes } : {}),
        }
      );
      return res as { message?: string; data?: PublishedFxRate };
    },
    onSuccess: () => {
      // Refresh the list query (the grouped shape) so the UI reflects
      // the new active row + its predecessor's freshly-set
      // `effective_until`. Also bust any pair-specific active lookups.
      queryClient.invalidateQueries({ queryKey: fxRateKeys.all(context) });
    },
  });
}

// ─── Display helpers ───────────────────────────────────────────

/**
 * Format a numeric rate for display. Keeps up to 6 fractional digits but
 * trims trailing zeros so "1600.00" reads as "1,600" while keeping
 * "0.000123" precise.
 */
export const formatFxRate = (rate: string | number | null | undefined): string => {
  if (rate === null || rate === undefined) return "—";
  const n = typeof rate === "number" ? rate : Number(rate);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(n);
};

/**
 * Human-friendly relative time, e.g. "2 hours ago", "yesterday", "Apr 12".
 * Falls back to a localized date when older than a week.
 */
export const formatRelativeTime = (
  value: string | null | undefined
): string => {
  if (!value) return "—";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return "—";
  const diffMs = Date.now() - ts;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toDateString();
  }
};

/**
 * Convert a backend timestamp into the value an `<input type="datetime-local">`
 * field expects, in the user's local timezone. Returns "" when input is
 * missing so callers can fall back to "now".
 */
export const toDatetimeLocalInputValue = (
  value: string | Date | null | undefined
): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => `${n}`.padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

export const useNowDatetimeLocal = (): string =>
  useMemo(() => toDatetimeLocalInputValue(new Date()), []);
