import React from "react";
import { Download, CheckCircle, FileText } from "lucide-react";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";

const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const downloadPdf = (base64String, filename) => {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const TotalsCard = ({ amounts }) => (
  <div className="w-full max-w-xs space-y-2">
    {amounts.pre_discount_subtotal &&
      amounts.pre_discount_subtotal !== amounts.subtotal && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Subtotal before discount</span>
          <span className="font-medium text-slate-700">
            {formatCurrency(amounts.pre_discount_subtotal, amounts.currency)}
          </span>
        </div>
      )}
    {amounts.discount > 0 && (
      <div className="flex items-center justify-between text-sm text-amber-600">
        <span>{amounts.discount_label || "Discount"}</span>
        <span className="font-semibold">
          -{formatCurrency(amounts.discount, amounts.currency)}
        </span>
      </div>
    )}
    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm text-slate-600">
      <span>Subtotal</span>
      <span className="font-semibold">
        {formatCurrency(amounts.subtotal, amounts.currency)}
      </span>
    </div>
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>Tax</span>
      <span className="font-semibold">
        {formatCurrency(amounts.tax, amounts.currency)}
      </span>
    </div>
    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
      <span>Total</span>
      <span>{formatCurrency(amounts.total, amounts.currency)}</span>
    </div>
  </div>
);

const QuoteBreakdownStep = ({ apiResponse }) => {
  if (!apiResponse?.invoices?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
        No quote details available yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Quote generated successfully
        </h3>
        <p className="text-sm text-slate-500">
          Review the generated documents below or download them for sharing.
        </p>
      </div>

      <div className="space-y-6">
        {apiResponse.invoices.map((invoiceData) => {
          const invoice = invoiceData.payload;
          return (
            <ModernCard
              key={invoice.invoice_number}
              padding="xl"
              className="space-y-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Quote
                  </p>
                  <h4 className="text-xl font-semibold text-slate-900">
                    {invoice.subject || "Generated Quote"}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Invoice #{invoice.invoice_number}
                  </p>
                </div>
                {invoiceData.pdf && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() =>
                      downloadPdf(
                        invoiceData.pdf,
                        invoiceData.filename || "quote.pdf"
                      )
                    }
                  >
                    Download PDF
                  </ModernButton>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Bill to
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {invoice.bill_to.name}
                  </p>
                  <p className="text-xs text-slate-500">{invoice.bill_to.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Timeline
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Issued{" "}
                    <span className="font-medium text-slate-900">
                      {new Date(invoice.issued_at).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Due{" "}
                    <span className="font-medium text-slate-900">
                      {new Date(invoice.due_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Item</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Unit price
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {invoice.line_items.map((item, idx) => (
                      <tr key={`${item.name}-${idx}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(item.unit_amount, item.currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(item.total, item.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Generated via multi-quote workflow
                </div>
                <TotalsCard amounts={invoice.amounts} />
              </div>
            </ModernCard>
          );
        })}
      </div>
    </div>
  );
};

export default QuoteBreakdownStep;
