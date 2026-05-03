/**
 * InvoiceList — Shared invoice list table for admin, tenant, and client dashboards.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  RefreshCw,
  CheckCircle,
  Send,
  XCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Search,
} from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import StatusPill from "@/shared/components/ui/StatusPill";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import ModernTextarea from "@/shared/components/ui/ModernTextarea";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchInvoices,
  useFetchInvoiceStatistics,
  useMarkInvoicePaid,
  useSendInvoiceReminder,
  useVoidInvoice,
  formatInvoiceCurrency,
  getInvoiceStatusTone,
  getInvoiceStatusLabel,
  type Invoice,
  type InvoiceListParams,
  type InvoiceStatus,
} from "@/shared/hooks/resources/invoiceHooks";

interface InvoiceListProps {
  context: "admin" | "tenant" | "client";
  detailBasePath: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "quote", label: "Quote" },
  { value: "accepted", label: "Accepted" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void", label: "Voided" },
  { value: "refunded", label: "Refunded" },
];

/**
 * Tab filters for the unified Quotes & Invoices listing. `tabFilter`
 * narrows the list client-side so server already-filtered statuses
 * still work alongside the toggle. The tab → status array map is the
 * source of truth.
 */
type ListTab = "all" | "quotes" | "invoices" | "paid";

const TAB_DEFINITIONS: Array<{ id: ListTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "quotes", label: "Quotes" },
  { id: "invoices", label: "Invoices" },
  { id: "paid", label: "Paid" },
];

const TAB_STATUS_MAP: Record<ListTab, InvoiceStatus[]> = {
  all: [],
  quotes: ["quote", "accepted"],
  invoices: ["draft", "pending", "partial", "overdue"],
  paid: ["paid"],
};

/**
 * Status pill colour palette per the design spec:
 *   quote    → blue
 *   accepted → teal
 *   pending  → amber
 *   paid     → green
 *   overdue  → red
 *   void     → gray
 * StatusPill's built-in `tone` palette can't express all six distinctly,
 * so we render quote / accepted / paid / overdue / void with custom
 * tailwind classes and fall back to StatusPill for the remainder.
 */
