import React from "react";
import { Loader2 } from "lucide-react";

const accent = "var(--theme-color)";

/**
 * MobileRecordCards
 *
 * Renders a list of records as one card per row — the mobile counterpart to a
 * ModernTable. Intended to be paired with a table inside `hidden sm:block`,
 * with this list inside `sm:hidden`, so the same data renders as a horizontal
 * table on >=sm and as stacked cards on small screens.
 *
 * It does NOT refetch or re-derive data: callers pass the same rows array and
 * the same render functions (status pill, action) the table already uses.
 */

type WordBreak = "break-words" | "break-all" | "truncate";

export interface MobileRecordField<T> {
  label: string;
  /** Render the field value for a row. Return null to skip the row entirely. */
  render: (row: T, index: number) => React.ReactNode;
  /** How long values wrap. Defaults to break-words. */
  wrap?: WordBreak;
}

export interface MobileRecordCardsProps<T> {
  rows: T[];
  /** Stable key per row. */
  getKey: (row: T, index: number) => React.Key;
  /** Primary field shown as the card title (truncates by default). */
  title: (row: T, index: number) => React.ReactNode;
  /** How the title wraps. Defaults to truncate. */
  titleWrap?: WordBreak;
  /** Remaining fields shown as compact label/value rows. */
  fields: MobileRecordField<T>[];
  /** Optional status pill, rendered top-right of the card. */
  status?: (row: T, index: number) => React.ReactNode;
  /** Optional row action (View button / link), rendered at the card foot. */
  action?: (row: T, index: number) => React.ReactNode;
  /** When set, the whole card is clickable (mirrors ModernTable onRowClick). */
  onRowClick?: (row: T, index: number) => void;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
}

const wrapClass = (wrap: WordBreak): string =>
  wrap === "truncate" ? "truncate" : wrap;

function MobileRecordCards<T>({
  rows,
  getKey,
  title,
  titleWrap = "truncate",
  fields,
  status,
  action,
  onRowClick,
  isLoading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No records found.",
}: MobileRecordCardsProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: accent }} />
        <p className="text-sm text-gray-500 dark:text-gray-400">{loadingMessage}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[6rem] items-center justify-center px-4 py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const statusNode = status?.(row, index);
        const actionNode = action?.(row, index);
        const clickable = Boolean(onRowClick);
        return (
          <div
            key={getKey(row, index)}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onRowClick?.(row, index) : undefined}
            onKeyDown={
              clickable
                ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick?.(row, index);
                    }
                  }
                : undefined
            }
            className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
              clickable
                ? "cursor-pointer transition-colors hover:border-gray-300 dark:hover:border-gray-600"
                : ""
            }`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h4
                className={`min-w-0 flex-1 text-sm font-semibold text-gray-900 dark:text-white ${wrapClass(
                  titleWrap
                )}`}
              >
                {title(row, index)}
              </h4>
              {statusNode ? <div className="shrink-0">{statusNode}</div> : null}
            </div>

            <dl className="mt-3 space-y-2">
              {fields.map((field) => {
                const value = field.render(row, index);
                if (value === null || value === undefined) return null;
                return (
                  <div
                    key={field.label}
                    className="flex min-w-0 items-baseline justify-between gap-3"
                  >
                    <dt className="shrink-0 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {field.label}
                    </dt>
                    <dd
                      className={`min-w-0 text-right text-sm text-gray-900 dark:text-white ${wrapClass(
                        field.wrap ?? "break-words"
                      )}`}
                    >
                      {value}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {actionNode ? (
              <div className="mt-3 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-700">
                {actionNode}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default MobileRecordCards;
