import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Database,
  HardDrive,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";

const STATUS_META = {
  active: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Active",
  },
  provisioning: {
    className: "bg-sky-50 text-sky-700 border-sky-200",
    label: "Provisioning",
  },
  pending: {
    className: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Pending",
  },
  failed: {
    className: "bg-rose-50 text-rose-700 border-rose-200",
    label: "Failed",
  },
};

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "provisioning", label: "Provisioning" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return value;
  }
};

const getStatusMeta = (status = "") => {
  const normalized = status.toLowerCase();
  if (normalized.includes("active")) return STATUS_META.active;
  if (normalized.includes("provision")) return STATUS_META.provisioning;
  if (normalized.includes("pending")) return STATUS_META.pending;
  if (normalized.includes("fail")) return STATUS_META.failed;
  return {
    className: "bg-slate-100 text-slate-700 border-slate-200",
    label: status || "Unknown",
  };
};

const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
};

const EmptyState = ({ icon: Icon = HardDrive, title, description, actions }) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-slate-600">
    <Icon className="h-10 w-10 text-primary-500" />
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-slate-900">
        {title || "No Silo Storage accounts yet"}
      </h3>
      <p className="text-sm text-slate-500">
        {description || "Provision a plan to sync storage accounts into this workspace."}
      </p>
    </div>
    {actions?.length ? (
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={[
              "inline-flex min-w-[160px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition",
              action.variant === "secondary"
                ? "border border-slate-200 text-slate-700 hover:border-slate-300"
                : "bg-primary-600 text-white shadow-md shadow-primary-500/20 hover:bg-primary-700",
              action.disabled ? "opacity-60" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {action.label}
          </button>
        ))}
      </div>
    ) : null}
  </div>
);

const DEFAULT_PAGE_SIZES = [10, 25, 50];

/**
 * Simplified Silo Storage table
 *
 * Displays accounts in a clean table/card layout.
 * Clicking a row navigates to the detail page instead of expanding inline.
 */
