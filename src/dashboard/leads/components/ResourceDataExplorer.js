import React from "react";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { designTokens } from "../../../styles/designTokens";

const buildClassName = (...classes) =>
  classes.filter(Boolean).join(" ");

const ResourceDataExplorer = ({
  title,
  description,
  columns = [],
  rows = [],
  loading = false,
  searchPlaceholder = "Search",
  searchValue,
  onSearch,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  actions,
  highlight = false,
  emptyState,
}) => {
  const palette = designTokens.colors;

  const renderTableHeader = () => {
    if (!columns.length) return null;
    return (
      <thead>
        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          {columns.map((column) => (
            <th
              key={column.key || column.header}
              className={buildClassName(
                "px-4 py-3",
                column.align === "right"
                  ? "text-right"
                  : column.align === "center"
                  ? "text-center"
                  : "text-left"
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  const renderTableBody = () => {
    if (!rows.length) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length || 1}
              className="px-4 py-10 text-center text-sm text-slate-500"
            >
              {loading ? "Loading..." : "No data available"}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
        {rows.map((row, index) => (
          <tr
            key={row.id || index}
            className={highlight && index === 0 ? "bg-primary-50/40" : ""}
          >
            {columns.map((column) => (
              <td
                key={`${row.id || index}-${column.key || column.header}`}
                className={buildClassName(
                  "px-4 py-3",
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                    ? "text-center"
                    : "text-left"
                )}
              >
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  const renderEmptyState = () => {
    if (!emptyState || rows.length) {
      return null;
    }
    const { icon, title: emptyTitle, description, action, hint } = emptyState;
    return (
      <div className="flex flex-col items-center justify-center whitespace-pre-wrap rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-600">
        {icon ? <div className="mb-4">{icon}</div> : null}
        <h3 className="text-lg font-semibold text-slate-900">{emptyTitle}</h3>
        {description ? (
          <p className="mt-2 max-w-xl text-sm text-slate-500">{description}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
        {hint ? (
          <p className="mt-6 text-xs uppercase tracking-wide text-slate-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {(title || description || actions || onSearch) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {onSearch ? (
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100">
                <Search className="h-4 w-4" />
                <input
                  className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => onSearch(event.target.value)}
                />
              </label>
            ) : null}
            {actions}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : rows.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              {renderTableHeader()}
              {renderTableBody()}
            </table>
          </div>

          {totalPages > 1 && onPageChange ? (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                {pageSizeOptions && onPageSizeChange ? (
                  <select
                    value={pageSize}
                    onChange={(event) => onPageSizeChange(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} / page
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
};

export default ResourceDataExplorer;