const STATUS_BADGE_CLASSES: Partial<Record<InvoiceStatus, string>> = {
  quote: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  accepted: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  overdue: "bg-red-50 text-red-700 ring-1 ring-red-200",
  void: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const OWNER_TYPE_OPTIONS = [
  { value: "", label: "All owners" },
  { value: "user", label: "Users" },
  { value: "tenant", label: "Tenants" },
];

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const InvoiceList: React.FC<InvoiceListProps> = ({ context, detailBasePath }) => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<InvoiceListParams>({
    per_page: 25,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  const {
    data: list,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFetchInvoices(filters);

  const { data: stats } = useFetchInvoiceStatistics(
    context === "admin" ? { include_trend: true } : undefined
  );

  const markPaid = useMarkInvoicePaid();
  const sendReminder = useSendInvoiceReminder();
  const voidInvoice = useVoidInvoice();

  const invoices = useMemo<Invoice[]>(
    () => (Array.isArray(list?.data) ? (list?.data as Invoice[]) : []),
    [list]
  );

  // Client-side search + tab filters layered on top of server response.
  // Tabs narrow by status (Quotes / Invoices / Paid / All); the explicit
  // status select can further refine within a tab.
  const visibleInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const tabStatuses = TAB_STATUS_MAP[activeTab];
    return invoices.filter((inv) => {
      if (tabStatuses.length > 0 && !tabStatuses.includes(inv.status)) {
        return false;
      }
      if (!term) return true;
      const tokens = [
        inv.invoice_number,
        inv.quote_number,
        inv.owner_name,
        inv.owner_email,
        inv.invoiceable?.name,
        inv.invoiceable?.email,
        inv.invoiceable?.company_name,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return tokens.some((t) => t.includes(term));
    });
  }, [invoices, searchTerm, activeTab]);

  const [paidModalInvoice, setPaidModalInvoice] = useState<Invoice | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidNote, setPaidNote] = useState("");

  const openMarkPaid = useCallback((row: Invoice) => {
    setPaidModalInvoice(row);
    setPaidAmount(String(row.amount_due ?? row.total ?? ""));
    setPaidNote("");
  }, []);

  const closeMarkPaid = useCallback(() => {
    setPaidModalInvoice(null);
    setPaidAmount("");
    setPaidNote("");
  }, []);

  const submitMarkPaid = useCallback(() => {
    if (!paidModalInvoice) return;
    const amountNum = paidAmount.trim() === "" ? undefined : Number(paidAmount);
    markPaid.mutate(
      {
        id: paidModalInvoice.uuid,
        amount: amountNum,
        note: paidNote.trim() || undefined,
      },
      {
        onSuccess: () => closeMarkPaid(),
      }
    );
  }, [paidModalInvoice, paidAmount, paidNote, markPaid, closeMarkPaid]);

  const handleRowClick = useCallback(
    (row: Invoice) => {
      navigate(`${detailBasePath}/${row.uuid}`);
    },
    [navigate, detailBasePath]
  );

  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        key: "invoice_number",
        header: "Document #",
        sortable: true,
        render: (_, row) => {
          const isQuote = row.status === "quote" || row.status === "accepted";
          const number = isQuote
            ? row.quote_number ?? row.invoice_number
            : row.invoice_number ?? row.quote_number;
          return (
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-[var(--theme-color)]" />
              <span className="font-medium text-[var(--theme-heading-color)]">
                {number ?? "—"}
              </span>
            </div>
          );
        },
      },
      {
        key: "owner",
        header: "Owner",
        render: (_, row) => {
          const name =
            row.owner_name ??
            row.invoiceable?.name ??
            row.invoiceable?.company_name ??
            row.tenant?.name ??
            "—";
          const email = row.owner_email ?? row.invoiceable?.email ?? "";
          return (
            <div className="flex flex-col">
              <span className="text-sm text-[var(--theme-heading-color)]">
                {name}
              </span>
              {email ? (
                <span className="text-xs text-[var(--theme-muted-color)]">
                  {email}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: "issue_date",
        header: "Issued",
        sortable: true,
        render: (_, row) => formatDate(row.issue_date),
        hideOnMobile: true,
      },
      {
        key: "due_date",
        header: "Due",
        sortable: true,
        render: (_, row) => {
          const due = formatDate(row.due_date);
          const overdue =
            row.status === "overdue" ||
            (typeof row.days_overdue === "number" && row.days_overdue > 0);
          return (
            <span
              className={
                overdue
                  ? "text-sm font-medium text-red-600"
                  : "text-sm text-[var(--theme-heading-color)]"
              }
            >
              {due}
            </span>
          );
        },
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        sortable: true,
        render: (_, row) => (
          <span className="font-medium text-[var(--theme-heading-color)]">
            {formatInvoiceCurrency(row.total, row.currency)}
          </span>
        ),
      },
      {
        key: "amount_due",
        header: "Due",
        align: "right",
        render: (_, row) => (
          <span className="text-sm text-[var(--theme-muted-color)]">
            {formatInvoiceCurrency(row.amount_due, row.currency)}
          </span>
        ),
        hideOnMobile: true,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => {
          const customClass = STATUS_BADGE_CLASSES[row.status];
          if (customClass) {
            return (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${customClass}`}
              >
                {getInvoiceStatusLabel(row.status)}
              </span>
            );
          }
          return (
            <StatusPill
              status={getInvoiceStatusLabel(row.status)}
              tone={getInvoiceStatusTone(row.status)}
            />
          );
        },
      },
    ],
    []
  );

  const actions: Action<Invoice>[] = useMemo(() => {
    const baseActions: Action<Invoice>[] = [
      { label: "View", onClick: handleRowClick },
    ];

    if (context !== "client") {
      baseActions.push({
        label: "Mark Paid",
        icon: <CheckCircle size={14} />,
        tone: "success" as const,
        onClick: openMarkPaid,
      });
      baseActions.push({
        label: "Send Reminder",
        icon: <Send size={14} />,
        onClick: (row) => sendReminder.mutate({ id: row.uuid }),
      });
    }

    if (context === "admin") {
      baseActions.push({
        label: "Void",
        icon: <XCircle size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          const reason = window.prompt(
            `Reason for voiding ${row.invoice_number}? (optional)`,
            ""
          );
          if (reason === null) return; // user cancelled
          voidInvoice.mutate({ id: row.uuid, reason: reason || undefined });
        },
      });
    }

    return baseActions;
  }, [context, handleRowClick, openMarkPaid, sendReminder, voidInvoice]);

  const totalInvoices = stats?.total_invoices ?? 0;
  const outstanding = stats?.total_outstanding ?? 0;
  const collected = stats?.total_collected ?? 0;
  const overdueCount = stats?.overdue ?? 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Receipt size={40} className="text-red-400" />
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load invoices."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="db-surface-card rounded-2xl border px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            <Receipt size={14} /> Total Invoices
          </div>
          <div className="mt-2 text-3xl font-semibold text-[var(--theme-heading-color)]">
            {totalInvoices}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
            <Wallet size={14} /> Outstanding
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-950">
            {formatInvoiceCurrency(outstanding)}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            <TrendingUp size={14} /> Collected
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-950">
            {formatInvoiceCurrency(collected)}
          </div>
        </div>
        <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-red-700">
            <AlertTriangle size={14} /> Overdue
          </div>
          <div className="mt-2 text-3xl font-semibold text-red-950">
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Tabs — All / Quotes / Invoices / Paid. Tabs filter client-side
          on top of any explicit status filter so admins can drill in. */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200">
        {TAB_DEFINITIONS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-[var(--theme-color)] text-[var(--theme-color)]"
                  : "border-transparent text-[var(--theme-muted-color)] hover:text-[var(--theme-heading-color)]"
              }`}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="db-surface-card grid grid-cols-1 gap-3 rounded-2xl border p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <ModernInput
            label="Search"
            placeholder="Invoice #, owner, email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} />}
            size="sm"
          />
        </div>
        <ModernSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={(filters.status as string) ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value || undefined,
            }))
          }
          size="sm"
        />
        {context !== "client" && (
          <ModernSelect
            label="Owner Type"
            options={OWNER_TYPE_OPTIONS}
            value={(filters.owner_type as string) ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                owner_type: e.target.value || undefined,
              }))
            }
            size="sm"
          />
        )}
        <ModernInput
          label="From"
          type="date"
          value={filters.from_date ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              from_date: e.target.value || undefined,
            }))
          }
          size="sm"
        />
        <ModernInput
          label="To"
          type="date"
          value={filters.to_date ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              to_date: e.target.value || undefined,
            }))
          }
          size="sm"
        />
      </div>

      {/* Table */}
      <ModernTable<Invoice>
        columns={columns}
        data={visibleInvoices}
        loading={isLoading || isFetching}
        onRowClick={handleRowClick}
        actions={actions}
        emptyState={{
          icon: <Receipt size={48} className="text-[var(--theme-color)]" />,
          title: "No invoices yet",
          description:
            context === "client"
              ? "Your invoices will appear here once issued."
              : "Issued invoices will appear here once created.",
        }}
        headerActions={
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl border border-[rgb(var(--theme-color-200))] bg-white px-3 py-2 text-sm text-[var(--theme-color)] transition hover:bg-[var(--theme-color-10)]"
            aria-label="Refresh invoices"
          >
            <RefreshCw size={14} />
          </button>
        }
      />

      {/* Mark Paid Modal */}
      {paidModalInvoice && (
        <ModernModal
          isOpen
          title={`Mark ${paidModalInvoice.invoice_number} as paid`}
          subtitle={`Outstanding: ${formatInvoiceCurrency(
            paidModalInvoice.amount_due,
            paidModalInvoice.currency
          )}`}
          onClose={closeMarkPaid}
          size="sm"
        >
          <div className="space-y-4">
            <ModernInput
              label="Amount received"
              placeholder="Defaults to outstanding balance"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              type="number"
              size="sm"
            />
            <ModernTextarea
              label="Note (optional)"
              placeholder="Bank transfer reference, cheque #, etc."
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-1">
              <ModernButton variant="secondary" onClick={closeMarkPaid}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={submitMarkPaid}
                isLoading={markPaid.isPending}
              >
                Mark Paid
              </ModernButton>
            </div>
          </div>
        </ModernModal>
      )}
    </div>
  );
};

export default InvoiceList;
