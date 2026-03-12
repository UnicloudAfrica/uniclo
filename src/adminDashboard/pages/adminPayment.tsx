import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Download,
  Loader2,
  Receipt,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import ResourceDataExplorer from "../components/ResourceDataExplorer";
import { ModernCard } from "@/shared/components/ui";
import { ModernButton } from "@/shared/components/ui";
import {
  useDownloadAdminTransactionReceipt,
  useFetchAdminTransactions,
} from "@/hooks/adminHooks/paymentHooks";

interface StatusOption {
  label: string;
  value: string;
}

interface AdminTransaction {
  id?: string | number | null;
  identifier?: string | number | null;
  reference?: string;
  status?: string;
  amount?: number | string | null;
  currency?: string;
  payment_gateway?: string;
  payment_type?: string;
  created_at?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

type ExplorerRow = Record<string, unknown> & AdminTransaction;

interface ExplorerColumn {
  key?: string;
  accessorKey?: string;
  header: React.ReactNode;
  align?: "left" | "center" | "right";
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

interface TransactionMeta {
  total?: number;
  last_page?: number;
  from?: number;
  to?: number;
}

interface TransactionCollectionResponse {
  data?: AdminTransaction[];
  meta?: TransactionMeta | null;
}

const getTransactionId = (transaction: AdminTransaction): string | number | null => {
  if (
    transaction.identifier !== undefined &&
    transaction.identifier !== null &&
    transaction.identifier !== ""
  ) {
    return transaction.identifier;
  }
  if (transaction.id !== undefined && transaction.id !== null) {
    return transaction.id;
  }
  return null;
};

const statusOptions: StatusOption[] = [
  { label: "All statuses", value: "" },
  { label: "Successful", value: "successful" },
  { label: "Completed", value: "completed" },
  { label: "Processing", value: "processing" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

const successStatuses = new Set(["successful", "completed", "paid", "success"]);
const processingStatuses = new Set(["processing", "pending", "awaiting"]);
const failedStatuses = new Set(["failed", "declined", "cancelled", "error"]);

const formatCurrency = (value: number | string | null | undefined, currency = "NGN") => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  const symbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₦";
  return `${symbol}${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value: string | number | Date | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusTone = (status: string | null | undefined) => {
  const tone = (status || "").toLowerCase();
  if (successStatuses.has(tone)) {
    return {
      bg: "bg-emerald-100/70",
      text: "text-emerald-700",
      border: "border-emerald-200",
    };
  }
  if (processingStatuses.has(tone)) {
    return {
      bg: "bg-amber-100/80",
      text: "text-amber-700",
      border: "border-amber-200",
    };
  }
  if (failedStatuses.has(tone)) {
    return {
      bg: "bg-rose-100/80",
      text: "text-rose-700",
      border: "border-rose-200",
    };
  }
  return {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };
};
export default function AdminPayment() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const {
    data: response,
    isFetching,
    refetch: refetchTransactions,
  } = useFetchAdminTransactions({
    page,
    perPage,
    status: statusFilter,
    search: searchValue,
  });

  const { mutate: downloadReceipt, isPending: isDownloadingReceipt } =
    useDownloadAdminTransactionReceipt();

  const typedResponse = response as TransactionCollectionResponse | undefined;
  const transactions: ExplorerRow[] = useMemo(
    () =>
      Array.isArray(typedResponse?.data)
        ? typedResponse.data.map((transaction) => transaction as ExplorerRow)
        : [],
    [typedResponse]
  );
  const meta = (typedResponse?.meta ?? {}) as TransactionMeta;
  const totalRecords = meta?.total ?? transactions.length;

  const primaryCurrency =
    transactions.find((tx: AdminTransaction) => Boolean(tx.currency))?.currency ?? "NGN";

  const computedStats = useMemo(() => {
    const summary = transactions.reduce<{
      completed: number;
      failed: number;
      processing: number;
      volume: number;
    }>(
      (acc, tx) => {
        const status = (tx.status || "").toLowerCase();
        if (successStatuses.has(status)) {
          acc.completed += 1;
        } else if (failedStatuses.has(status)) {
          acc.failed += 1;
        } else if (processingStatuses.has(status)) {
          acc.processing += 1;
        }
        acc.volume += Number(tx.amount || 0);
        return acc;
      },
      { completed: 0, failed: 0, processing: 0, volume: 0 }
    );

    return summary;
  }, [transactions]);

  const heroMetrics = useMemo(() => {
    return [
      {
        label: "Transactions",
        value: totalRecords,
        description: "Total records matched",
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        label: "Completed (page)",
        value: computedStats.completed,
        description: "Marked successful",
        icon: <BadgeCheck className="h-4 w-4" />,
      },
      {
        label: "Processing (page)",
        value: computedStats.processing,
        description: "Awaiting confirmation",
        icon: <RefreshCcw className="h-4 w-4" />,
      },
      {
        label: "Page volume",
        value: formatCurrency(computedStats.volume, primaryCurrency),
        description: `${transactions.length} visible payments`,
        icon: <Wallet className="h-4 w-4" />,
      },
    ];
  }, [
    totalRecords,
    computedStats.completed,
    computedStats.processing,
    computedStats.volume,
    transactions.length,
    primaryCurrency,
  ]);

  const handleDownload = useCallback(
    (row: AdminTransaction) => {
      const identifier = getTransactionId(row);
      if (identifier === null) return;
      downloadReceipt(identifier, {
        onSuccess: (buffer: unknown) => {
          const receiptData: BlobPart =
            buffer instanceof Blob ||
            typeof buffer === "string" ||
            buffer instanceof ArrayBuffer ||
            ArrayBuffer.isView(buffer)
              ? (buffer as BlobPart)
              : JSON.stringify(buffer ?? "");
          const blob = new Blob([receiptData], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Receipt-${identifier}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        },
      });
    },
    [downloadReceipt]
  );

  const tableColumns = useMemo<ExplorerColumn[]>(
    () => [
      {
        key: "identifier",
        header: "Receipt",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          return (
            <button
              type="button"
              onClick={() => {
                const transactionId = getTransactionId(row);
                if (transactionId === null) return;
                navigate(`/admin-dashboard/payment/${encodeURIComponent(String(transactionId))}`);
              }}
              className="flex flex-col text-left transition hover:text-primary-600"
            >
              <span className="text-sm font-semibold text-slate-900">
                {row.identifier || `Transaction ${row.id}`}
              </span>
              <span className="text-xs text-slate-500">Ref • {row.reference || "n/a"}</span>
            </button>
          );
        },
      },
      {
        key: "customer",
        header: "Customer",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">{row.user?.name || "—"}</span>
              {row.user?.email && <span className="text-xs text-slate-500">{row.user.email}</span>}
            </div>
          );
        },
      },
      {
        key: "amount",
        header: "Amount",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          return (
            <div className="text-sm font-semibold text-slate-900">
              {formatCurrency(row.amount, row.currency)}
            </div>
          );
        },
        align: "right",
      },
      {
        key: "status",
        header: "Status",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          const tone = statusTone(row.status);
          return (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone.bg} ${tone.text} ${tone.border}`}
            >
              {row.status ? row.status.replace(/_/g, " ") : "—"}
            </span>
          );
        },
      },
      {
        key: "payment_gateway",
        header: "Gateway",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          return (
            <div className="flex flex-col">
              <span className="text-sm text-slate-700">{row.payment_gateway || "—"}</span>
              {row.payment_type && (
                <span className="text-xs text-slate-500">
                  {(row.payment_type || "").replace(/_/g, " ")}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "created_at",
        header: "Created",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          return <span className="text-sm text-slate-600">{formatDate(row.created_at)}</span>;
        },
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (rowData: Record<string, unknown>) => {
          const row = rowData as ExplorerRow;
          return (
            <div className="flex items-center justify-end gap-2">
              <ModernButton
                variant="ghost"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary-200 hover:text-primary-600"
                onClick={() => {
                  const transactionId = getTransactionId(row);
                  if (transactionId === null) return;
                  navigate(`/admin-dashboard/payment/${encodeURIComponent(String(transactionId))}`);
                }}
              >
                View
              </ModernButton>
              <ModernButton
                variant="ghost"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary-200 hover:text-primary-600"
                onClick={() => handleDownload(row)}
                disabled={isDownloadingReceipt}
              >
                {isDownloadingReceipt ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                PDF
              </ModernButton>
            </div>
          );
        },
      },
    ],
    [navigate, handleDownload, isDownloadingReceipt]
  );

  const toolbarSlot = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={statusFilter}
        onChange={(event) => {
          setStatusFilter(event.target.value);
          setPage(1);
        }}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
      >
        {statusOptions.map((option: StatusOption) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ModernButton
        variant="outline"
        className="inline-flex items-center gap-2"
        onClick={() => {
          setStatusFilter("");
          setSearchValue("");
          setPage(1);
        }}
      >
        Reset filters
      </ModernButton>
      <ModernButton
        variant="ghost"
        className="inline-flex items-center gap-2"
        onClick={() => refetchTransactions()}
        disabled={isFetching}
      >
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
        Refresh
      </ModernButton>
    </div>
  );

  return (
    <>
      <AdminPageShell
        title="Payments"
        description="Monitor every transaction flowing through UniCloud billing, track statuses, and export official receipts with the UniCloud brand."
        contentClassName="space-y-8"
      >
        <ResourceHero
          title="Revenue operations"
          subtitle="Billing"
          description="Command your pipeline of card charges, transfers, and reconciliations. Filter by status, jump into details, or export official receipts when customers need them."
          metrics={heroMetrics}
          accent="midnight"
        />

        <ModernCard className="border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
          <ResourceDataExplorer
            title="Payments overview"
            description="Search across all recorded payments, filter by status, and open a receipt to see the full gateway trail."
            columns={tableColumns}
            rows={transactions}
            loading={isFetching}
            page={page}
            perPage={perPage}
            total={meta?.total ?? transactions.length}
            meta={meta as Record<string, unknown>}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            searchValue={searchValue}
            onSearch={(value) => {
              setSearchValue(value);
              setPage(1);
            }}
            toolbarSlot={toolbarSlot}
            perPageOptions={[10, 20, 50]}
            highlight
            emptyState={{
              icon: <AlertTriangle className="h-10 w-10 text-amber-500" />,
              title: "No payments match your filters",
              description:
                "Try broadening your criteria or clear the status filter to see more transactions.",
              action: (
                <ModernButton
                  onClick={() => {
                    setStatusFilter("");
                    setSearchValue("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </ModernButton>
              ),
            }}
          />
        </ModernCard>
      </AdminPageShell>
    </>
  );
}
