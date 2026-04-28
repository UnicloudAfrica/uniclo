import React from "react";
import { FileText } from "lucide-react";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";

/**
 * PaymentLineItemsTable - Reusable component for displaying invoice/quote line items
 * Can be used across Admin, Tenant, and Client dashboards for invoices, quotes, and payment confirmations
 *
 * Amounts render through `<PriceLabel>` so every call site benefits from
 * the stable-rate display guarantee. When a consumer has already
 * materialised a `PriceDTO` envelope (e.g. from `InvoiceItemResource`),
 * pass it via `item.unitEnvelope` / `item.totalEnvelope` — the label
 * renders the pre-computed `formatted_display` and skips the hook's
 * network call entirely.
 */
interface PriceEnvelope {
  amount_display: number | null;
  currency_display: string;
  formatted_display: string | null;
  fx_source: string;
}

interface LineItem {
  id?: string | number;
  name: string;
  description?: string;
  quantity: number;
  unitAmount: number;
  total: number;
  currency?: string;
  /** Optional PriceDTO envelope for the unit price. Preferred over raw `unitAmount` when available. */
  unitEnvelope?: PriceEnvelope;
  /** Optional PriceDTO envelope for the line total. Preferred over raw `total` when available. */
  totalEnvelope?: PriceEnvelope;
}

interface PaymentLineItemsTableProps {
  items: LineItem[];
  currency?: string;
  loading?: boolean;
  showDescription?: boolean;
  emptyMessage?: string;
}

/**
 * Legacy currency formatter retained as the PriceLabel fallback's own
 * fallback — when neither an envelope nor a published rate is available
 * (offline-ish or no rate published), `PriceLabel` renders the source
 * amount using `Intl.NumberFormat` internally; this helper stays for
 * places that still accept only a raw number + code.
 */
const formatCurrency = (amount: number | undefined, currency = "USD") => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const envelopeFrom = (
  amount: number | undefined,
  code: string,
): PriceEnvelope | undefined => {
  if (amount === null || amount === undefined) return undefined;
  return {
    amount_display: amount,
    currency_display: code,
    formatted_display: formatCurrency(amount, code),
    fx_source: "identity",
  };
};

const PaymentLineItemsTable: React.FC<PaymentLineItemsTableProps> = ({
  items,
  currency = "USD",
  loading = false,
  showDescription = true,
  emptyMessage = "No line items",
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <FileText className="h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Item</th>
            <th className="px-4 py-3 text-right font-medium">Qty</th>
            <th className="px-4 py-3 text-right font-medium">Unit price</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item, idx) => {
            const itemCurrency = item.currency ?? currency;
            const unitEnv =
              item.unitEnvelope ?? envelopeFrom(item.unitAmount, itemCurrency);
            const totalEnv =
              item.totalEnvelope ?? envelopeFrom(item.total, itemCurrency);

            return (
              <tr key={item.id ?? idx}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {showDescription && item.description && (
                    <p className="text-xs text-slate-500">{item.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-600">
                  <PriceLabel
                    amount={item.unitAmount}
                    sourceCurrency={itemCurrency}
                    envelope={unitEnv}
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  <PriceLabel
                    amount={item.total}
                    sourceCurrency={itemCurrency}
                    envelope={totalEnv}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentLineItemsTable;
