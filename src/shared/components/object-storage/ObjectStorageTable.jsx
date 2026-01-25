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
    className: "bg-gray-100 text-gray-700 border-gray-200",
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
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-gray-600">
    <Icon className="h-10 w-10 text-primary-500" />
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-gray-900">
        {title || "No Silo Storage accounts yet"}
      </h3>
      <p className="text-sm text-gray-500">
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
                ? "border border-gray-200 text-gray-700 hover:border-gray-300"
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
  silosByAccount = {},
  siloLoading = {},
  siloErrors = {},
  onLoadSilos,
  onCreateSilo,
  onDeleteSilo,
  emptyState = {},
  enableSiloActions = false,
  paginationMeta = null,
  paginationState = null,
  onPageChange,
  onPerPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return accounts.filter((account) => {
      const status = (account.status || "").toLowerCase();
      if (statusFilter !== "all" && !status.includes(statusFilter)) return false;
      if (!normalizedSearch) return true;
      return (
        (account.name || "").toLowerCase().includes(normalizedSearch) ||
        (account.region || "").toLowerCase().includes(normalizedSearch) ||
        (account.provider || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [accounts, searchTerm, statusFilter]);

  const paginationInfo = useMemo(() => {
    if (!paginationMeta) {
      return {
        total: accounts.length,
        perPage: paginationState?.per_page || DEFAULT_PAGE_SIZES[0],
        currentPage: paginationState?.page || 1,
        lastPage: 1,
      };
    }
    return {
      total: paginationMeta.total ?? paginationMeta.total_items ?? accounts.length,
      perPage: paginationMeta.per_page ?? paginationMeta.perPage ?? paginationState?.per_page ?? 10,
      currentPage:
        paginationMeta.current_page ?? paginationMeta.currentPage ?? paginationState?.page ?? 1,
      lastPage: paginationMeta.last_page ?? paginationMeta.lastPage ?? 1,
    };
  }, [paginationMeta, paginationState, accounts.length]);

  const toggleRow = async (accountId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
    if (onLoadSilos && !silosByAccount?.[accountId]) {
      await onLoadSilos(accountId);
    }
  };

  const renderSilosSection = (account) => {
    const silos = silosByAccount?.[account.id] || [];
    const isLoading = siloLoading?.[account.id];
    const siloError = siloErrors?.[account.id];

    if (!enableSiloActions) return null;

    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Silos</span>
            <span className="text-xs text-gray-500">({silos.length})</span>
          </div>
          {onCreateSilo && (
            <button
              type="button"
              onClick={() => onCreateSilo(account.id, { name: "new-silo" })}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
            >
              Create Silo
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && <p className="text-sm text-gray-500">Loading silos…</p>}
          {siloError && <p className="text-sm text-rose-600">{siloError}</p>}
          {!isLoading && !siloError && !silos.length && (
            <p className="text-sm text-gray-500">No silos found for this account.</p>
          )}
          {!isLoading &&
            !siloError &&
            silos.map((silo) => (
              <div
                key={silo.id || silo.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700"
              >
                <div>
                  <p className="font-semibold text-gray-900">{silo.name}</p>
                  <p className="text-xs text-gray-500">
                    {silo.region || account.region || "Region not set"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {silo.url && (
                    <a
                      href={silo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {onDeleteSilo && (
                    <button
                      type="button"
                      onClick={() => onDeleteSilo(account.id, silo)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderTableBody = () => (
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th className="px-6 py-4 font-semibold">Account</th>
          <th className="px-6 py-4 font-semibold">Provider</th>
          <th className="px-6 py-4 font-semibold">Region</th>
          <th className="px-6 py-4 font-semibold">Status</th>
          <th className="px-6 py-4 font-semibold">Created</th>
          <th className="px-6 py-4 font-semibold">Action</th>
        </tr>
      </thead>
      <tbody>
        {filteredAccounts.map((account) => (
          <React.Fragment key={account.id}>
            <tr
              className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
              onClick={() => onRowClick?.(account)}
            >
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-900">{account.name}</div>
                <div className="text-xs text-gray-500">{account.account_id || "—"}</div>
              </td>
              <td className="px-6 py-4 text-gray-600">{account.provider || "Zadara"}</td>
              <td className="px-6 py-4 text-gray-600">{account.region || "—"}</td>
              <td className="px-6 py-4">
                <StatusBadge status={account.status} />
              </td>
              <td className="px-6 py-4 text-gray-600">{formatDateTime(account.created_at)}</td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleRow(account.id);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600"
                >
                  {expandedRows?.[account.id] ? "Hide silos" : "View silos"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
            {expandedRows?.[account.id] && (
              <tr className="border-b border-gray-100">
                <td colSpan={6} className="px-6 py-4">
                  {renderSilosSection(account)}
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  const renderMobileAccountCard = (account) => (
    <div key={account.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{account.name}</p>
          <p className="text-xs text-gray-500">{account.account_id || "—"}</p>
        </div>
        <StatusBadge status={account.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div>
          <p className="uppercase text-[10px] text-gray-400">Provider</p>
          <p className="text-sm font-medium text-gray-700">{account.provider || "Zadara"}</p>
        </div>
        <div>
          <p className="uppercase text-[10px] text-gray-400">Region</p>
          <p className="text-sm font-medium text-gray-700">{account.region || "—"}</p>
        </div>
        <div>
          <p className="uppercase text-[10px] text-gray-400">Created</p>
          <p className="text-sm font-medium text-gray-700">{formatDateTime(account.created_at)}</p>
        </div>
        <div>
          <p className="uppercase text-[10px] text-gray-400">Silos</p>
          <p className="text-sm font-medium text-gray-700">
            {silosByAccount?.[account.id]?.length || 0}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRowClick?.(account)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
      >
        View details
        <ArrowRight className="h-4 w-4" />
      </button>
      {enableSiloActions && (
        <button
          type="button"
          onClick={() => toggleRow(account.id)}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
        >
          {expandedRows?.[account.id] ? "Hide silos" : "View silos"}
        </button>
      )}
      {expandedRows?.[account.id] && <div className="mt-4">{renderSilosSection(account)}</div>}
    </div>
  );

  const renderPaginationControls = () => {
    if (!paginationInfo || paginationInfo.lastPage <= 1) return null;

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-6 py-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Rows</span>
          <select
            value={paginationInfo.perPage}
            onChange={(event) => onPerPageChange?.(Number(event.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-700"
          >
            {DEFAULT_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, paginationInfo.currentPage - 1))}
            disabled={paginationInfo.currentPage <= 1}
            className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <div className="text-sm font-semibold text-gray-700">
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
            className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  let body = null;
  if (loading) {
    body = (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-gray-500">
        <HardDrive className="h-10 w-10 animate-pulse text-primary-500" />
        <p className="text-sm">Loading Silo Storage accounts…</p>
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-600">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="text-sm text-gray-500">{error}</p>
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
      <div className="px-6 py-16 text-center text-sm text-gray-500">
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
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between md:gap-4 md:p-5">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -trangray-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search by name, provider, region…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:w-52"
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
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60"
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
