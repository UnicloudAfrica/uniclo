// @ts-nocheck
import React, { useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
} from "lucide-react";
import { ModernTable, Column } from "../../shared/components/ui";

const buildClassName = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

interface ResourceDataExplorerProps {
  title?: string;
  description?: string;
  columns?: any[]; // Keeping as any[] for now to support legacy column definition
  rows?: any[];
  loading?: boolean;
  page?: number;
  perPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  searchValue?: string;
  onSearch?: (value: string) => void;
  toolbarSlot?: React.ReactNode;
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
  meta?: any;
  highlight?: boolean;
}

const ResourceDataExplorer: React.FC<ResourceDataExplorerProps> = ({
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
  const lastPage = meta?.last_page ?? (perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1);

  const currentPage = Math.min(page, lastPage);

  const from = meta?.from ?? (total === 0 ? 0 : (currentPage - 1) * perPage + 1);
  const to = meta?.to ?? Math.min(total, currentPage * perPage);

  const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPerPage = Number(event.target.value);
    onPerPageChange?.(nextPerPage);
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(1, nextPage), lastPage);
    onPageChange?.(safePage);
  };

  // Map legacy columns to DataTable columns
  const tableColumns: Column<any>[] = useMemo(() => {
    return columns.map((col, idx) => ({
      key: col.key || col.accessorKey || `col-${idx}`,
      header: col.header,
      align: col.align,
      className: col.cellClassName,
      // We use a custom cell renderer to handle the legacy render function and fallback logic
      render: (value: any, row: any, index: number) => {
        if (typeof col.render === "function") {
          return col.render(row);
        }
        // If no render function, use value from key
        const itemValue = row[col.key || col.accessorKey];
        if (itemValue === undefined || itemValue === null || itemValue === "") {
          return col.fallback ?? "—";
        }
        return itemValue;
      },
    }));
  }, [columns]);

  const renderEmptyState = () => {
    if (emptyState) {
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          {emptyState.icon && <div className="mb-4 text-blue-500">{emptyState.icon}</div>}
          <h3 className="text-lg font-semibold text-slate-900">
            {emptyState.title || "No results"}
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {emptyState.description || "There are no records to display for this view yet."}
          </p>
          {emptyState.action && <div className="mt-6">{emptyState.action}</div>}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">No records available</h3>
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
          ? "before:absolute before:inset-x-10 before:-top-20 before:h-40 before:-z-10 before:rounded-full before:bg-blue-200/40 before:blur-3xl"
          : ""
      )}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-1">
          {title && (
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
          )}
          {description && <p className="text-sm text-slate-500">{description}</p>}
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-9 py-2 text-sm text-slate-600 outline-none transition focus:border-blue-300 focus:bg-white focus:shadow-sm"
              />
            </div>
          )}
          {toolbarSlot}
        </div>
      </div>

      <ModernTable
        data={rows}
        columns={tableColumns}
        loading={loading}
        emptyMessage={renderEmptyState()}
        // Use ResourceDataExplorer's search input for now, disable internal search
        searchable={false}
        // Controlled pagination
        page={currentPage}
        pageSize={perPage}
        totalItems={total}
        totalPages={lastPage}
        onPageChange={handlePageChange}
        // Disable internal pagination UI if we were hiding it, but ModernTable has it built-in now
        // so we can rely on ModernTable's pagination or keep our own footer?
        // ResourceDataExplorer has its own footer (lines 165-236).
        // If we use ModernTable's pagination, we should duplicate the footer logic or hide ModernTable's footer.
        // ModernTable only shows footer if `paginated` is true.
        // Let's rely on ModernTable's pagination and REMOVE ResourceDataExplorer's footer if possible.
        // But ResourceDataExplorer has "perPage" selector which ModernTable currently doesn't expose in its footer (it has fixed logic or hidden).
        // Let's keep ResourceDataExplorer's footer for now and disable ModernTable's pagination UI by passing paginated={false}.
        // Wait, pass `paginated={false}` disables logic AND UI.
        // But I want ModernTable to render the rows.
        // If I pass `paginated={false}`, ModernTable renders all data.
        // Since `rows` passed from parent is usually ALREADY sliced (server-side), `paginated={false}` is correct for "Show all given rows".
        // SO: I will use `paginated={false}` and keep ResourceDataExplorer's footer.
        paginated={false}
      />

      <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>
            Showing{" "}
            <span className="font-medium text-slate-700">
              {total === 0 ? 0 : from} – {to}
            </span>{" "}
            of <span className="font-medium text-slate-700">{total}</span>
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
              <span className="text-xs uppercase tracking-wide text-slate-400">Rows per page</span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-blue-300 focus:outline-none"
              >
                {perPageOptions.map((option: any) => (
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
