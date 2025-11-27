import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Database,
  FolderPlus,
  HardDrive,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";

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

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const gib = bytes / 1024 ** 3;
  if (gib >= 1) {
    return `${gib.toFixed(2)} GiB`;
  }
  const mib = bytes / 1024 ** 2;
  return `${mib.toFixed(2)} MiB`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
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
        {title || "No object storage accounts yet"}
      </h3>
      <p className="text-sm text-slate-500">
        {description ||
          "Provision a plan to sync storage accounts into this workspace."}
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

const ObjectStorageTable = ({
  accounts = [],
  loading = false,
  error = null,
  onRetry,
  onRefresh,
  bucketsByAccount = {},
  bucketLoading = {},
  bucketErrors = {},
  onLoadBuckets,
  onCreateBucket,
  onDeleteBucket,
  enableBucketActions = false,
  emptyState,
  paginationMeta = null,
  paginationState = null,
  onPageChange,
  onPerPageChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedAccounts, setExpandedAccounts] = useState({});
  const [bucketForms, setBucketForms] = useState({});
  const [bucketActionLoading, setBucketActionLoading] = useState({});

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = searchTerm.toLowerCase().trim();
    return accounts.filter((account) => {
      const label = [
        account.name,
        account.provider,
        account.region,
        account.meta?.tenant_name,
      ]
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

  const handleToggleExpand = async (accountId) => {
    const willExpand = !expandedAccounts[accountId];
    setExpandedAccounts((prev) => ({
      ...prev,
      [accountId]: willExpand,
    }));
    if (willExpand && onLoadBuckets) {
      try {
        await onLoadBuckets(accountId);
      } catch (loadError) {
        // surfaced via toast upstream
      }
    }
  };

  const handleCreateBucket = async (accountId) => {
    if (!enableBucketActions || !onCreateBucket) {
      return;
    }
    const name = (bucketForms[accountId] || "").trim();
    if (!name) {
      ToastUtils.error("Provide a bucket name before creating.");
      return;
    }
    setBucketActionLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      await onCreateBucket(accountId, name);
      setBucketForms((prev) => ({ ...prev, [accountId]: "" }));
    } finally {
      setBucketActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleDeleteBucket = async (accountId, bucket) => {
    if (!enableBucketActions || !onDeleteBucket) {
      return;
    }
    const label = bucket?.name || bucket?.id;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Delete bucket "${label}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    setBucketActionLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      await onDeleteBucket(accountId, bucket);
    } finally {
      setBucketActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const renderBucketSection = (account) => {
    const buckets = bucketsByAccount?.[account.id] || [];
    const isLoading = bucketLoading?.[account.id];
    const bucketError = bucketErrors?.[account.id];

    return (
      <div className="space-y-4 rounded-2xl bg-slate-50 px-4 py-4 sm:px-6">
        {enableBucketActions && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Create bucket
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={bucketForms[account.id] || ""}
                  onChange={(event) =>
                    setBucketForms((prev) => ({
                      ...prev,
                      [account.id]: event.target.value,
                    }))
                  }
                  placeholder="bucket-name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  disabled={bucketActionLoading[account.id]}
                />
              </div>
              <button
                type="button"
                onClick={() => handleCreateBucket(account.id)}
                disabled={bucketActionLoading[account.id]}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FolderPlus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-slate-500">Loading buckets…</p>
        )}
        {bucketError && !isLoading && (
          <p className="text-sm text-rose-600">{bucketError}</p>
        )}
        {!isLoading && !bucketError && buckets.length === 0 && (
          <p className="text-sm text-slate-500">
            No buckets available for this account.
          </p>
        )}
        {!isLoading && !bucketError && buckets.length > 0 && (
          <div className="space-y-3">
            {buckets.map((bucket) => (
              <div
                key={bucket.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {bucket.name}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {bucket.storage_class || "standard"}
                    </p>
                  </div>
                  {enableBucketActions && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBucket(account.id, bucket)}
                      disabled={bucketActionLoading[account.id]}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
                <dl className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-4">
                  <div>
                    <dt>Objects</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {bucket.object_count ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {formatBytes(bucket.size_bytes)}
                    </dd>
                  </div>
                  <div>
                    <dt>Versioning</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {bucket.versioning_enabled ? "Enabled" : "Disabled"}
                    </dd>
                  </div>
                  <div>
                    <dt>Encryption</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {bucket.encryption_enabled ? "Enabled" : "Disabled"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTableBody = () => (
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th className="w-10 px-4 py-4" />
          <th className="px-4 py-4">Account</th>
          <th className="px-4 py-4">Status</th>
          <th className="px-4 py-4">Provider / Region</th>
          <th className="px-4 py-4">Quota</th>
          <th className="px-4 py-4 text-center">Buckets</th>
          <th className="px-4 py-4">Endpoint</th>
          <th className="px-4 py-4">Created / Synced</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredAccounts.map((account) => {
          const isExpanded = !!expandedAccounts[account.id];
          const endpoint =
            account.meta?.public_url ||
            account.meta?.provisioning?.result?.public_url ||
            "Not available";
          const quota = account.quota_gb
            ? `${account.quota_gb} GiB`
            : "Uncapped";

          return (
            <React.Fragment key={account.id}>
              <tr className="transition hover:bg-slate-50/60">
                <td className="px-4 py-4 align-top">
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(account.id)}
                    className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-slate-300 hover:text-primary-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="hidden rounded-xl bg-slate-100 p-3 text-slate-500 md:block">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {account.name || "Unnamed account"}
                      </p>
                      <p className="text-xs font-mono text-slate-400">
                        {account.id}
                      </p>
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
                  <p className="text-xs text-slate-500">
                    Region {account.region?.toUpperCase() || "n/a"}
                  </p>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                  {quota}
                </td>
                <td className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
                  {account.buckets_count ?? 0}
                </td>
                <td className="px-4 py-4 text-sm">
                  <p className="max-w-[220px] truncate text-slate-600">
                    {endpoint}
                  </p>
                  {account.meta?.tenant_name && (
                    <p className="text-xs text-slate-400">
                      Tenant {account.meta.tenant_name}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  <p>
                    Created{" "}
                    <span className="font-semibold text-slate-900">
                      {formatDateTime(account.created_at)}
                    </span>
                  </p>
                  <p className="mt-1">
                    Synced{" "}
                    <span className="font-semibold text-slate-900">
                      {formatDateTime(account.synced_at)}
                    </span>
                  </p>
                </td>
              </tr>
              {isExpanded && (
                <tr>
                  <td colSpan={8} className="px-4 pb-6 pt-2 sm:px-6">
                    {renderBucketSection(account)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );

  const renderMobileAccountCard = (account) => {
    const isExpanded = !!expandedAccounts[account.id];
    const endpoint =
      account.meta?.public_url ||
      account.meta?.provisioning?.result?.public_url ||
      "Not available";
    const quota = account.quota_gb ? `${account.quota_gb} GiB` : "Uncapped";
    return (
      <div
        key={account.id}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">
              {account.name || "Unnamed account"}
            </p>
            <p className="text-sm text-slate-500">
              {account.provider?.toUpperCase() || "—"} • Region{" "}
              {account.region?.toUpperCase() || "n/a"}
            </p>
          </div>
          <StatusBadge status={account.status} />
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quota
            </dt>
            <dd className="text-base font-semibold text-slate-900">{quota}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buckets
            </dt>
            <dd className="text-base font-semibold text-slate-900">
              {account.buckets_count ?? 0}
            </dd>
          </div>
        </dl>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Endpoint
          </p>
          <p className="truncate">{endpoint}</p>
          {account.meta?.tenant_name && (
            <p className="text-xs text-slate-400">
              Tenant {account.meta.tenant_name}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleToggleExpand(account.id)}
          className="mt-4 inline-flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span>{isExpanded ? "Hide buckets" : "View buckets"}</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-3">{renderBucketSection(account)}</div>
        )}
      </div>
    );
  };

  const computePagination = () => {
    const currentPage =
      paginationMeta?.current_page ??
      paginationMeta?.currentPage ??
      paginationState?.page ??
      1;
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
              onClick={() =>
                onPageChange(Math.max(1, paginationInfo.currentPage - 1))
              }
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
        <p className="text-sm">Loading object storage accounts…</p>
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
        <div className="hidden overflow-x-auto md:block">
          {renderTableBody()}
        </div>
        <div className="space-y-4 md:hidden">
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