const ObjectStorageTable = ({
  accounts = [],
  loading = false,
  error = null,
  onRetry,
  onRefresh,
  onRowClick,
  emptyState,
  paginationMeta = null,
  paginationState = null,
  onPageChange,
  onPerPageChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = searchTerm.toLowerCase().trim();
    return accounts.filter((account) => {
      const label = [account.name, account.provider, account.region, account.meta?.tenant_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || label.includes(normalizedQuery);
      if (!matchesQuery) {
        return false;
      }
      if (statusFilter === "all") {
        return true;
      }
      const normalizedStatus = (account.status || "").toLowerCase();
      return normalizedStatus.includes(statusFilter);
    });
  }, [accounts, searchTerm, statusFilter]);

  const renderTableBody = () => (
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-4 py-4">Account</th>
          <th className="px-4 py-4">Status</th>
          <th className="px-4 py-4">Provider / Region</th>
          <th className="px-4 py-4">Quota</th>
          <th className="px-4 py-4 text-center">Silos</th>
          <th className="px-4 py-4">Created</th>
          <th className="px-4 py-4 w-12"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredAccounts.map((account) => {
          const quota = account.quota_gb ? `${account.quota_gb} GiB` : "Uncapped";

          return (
            <tr
              key={account.id}
              onClick={() => onRowClick && onRowClick(account)}
              className="transition hover:bg-primary-50/50 cursor-pointer group"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="hidden rounded-xl bg-slate-100 p-3 text-slate-500 md:block group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                      {account.name || "Unnamed account"}
                    </p>
                    <p className="text-xs text-slate-400">{account.id?.slice(0, 8)}...</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={account.status} />
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">
                  {account.provider?.toUpperCase() || "—"}
                </p>
                <p className="text-xs text-slate-500">{account.region?.toUpperCase() || "n/a"}</p>
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{quota}</td>
              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center justify-center min-w-[32px] h-8 rounded-full bg-slate-100 text-sm font-semibold text-slate-700 group-hover:bg-primary-100 group-hover:text-primary-700">
                  {account.buckets_count ?? 0}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-500">
                {formatDateTime(account.created_at)}
              </td>
              <td className="px-4 py-4">
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderMobileAccountCard = (account) => {
    const quota = account.quota_gb ? `${account.quota_gb} GiB` : "Uncapped";
    return (
      <div
        key={account.id}
        onClick={() => onRowClick && onRowClick(account)}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-100 p-3 text-primary-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                {account.name || "Unnamed account"}
              </p>
              <p className="text-sm text-slate-500">
                {account.provider?.toUpperCase() || "—"} • {account.region?.toUpperCase() || "n/a"}
              </p>
            </div>
          </div>
          <StatusBadge status={account.status} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500">Quota</p>
              <p className="text-sm font-semibold text-slate-900">{quota}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Silos</p>
              <p className="text-sm font-semibold text-slate-900">{account.buckets_count ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatDateTime(account.created_at)}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary-500" />
        </div>
      </div>
    );
  };

  const computePagination = () => {
    const currentPage =
      paginationMeta?.current_page ?? paginationMeta?.currentPage ?? paginationState?.page ?? 1;
    const perPage =
      paginationMeta?.per_page ??
      paginationMeta?.perPage ??
      paginationState?.per_page ??
      paginationState?.perPage ??
      pageSizeOptions?.[0] ??
      10;
    const total =
      paginationMeta?.total ??
      paginationMeta?.total_items ??
      paginationState?.total ??
      accounts.length;
    const lastPage =
      paginationMeta?.last_page ??
      paginationMeta?.total_pages ??
      Math.max(1, Math.ceil(total / (perPage || 1)));

    const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const end = Math.min(total, currentPage * perPage);
    return {
      currentPage,
      perPage,
      total,
      lastPage,
      start,
      end,
    };
  };

  const paginationInfo = computePagination();

  const renderPaginationControls = () => {
    const showControls =
      (paginationMeta || paginationState) &&
      onPageChange &&
      paginationInfo.total > 0 &&
      paginationInfo.lastPage > 1;
    if (!showControls) {
      return null;
    }

    return (
      <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{paginationInfo.start}</span>-
          <span className="font-semibold text-slate-900">{paginationInfo.end}</span> of{" "}
          <span className="font-semibold text-slate-900">{paginationInfo.total}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {onPerPageChange && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page:</span>
              <select
                value={paginationInfo.perPage}
                onChange={(event) => onPerPageChange(Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {(pageSizeOptions || DEFAULT_PAGE_SIZES).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, paginationInfo.currentPage - 1))}
              disabled={paginationInfo.currentPage <= 1}
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <div className="text-sm font-semibold text-slate-700">
              Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
            </div>
            <button
              type="button"
              onClick={() =>
                onPageChange(
                  paginationInfo.currentPage < paginationInfo.lastPage
                    ? paginationInfo.currentPage + 1
                    : paginationInfo.lastPage
                )
              }
              disabled={paginationInfo.currentPage >= paginationInfo.lastPage}
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  let body = null;
  if (loading) {
    body = (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-slate-500">
        <HardDrive className="h-10 w-10 animate-pulse text-primary-500" />
        <p className="text-sm">Loading Silo Storage accounts…</p>
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-slate-600">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="text-sm text-slate-500">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition hover:bg-primary-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  } else if (!accounts.length) {
    body = <EmptyState {...emptyState} />;
  } else if (!filteredAccounts.length) {
    body = (
      <div className="px-6 py-16 text-center text-sm text-slate-500">
        <p>
          No accounts match your search
          {statusFilter !== "all" ? " and status filters." : "."}
        </p>
      </div>
    );
  } else {
    body = (
      <>
        <div className="hidden overflow-x-auto md:block">{renderTableBody()}</div>
        <div className="space-y-4 p-4 md:hidden">
          {filteredAccounts.map(renderMobileAccountCard)}
        </div>
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-5">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name, provider, region…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:w-52"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>
      {body}
      {renderPaginationControls()}
    </section>
  );
};

export default ObjectStorageTable;
