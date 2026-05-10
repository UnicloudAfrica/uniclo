import React, { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

/**
 * ResourceShell — uniform loading / empty / error wrapper for any
 * server-data view. Replaces the recurring pattern of:
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorBox onRetry={refetch} />;
 *   if (!data || data.length === 0) return <EmptyState />;
 *   return <ActualUI data={data} />;
 *
 * with a single component that:
 *   - renders an accessible loading state with a screen-reader-only label
 *   - renders an accessible error state with a labelled retry button
 *   - renders an accessible empty state with optional CTA
 *   - calls a render-prop with the resolved data once loaded
 *
 * Used by: every Orbit page (BMR, cutover, drills, recovery plans,
 * assessment, alerts, compliance, ...).
 *
 * Intentionally generic over the data shape — TypeScript narrows via
 * the type parameter, so consumers get full intellisense inside the
 * children render-prop.
 *
 * @example
 *   <ResourceShell
 *     loading={query.isLoading}
 *     error={query.error}
 *     onRetry={query.refetch}
 *     empty={!query.data || query.data.length === 0}
 *     emptyTitle="No recoveries yet"
 *     emptyDescription="Create your first BMR recovery to begin."
 *     emptyAction={{ label: "Start a recovery", onClick: () => navigate("/orbit/bmr/new") }}
 *   >
 *     {() => <BmrRecoveryList recoveries={query.data!} />}
 *   </ResourceShell>
 */

export interface ResourceShellProps<TData = unknown> {
  /** True while fetching. Renders the loading state. */
  loading?: boolean;
  /** Truthy when the fetch failed. Object or string both supported. */
  error?: unknown;
  /** Triggered when the user clicks "Retry" in the error state. */
  onRetry?: () => void;
  /** True when the request succeeded but yielded no data. */
  empty?: boolean;
  /** Title shown in the empty state. */
  emptyTitle?: string;
  /** Description shown below the empty title. */
  emptyDescription?: string;
  /** Optional empty-state call-to-action button. */
  emptyAction?: { label: string; onClick: () => void };
  /** Custom icon for the empty state (defaults to <Inbox />). */
  emptyIcon?: ReactNode;
  /** Optional minimum height to prevent layout shift between states. */
  minHeight?: string;
  /** Render-prop fired with the data once loaded. */
  children: ((data: TData) => ReactNode) | ReactNode;
  /** When children is a render-prop, this is the data passed in. */
  data?: TData;
  /** Additional class name on the outer wrapper. */
  className?: string;
}

function isFunction<T>(x: unknown): x is (data: T) => ReactNode {
  return typeof x === "function";
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    // Try common API envelope shapes
    const e = err as { message?: string; error?: string; data?: { message?: string } };
    if (e.message) return e.message;
    if (e.error) return e.error;
    if (e.data?.message) return e.data.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export function ResourceShell<TData>({
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  emptyIcon,
  minHeight = "12rem",
  children,
  data,
  className = "",
}: ResourceShellProps<TData>): React.JSX.Element {
  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading content"
        className={`flex items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${className}`}
        style={{ minHeight }}
      >
        <div className="flex flex-col items-center gap-3 py-8 text-gray-500 dark:text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading…</span>
          <span aria-hidden="true" className="text-sm">
            Loading…
          </span>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error) {
    const message = extractErrorMessage(error);
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center dark:border-red-800/40 dark:bg-red-900/10 ${className}`}
        style={{ minHeight }}
      >
        <AlertTriangle
          className="mb-3 h-8 w-8 text-red-500 dark:text-red-400"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          Something went wrong
        </p>
        <p className="mt-1 max-w-md text-xs text-red-600 dark:text-red-400">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-900/20 dark:focus:ring-offset-gray-900"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────
  if (empty) {
    return (
      <div
        role="status"
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center dark:border-gray-700 dark:bg-gray-900 ${className}`}
        style={{ minHeight }}
      >
        <div className="mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true">
          {emptyIcon ?? <Inbox className="h-10 w-10" />}
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{emptyTitle}</p>
        {emptyDescription && (
          <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
            {emptyDescription}
          </p>
        )}
        {emptyAction && (
          <button
            type="button"
            onClick={emptyAction.onClick}
            className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  // ─── Loaded ───────────────────────────────────────────────────────
  if (isFunction<TData>(children)) {
    if (data === undefined) {
      // Defensive fallback when consumer forgot to pass `data` with a
      // render-prop child. Render an empty state rather than throwing.
      return (
        <div role="status" aria-label="No data available" className={className} style={{ minHeight }} />
      );
    }
    return <>{children(data)}</>;
  }

  return <>{children}</>;
}

export default ResourceShell;
