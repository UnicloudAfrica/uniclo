/**
 * InvoiceDetail — Shared invoice detail screen for admin, tenant, and client.
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  Send,
  CheckCircle,
  Download,
  XCircle,
  FileCheck,
  Lock,
  Wallet,
  AlertTriangle,
  Mail,
  Repeat,
} from "lucide-react";
import StatusPill from "@/shared/components/ui/StatusPill";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernTextarea from "@/shared/components/ui/ModernTextarea";
import ModernButton from "@/shared/components/ui/ModernButton";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import {
  useFetchInvoiceById,
  useMarkInvoicePaid,
  useSendInvoiceReminder,
  useDownloadInvoicePdf,
  useVoidInvoice,
  useFinalizeInvoice,
  useConvertQuoteToInvoice,
  formatInvoiceCurrency,
  getInvoiceStatusTone,
  getInvoiceStatusLabel,
  type Invoice,
  type InvoiceItem,
  type InvoiceTransaction,
} from "@/shared/hooks/resources/invoiceHooks";

interface InvoiceDetailProps {
  identifier: string;
  backPath: string;
  context: "admin" | "tenant" | "client";
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  identifier,
  backPath,
  context,
}) => {
  const navigate = useNavigate();
  const query = useFetchInvoiceById(identifier);
  const invoice = query.data as Invoice | undefined;
  const { isLoading, isError, error, refetch } = query;

  const markPaid = useMarkInvoicePaid();
  const sendReminder = useSendInvoiceReminder();
  const voidInvoice = useVoidInvoice();
  const downloadPdf = useDownloadInvoicePdf();
  const finalizeInvoice = useFinalizeInvoice();
  const convertQuote = useConvertQuoteToInvoice();

  const [showPaidModal, setShowPaidModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidNote, setPaidNote] = useState("");

  const reminders = useMemo<
    Array<{ sent_at?: string; channel?: string; note?: string }>
  >(() => {
    const meta = invoice?.metadata as
      | { reminders_sent?: unknown }
      | null
      | undefined;
    const list = meta?.reminders_sent;
    if (!Array.isArray(list)) return [];
    return list.map((entry) => {
      if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        return {
          sent_at: typeof e.sent_at === "string" ? e.sent_at : undefined,
          channel: typeof e.channel === "string" ? e.channel : undefined,
          note: typeof e.note === "string" ? e.note : undefined,
        };
      }
      if (typeof entry === "string") return { sent_at: entry };
      return {};
    });
  }, [invoice?.metadata]);

  const openMarkPaid = () => {
    if (!invoice) return;
    setPaidAmount(String(invoice.amount_due ?? invoice.total ?? ""));
    setPaidNote("");
    setShowPaidModal(true);
  };

  const closeMarkPaid = () => {
    setShowPaidModal(false);
    setPaidAmount("");
    setPaidNote("");
  };

  const submitMarkPaid = () => {
    if (!invoice) return;
    const amountNum = paidAmount.trim() === "" ? undefined : Number(paidAmount);
    markPaid.mutate(
      {
        id: invoice.uuid,
        amount: amountNum,
        note: paidNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          closeMarkPaid();
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return <SkeletonCard className="my-8" />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Receipt size={40} className="text-red-400" />
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load invoice."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-16 text-center text-[var(--theme-muted-color)]">
        Invoice not found.
      </div>
    );
  }

  const items: InvoiceItem[] = invoice.items ?? [];
  const transactions: InvoiceTransaction[] = invoice.transactions ?? [];

  const ownerName =
    invoice.owner_name ??
    invoice.invoiceable?.name ??
    invoice.invoiceable?.company_name ??
    invoice.tenant?.name ??
    "Unknown owner";
  const ownerEmail = invoice.owner_email ?? invoice.invoiceable?.email ?? "";

  const isQuoteLike = invoice.status === "quote" || invoice.status === "accepted";

  // Quotes / accepted-quotes are not payable until they convert into a
  // full invoice — hide the Mark Paid / Send Reminder controls while
  // the document is still a quote.
  const isPayable =
    !isQuoteLike &&
    invoice.status !== "paid" &&
    invoice.status !== "void" &&
    invoice.status !== "refunded";

  const canFinalize = context === "admin" && invoice.status === "draft";
  const canVoid =
    context === "admin" &&
    invoice.status !== "paid" &&
    invoice.status !== "void" &&
    invoice.status !== "refunded";

  // Conversion is available to both admin and tenant contexts because both
  // can issue quotes via the wizard. Clients view but cannot convert.
  const canConvertQuote = context !== "client" && isQuoteLike;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1 text-sm text-[var(--theme-muted-color)] transition hover:text-[var(--theme-color)]"
      >
        <ArrowLeft size={14} /> Back to invoices
      </button>

      {/* Header */}
      <div className="db-surface-card flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Receipt size={28} className="text-[var(--theme-color)]" />
            <h1 className="text-2xl font-semibold text-[var(--theme-heading-color)]">
              {/* Quotes display the quote number; once converted the row
                  carries an invoice number and the heading flips. */}
              {isQuoteLike
                ? invoice.quote_number ?? invoice.invoice_number ?? "—"
                : invoice.invoice_number ?? invoice.quote_number ?? "—"}
            </h1>
            <StatusPill
              status={getInvoiceStatusLabel(invoice.status)}
              tone={getInvoiceStatusTone(invoice.status)}
            />
          </div>
          <div className="text-sm text-[var(--theme-muted-color)]">
            <div>
              <span className="font-medium text-[var(--theme-heading-color)]">
                {ownerName}
              </span>
              {ownerEmail ? (
                <>
                  {" "}
                  · <span>{ownerEmail}</span>
                </>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>Issued: {formatDate(invoice.issue_date)}</span>
              <span>Due: {formatDate(invoice.due_date)}</span>
              {typeof invoice.days_overdue === "number" &&
              invoice.days_overdue > 0 ? (
                <span className="font-medium text-red-600">
                  {invoice.days_overdue} day
                  {invoice.days_overdue === 1 ? "" : "s"} overdue
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            Total
          </div>
          <div className="text-3xl font-semibold text-[var(--theme-heading-color)]">
            {formatInvoiceCurrency(invoice.total, invoice.currency)}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="db-surface-card flex flex-wrap items-center gap-2 rounded-2xl border p-3 shadow-sm">
        {context !== "client" && isPayable && (
          <ModernButton
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle size={14} />}
            onClick={openMarkPaid}
            isLoading={markPaid.isPending}
          >
            Mark Paid
          </ModernButton>
        )}

        {context !== "client" && isPayable && (
          <ModernButton
            variant="secondary"
            size="sm"
            leftIcon={<Send size={14} />}
            onClick={() => sendReminder.mutate({ id: invoice.uuid })}
            isLoading={sendReminder.isPending}
          >
            Send Reminder
          </ModernButton>
        )}

        {/* Download / preview the PDF — works regardless of whether
            the wizard persisted a `pdf_path`. The backend renders on
            demand, then the hook streams the binary to a Blob. */}
        <ModernButton
          variant="secondary"
          size="sm"
          leftIcon={<Download size={14} />}
          onClick={() => {
            const docNumber =
              invoice.status === "quote" || invoice.status === "accepted"
                ? invoice.quote_number ?? invoice.invoice_number ?? invoice.uuid
                : invoice.invoice_number ?? invoice.quote_number ?? invoice.uuid;
            const isQuote =
              invoice.status === "quote" || invoice.status === "accepted";
            const filename = `${isQuote ? "Quote" : "Invoice"}-${docNumber}.pdf`;
            downloadPdf.mutate({ id: invoice.uuid, filename });
          }}
          isLoading={downloadPdf.isPending}
        >
          Download PDF
        </ModernButton>

        {canConvertQuote && (
          <ModernButton
            variant="primary"
            size="sm"
            leftIcon={<Repeat size={14} />}
            onClick={() =>
              convertQuote.mutate(
                { id: invoice.uuid },
                {
                  onSuccess: () => {
                    // Stay on the same detail page — the row is now an
                    // invoice and the URL is keyed by uuid which doesn't
                    // change. Refetch surfaces the new invoice number,
                    // status, and accepted_at timestamp.
                    refetch();
                  },
                }
              )
            }
            isLoading={convertQuote.isPending}
          >
            Convert to Invoice
          </ModernButton>
        )}

        {canFinalize && (
          <ModernButton
            variant="secondary"
            size="sm"
            leftIcon={<FileCheck size={14} />}
            onClick={() => finalizeInvoice.mutate({ id: invoice.uuid })}
            isLoading={finalizeInvoice.isPending}
          >
            Finalize
          </ModernButton>
        )}

        {canVoid && (
          <ModernButton
            variant="secondary"
            size="sm"
            leftIcon={<XCircle size={14} />}
            onClick={() => {
              const reason = window.prompt(
                "Reason for voiding this invoice? (optional)",
                ""
              );
              if (reason === null) return;
              voidInvoice.mutate({
                id: invoice.uuid,
                reason: reason || undefined,
              });
            }}
            isLoading={voidInvoice.isPending}
          >
            Void
          </ModernButton>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="db-surface-card rounded-2xl border p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
              Line items
            </h2>
            {items.length === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--theme-muted-color)]">
                No line items recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--theme-color-100))] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
                      <th className="py-2 pr-3">Item</th>
                      <th className="py-2 pr-3 text-right">Qty</th>
                      <th className="py-2 pr-3 text-right">Unit Price</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[rgb(var(--theme-color-50))] last:border-0"
                      >
                        <td className="py-3 pr-3 align-top">
                          <div className="font-medium text-[var(--theme-heading-color)]">
                            {item.product_name}
                          </div>
                          {item.description ? (
                            <div className="mt-0.5 text-xs text-[var(--theme-muted-color)]">
                              {item.description}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums">
                          {String(item.quantity)} {item.unit ?? ""}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums">
                          {formatInvoiceCurrency(
                            item.unit_price,
                            invoice.currency
                          )}
                        </td>
                        <td className="py-3 text-right font-medium tabular-nums text-[var(--theme-heading-color)]">
                          {formatInvoiceCurrency(
                            item.subtotal,
                            invoice.currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes / terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="db-surface-card rounded-2xl border p-5 shadow-sm">
              {invoice.notes ? (
                <>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
                    Notes
                  </h3>
                  <p className="whitespace-pre-line text-sm text-[var(--theme-heading-color)]">
                    {invoice.notes}
                  </p>
                </>
              ) : null}
              {invoice.terms ? (
                <div className={invoice.notes ? "mt-4" : ""}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
                    Terms
                  </h3>
                  <p className="whitespace-pre-line text-sm text-[var(--theme-heading-color)]">
                    {invoice.terms}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right: totals + sidebars */}
        <div className="space-y-6">
          <div className="db-surface-card rounded-2xl border p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
              <Wallet size={14} /> Totals
            </h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--theme-muted-color)]">Subtotal</dt>
                <dd className="tabular-nums text-[var(--theme-heading-color)]">
                  {formatInvoiceCurrency(invoice.subtotal, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--theme-muted-color)]">Tax</dt>
                <dd className="tabular-nums text-[var(--theme-heading-color)]">
                  {formatInvoiceCurrency(invoice.tax_amount, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--theme-muted-color)]">Discount</dt>
                <dd className="tabular-nums text-[var(--theme-heading-color)]">
                  -
                  {formatInvoiceCurrency(
                    invoice.discount_amount,
                    invoice.currency
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[rgb(var(--theme-color-100))] pt-2 font-semibold">
                <dt className="text-[var(--theme-heading-color)]">Total</dt>
                <dd className="tabular-nums text-[var(--theme-heading-color)]">
                  {formatInvoiceCurrency(invoice.total, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between text-emerald-700">
                <dt>Amount paid</dt>
                <dd className="tabular-nums">
                  {formatInvoiceCurrency(
                    invoice.amount_paid,
                    invoice.currency
                  )}
                </dd>
              </div>
              <div className="flex justify-between text-amber-700">
                <dt>Amount due</dt>
                <dd className="tabular-nums font-semibold">
                  {formatInvoiceCurrency(invoice.amount_due, invoice.currency)}
                </dd>
              </div>
              {invoice.paid_at ? (
                <div className="flex justify-between text-xs text-[var(--theme-muted-color)]">
                  <dt>Paid at</dt>
                  <dd>{formatDateTime(invoice.paid_at)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {invoice.fx_rate ? (
            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/80 p-5 shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-700">
                <Lock size={14} /> FX Lock
              </h3>
              <dl className="space-y-1 text-sm text-indigo-950">
                <div className="flex justify-between">
                  <dt>Rate</dt>
                  <dd className="tabular-nums">{String(invoice.fx_rate)}</dd>
                </div>
                {invoice.fx_source_currency ? (
                  <div className="flex justify-between">
                    <dt>Source</dt>
                    <dd>{invoice.fx_source_currency}</dd>
                  </div>
                ) : null}
                {invoice.fx_display_currency ? (
                  <div className="flex justify-between">
                    <dt>Display</dt>
                    <dd>{invoice.fx_display_currency}</dd>
                  </div>
                ) : null}
                {invoice.fx_locked_at ? (
                  <div className="flex justify-between text-xs">
                    <dt>Locked</dt>
                    <dd>{formatDateTime(invoice.fx_locked_at)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {/* Payment history */}
          <div className="db-surface-card rounded-2xl border p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
              <CheckCircle size={14} /> Payment history
            </h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-[var(--theme-muted-color)]">
                No payments recorded yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-start justify-between gap-3 border-b border-[rgb(var(--theme-color-50))] pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-[var(--theme-heading-color)]">
                        {formatInvoiceCurrency(
                          tx.amount,
                          tx.currency ?? invoice.currency
                        )}
                      </div>
                      <div className="text-xs text-[var(--theme-muted-color)]">
                        {formatDateTime(tx.paid_at ?? tx.created_at)}
                        {tx.reference ? ` · ${tx.reference}` : ""}
                      </div>
                    </div>
                    {tx.status ? (
                      <StatusPill status={tx.status} tone="success" />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reminder history */}
          {reminders.length > 0 ? (
            <div className="db-surface-card rounded-2xl border p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--theme-muted-color)]">
                <Mail size={14} /> Reminders
              </h3>
              <ul className="space-y-2 text-sm">
                {reminders.map((reminder, idx) => (
                  <li
                    key={`${reminder.sent_at ?? "reminder"}-${idx}`}
                    className="flex items-start justify-between gap-3 border-b border-[rgb(var(--theme-color-50))] pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-[var(--theme-heading-color)]">
                        {reminder.channel ?? "Reminder sent"}
                      </div>
                      <div className="text-xs text-[var(--theme-muted-color)]">
                        {formatDateTime(reminder.sent_at)}
                      </div>
                      {reminder.note ? (
                        <div className="mt-0.5 text-xs text-[var(--theme-muted-color)]">
                          {reminder.note}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {invoice.status === "overdue" ? (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                This invoice is overdue. Please follow up with the customer.
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mark Paid Modal */}
      {showPaidModal && (
        <ModernModal
          isOpen
          title={`Mark ${invoice.invoice_number} as paid`}
          subtitle={`Outstanding: ${formatInvoiceCurrency(
            invoice.amount_due,
            invoice.currency
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

export default InvoiceDetail;
