import React from "react";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { designTokens } from "../../styles/designTokens";

const buildClassName = (...classes) =>
  classes.filter(Boolean).join(" ");

const ResourceDataExplorer = ({
  title,
  description,
  columns = [],
  rows = [],
  loading = false,
  page = 1,
  perPage = 10,
  total = 0,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50],
  searchValue = "",
  onSearch,
  toolbarSlot = null,
  emptyState,
  meta,
  highlight,
}) => {
  const lastPage =
    meta?.last_page ??
    (perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1);

  const currentPage = Math.min(page, lastPage);

  const from =
    meta?.from ?? (total === 0 ? 0 : (currentPage - 1) * perPage + 1);
  const to = meta?.to ?? Math.min(total, currentPage * perPage);

  const handlePerPageChange = (event) => {
    const nextPerPage = Number(event.target.value);
    onPerPageChange?.(nextPerPage);
  };

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), lastPage);
    onPageChange?.(safePage);
  };

  const renderCell = (row, column) => {
    if (typeof column.render === "function") {
      return column.render(row);
    }
    const value = row[column.key];
    if (value === undefined || value === null || value === "") {
      return column.fallback ?? "—";
    }
    return value;
  };

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    if (emptyState) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {emptyState.icon && (
            <div className="mb-4 text-primary-500">{emptyState.icon}</div>
          )}
          <h3 className="text-lg font-semibold text-slate-900">
            {emptyState.title || "No results"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {emptyState.description ||
              "There are no records to display for this view yet."}
          </p>
          {emptyState.action && (
            <div className="mt-6">{emptyState.action}</div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          No records available
        </h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Adjust your filters or add a new record to get started.
        </p>
      </div>
    );
  };

  return (
    <div
      className={buildClassName(
        "relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm",
        highlight
          ? "before:absolute before:inset-x-10 before:-top-20 before:h-40 before:-z-10 before:rounded-full before:bg-primary-200/40 before:blur-3xl"
          : ""
      )}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-1">
          {title && (
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          {onSearch && (
            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search records..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-9 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:bg-white focus:shadow-sm"
              />
            </div>
          )}
          {toolbarSlot}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/70 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key || column.header}
                  scope="col"
                  className={buildClassName(
                    "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  )}
                  style={column.style}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-sm text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    Fetching the latest records
                    <span className="text-xs text-slate-400">
                      Hold tight, this will only take a moment.
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>{renderEmptyState()}</td>
              </tr>
            )}

            {!loading &&
              rows.length > 0 &&
              rows.map((row) => (
                <tr
                  key={row.id ?? row.identifier ?? JSON.stringify(row)}
                  className="group transition hover:bg-slate-50/70"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key || column.header}
                      className={buildClassName(
                        "px-6 py-4 text-sm text-slate-600",
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                          ? "text-center"
                          : "text-left",
                        column.cellClassName
                      )}
                      style={column.style}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>
            Showing{" "}
            <span className="font-medium text-slate-700">
              {total === 0 ? 0 : from} – {to}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">{total}</span>
          </span>
          {meta?.total !== undefined && meta?.total !== total && (
            <span className="text-xs text-slate-400">
              ({meta.total.toLocaleString()} total records)
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {onPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Rows per page
              </span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-primary-300 focus:outline-none"
              >
                {perPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[60px] text-center text-sm font-medium text-slate-600">
              {currentPage} / {lastPage}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= lastPage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(lastPage)}
              disabled={currentPage >= lastPage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDataExplorer;

