import { useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  Wallet,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import { ModernButton, ModernCard, ResourceEmptyState } from "@/shared/components/ui";
import ModernTable from "@/shared/components/ui/ModernTable";
import {
  useDownloadAdminTransactionReceipt,
  useFetchAdminTransaction,
} from "@/hooks/adminHooks/paymentHooks";
import { designTokens } from "@/styles/designTokens";

const formatCurrency = (amount: number | string | null | undefined, currency = "NGN") => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  const symbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₦";
  return `${symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDateTime = (value: string | number | Date | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusPalette = {
  successful: {
    bg: "bg-emerald-100/70",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  completed: {
    bg: "bg-emerald-100/70",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  paid: {
    bg: "bg-emerald-100/70",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  processing: {
    bg: "bg-amber-100/80",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  pending: {
    bg: "bg-amber-100/80",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  failed: {
    bg: "bg-rose-100/80",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  default: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};
const StatusPill = ({ status }: { status: string }) => {
  if (!status) return null;
  const normalizedStatus = String(status).toLowerCase() as keyof typeof statusPalette;
  const tone = statusPalette[normalizedStatus] || statusPalette.default;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone.bg} ${tone.text} ${tone.border}`}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {status.replaceAll("_", " ")}
    </span>
  );
};
export default function AdminPaymentDetails() {
  const navigate = useNavigate();
  const { transactionId } = useParams();

  const {
    data,
    isFetching,
    isError,
    refetch: refetchTransaction,
  } = useFetchAdminTransaction(transactionId);

  const { mutate: downloadReceipt, isPending: isDownloadingReceipt } =
    useDownloadAdminTransactionReceipt();

  const paymentData = data as Record<string, unknown>;
  const transaction = paymentData?.transaction ?? {};
  const payment = paymentData?.payment ?? {};
  const lineItems = paymentData?.line_items ?? paymentData?.order?.items ?? [];
  const totals = paymentData?.totals ?? {};
  const currency = paymentData?.currency ?? transaction.currency ?? "NGN";
  const user = paymentData?.user ?? {};

  const metrics = useMemo(() => {
    return [
      {
        label: "Total Paid",
        value: formatCurrency(totals.total ?? transaction.amount, currency),
        description: "Amount charged for this invoice",
        icon: <Wallet className="h-4 w-4" />,
      },
      {
        label: "Status",
        value: (transaction.status || "Pending").replaceAll("_", " "),
        description: `Updated ${formatDateTime(transaction.updated_at)}`,
        icon: <BadgeCheck className="h-4 w-4" />,
      },
      {
        label: "Created",
        value: formatDateTime(transaction.created_at),
        description: payment.reference
          ? `Reference ${payment.reference}`
          : "Awaiting reference sync",
        icon: <CalendarDays className="h-4 w-4" />,
      },
    ];
  }, [
    totals.total,
    transaction.amount,
    transaction.status,
    transaction.updated_at,
    transaction.created_at,
    payment.reference,
    currency,
  ]);

  const breadcrumbs = useMemo(() => {
    return [
      { label: "Home", href: "/admin-dashboard" },
      { label: "Payment", href: "/admin-dashboard/payment" },
      {
        label: transaction.identifier ? `Receipt ${transaction.identifier}` : "Payment Details",
      },
    ];
  }, [transaction.identifier]);

  const handleDownloadReceipt = useCallback(() => {
    if (!transaction.identifier && !transaction.id) return;
    const identifier = transaction.identifier || transaction.id;
    downloadReceipt(identifier, {
      onSuccess: (buffer) => {
        const blob = new Blob([buffer as BlobPart], { type: "application/pdf" });
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
  }, [downloadReceipt, transaction.identifier, transaction.id]);

  const summaryItems = [
    {
      label: "Customer",
      value: user.name || "—",
      helper: user.email || null,
    },
    {
      label: "Gateway",
      value: payment.gateway || transaction.payment_gateway || "—",
      helper: payment.method || transaction.payment_type || null,
    },
    {
      label: "Reference",
      value: payment.reference || transaction.reference || "—",
      helper: payment.metadata?.payment_url || payment.metadata?.payment_url || null,
    },
    {
      label: "Transaction ID",
      value: transaction.identifier || transaction.id || "—",
      helper: `Type: ${(transaction.type || "—").replaceAll("_", " ")}`,
    },
  ];

  const renderLineItems = () => {
    if (!lineItems?.length) {
      return (
        <ResourceEmptyState
          title="No billable line items found"
          message="This payment does not include any tracked services or the record is still syncing. Refresh in a few moments to try again."
        />
      );
    }

    const columns = [
      {
        key: "description",
        header: "SERVICE",
        render: (_: unknown, item: Record<string, unknown>) => (
          <div>
            <p className="font-semibold text-slate-900">{item.description || "Service charge"}</p>
            {item.itemable?.identifier && (
              <span className="text-xs text-slate-500">Ref • {item.itemable.identifier}</span>
            )}
          </div>
        ),
      },
      {
        key: "frequency",
        header: "FREQUENCY",
        render: (val: string) => (
          <span className="text-slate-600">{(val || "Recurring").replaceAll("_", " ")}</span>
        ),
      },
      {
        key: "quantity",
        header: "QTY",
        align: "right",
        render: (val: number | string | null | undefined) => (
          <span className="text-slate-600">{val ?? 1}</span>
        ),
      },
      {
        key: "unit_price",
        header: "UNIT PRICE",
        align: "right",
        render: (val: number | string | null | undefined) => (
          <span className="text-slate-600">{formatCurrency(val ?? 0, currency)}</span>
        ),
      },
      {
        key: "subtotal",
        header: "LINE TOTAL",
        align: "right",
        render: (val: number | string | null | undefined) => (
          <span className="font-semibold text-slate-900">{formatCurrency(val ?? 0, currency)}</span>
        ),
      },
    ];

    const normalizedLineItems = lineItems.map((item: Record<string, unknown>, idx: number) => ({
      ...item,
      id: item.identifier || idx,
    }));

    return (
      <ModernTable
        data={normalizedLineItems}
        columns={columns as unknown}
        searchable={false}
        filterable={false}
        exportable={false}
        paginated={false}
        enableAnimations={false}
      />
    );
  };
  const renderInstances = () => {
    if (!paymentData?.instances?.length) {
      return null;
    }

    const instanceColumns = [
      {
        key: "name",
        header: "INSTANCE",
        render: (_: unknown, instance: Record<string, unknown>) => (
          <div>
            <p className="font-semibold text-slate-900">{instance.name || instance.identifier}</p>
            <span className="text-xs text-slate-500">{instance.identifier}</span>
          </div>
        ),
      },
      {
        key: "region",
        header: "REGION",
        render: (val: string) => <span className="text-slate-600 uppercase">{val || "—"}</span>,
      },
      {
        key: "provider",
        header: "PROVIDER",
        render: (val: string) => <span className="text-slate-600">{val || "—"}</span>,
      },
      {
        key: "status",
        header: "STATUS",
        render: (val: string) => <span className="text-slate-600 capitalize">{val || "—"}</span>,
      },
    ];

    const instanceData = paymentData.instances.map((i: Record<string, unknown>) => ({
      ...i,
      id: i.identifier || i.id,
    }));

    return (
      <ModernCard className="space-y-4 border border-slate-200/70 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Linked resources
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Instances tied to this payment</h3>
            <p className="text-sm text-slate-500">
              Review which workloads were provisioned as part of this transaction.
            </p>
          </div>
        </div>
        <ModernTable
          data={instanceData}
          columns={instanceColumns as unknown}
          searchable={false}
          filterable={false}
          exportable={false}
          paginated={false}
          enableAnimations={false}
        />
      </ModernCard>
    );
  };
  return (
    <AdminPageShell
      title="Payment Detail"
      description="Drill into a payment to review customer, gateway, and provisioning data in one place."
      breadcrumbs={breadcrumbs}
      contentClassName="space-y-8"
      subHeaderContent={
        <ModernButton
          variant="ghost"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </ModernButton>
      }
    >
      {isError ? (
        <ModernCard className="flex flex-col items-center justify-center gap-4 border border-rose-200 bg-rose-50/80 py-12 text-center text-rose-700">
          <p className="text-lg font-semibold">Unable to load payment</p>
          <p className="text-sm max-w-lg text-rose-600">
            We couldn't retrieve this payment record. It may have been removed or there may be a
            temporary service disruption.
          </p>
          <ModernButton onClick={() => refetchTransaction()}>Retry</ModernButton>
        </ModernCard>
      ) : (
        <>
          <ResourceHero
            title={transaction.identifier ? `Receipt ${transaction.identifier}` : "Payment receipt"}
            subtitle="Billing"
            description="Review the payment timeline, gateway responses, services fulfilled, and download an official receipt with the UniCloud brand."
            metrics={metrics}
            accent="midnight"
            rightSlot={
              <ModernButton
                onClick={handleDownloadReceipt}
                disabled={isDownloadingReceipt || isFetching}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {isDownloadingReceipt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download receipt
              </ModernButton>
            }
          />

          <ModernCard className="space-y-6 border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment summary
                </p>
                <h2 className="text-lg font-semibold text-slate-900">Core payment properties</h2>
                <p className="text-sm text-slate-500">
                  Quickly review who paid, how it was processed, and any gateway references tied to
                  the charge.
                </p>
              </div>
              <StatusPill status={transaction.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryItems.map((item: { label: string; value: string; helper: string | null }) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                  {item.helper && <p className="mt-1 text-xs text-slate-500">{item.helper}</p>}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <ModernButton
                variant="outline"
                className="inline-flex items-center gap-2"
                onClick={() => refetchTransaction()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Refresh payment state
              </ModernButton>
            </div>
          </ModernCard>

          <ModernCard className="space-y-6 border border-slate-200/80 bg-white/95 shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Charges
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Billable services included</h2>
              <p className="text-sm text-slate-500">
                Each line item represents an infrastructure component or add-on that was billed as
                part of this transaction.
              </p>
            </div>
            {renderLineItems()}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subtotal
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrency(totals.subtotal ?? transaction.amount, currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Taxes & fees
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrency((totals.tax ?? 0) + (totals.fees ?? 0), currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total billed
                </p>
                <p
                  className="mt-2 text-lg font-semibold"
                  style={{ color: designTokens.colors["primary"]?.[600] ?? "var(--theme-color)" }}
                >
                  {formatCurrency(totals.total ?? transaction.amount, currency)}
                </p>
              </div>
            </div>
          </ModernCard>

          {renderInstances()}
        </>
      )}
    </AdminPageShell>
  );
}
