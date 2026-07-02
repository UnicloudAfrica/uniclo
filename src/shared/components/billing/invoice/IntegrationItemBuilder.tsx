import React, { useMemo, useState } from "react";
import { Plus, Puzzle } from "lucide-react";
import { ModernInput, ModernButton } from "../../ui";
import type { IntegrationLineRequest } from "../types";
import type { IntegrationProductRow } from "@/shared/hooks/resources/integrationProductHooks";

const selectClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** AnyCloudFlow-style bucket surcharge products publish a GB threshold. */
function hasSurcharge(product?: IntegrationProductRow): boolean {
  const tiers = product?.pricing_tiers;
  return (
    !!tiers &&
    typeof tiers === "object" &&
    "surcharge_threshold_gb" in (tiers as Record<string, unknown>)
  );
}

interface IntegrationItemBuilderProps {
  products: IntegrationProductRow[];
  isFetching: boolean;
  onAdd: (item: IntegrationLineRequest) => void;
}

/**
 * Generic picker for IntegrationProduct add-on line items. Any integration
 * service (Shield, AnyCloudFlow, …) with a published price can be added to
 * the quote/invoice; the backend re-prices it authoritatively at submit.
 */
const IntegrationItemBuilder: React.FC<IntegrationItemBuilderProps> = ({
  products,
  isFetching,
  onAdd,
}) => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [months, setMonths] = useState("1");
  const [bucketSizeGb, setBucketSizeGb] = useState("");

  const selected = useMemo(
    () => products.find((p) => String(p.id) === productId),
    [products, productId]
  );

  // Group by integration key so the dropdown reads as a generic catalog.
  const grouped = useMemo(() => {
    const map = new Map<string, IntegrationProductRow[]>();
    for (const product of products) {
      const key = product.integration_key || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(product);
    }
    return Array.from(map.entries());
  }, [products]);

  const isMonthly = selected?.billing_model === "monthly_flat";
  const showBucket = hasSurcharge(selected);

  const handleAdd = () => {
    if (!selected) return;
    const qty = Math.max(1, Number(quantity) || 1);
    const mo = Math.max(1, Number(months) || 1);
    const billingMonths = isMonthly ? mo : 1;
    const unitPrice = Number(selected.price ?? 0);

    const summaryParts = [`${formatMoney(unitPrice, selected.currency_code)} × ${qty}`];
    if (isMonthly) summaryParts.push(`${billingMonths} mo`);

    const item: IntegrationLineRequest = {
      integration_product_id: selected.id,
      quantity: qty,
      months: mo,
      _display: {
        name: selected.name,
        unit_summary: summaryParts.join(" · "),
      },
    };
    if (showBucket && bucketSizeGb !== "") {
      item.bucket_size_gb = Math.max(0, Number(bucketSizeGb) || 0);
    }

    onAdd(item);
    setProductId("");
    setQuantity("1");
    setMonths("1");
    setBucketSizeGb("");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 flex items-start gap-3">
        <span className="rounded-xl bg-primary-50 p-2 text-primary-600">
          <Puzzle className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Add Integration Product</h3>
          <p className="text-sm text-slate-500">
            Shield, AnyCloudFlow and other add-on services. Final price is confirmed at submit.
          </p>
        </div>
      </header>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Integration Service <span className="text-red-500">*</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={selectClass}
            disabled={isFetching}
          >
            <option value="">
              {isFetching ? "Loading services…" : "Select an integration service"}
            </option>
            {grouped.map(([key, items]) => (
              <optgroup key={key} label={key}>
                {items.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.unit_label ? ` (${product.unit_label})` : ""}
                    {product.price != null
                      ? ` — ${formatMoney(Number(product.price), product.currency_code)}`
                      : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {!isFetching && products.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">No priced integration services available.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ModernInput
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {isMonthly && (
            <ModernInput
              label="Months"
              type="number"
              min="1"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          )}
        </div>

        {showBucket && (
          <ModernInput
            label="Bucket size (GB)"
            type="number"
            min="0"
            value={bucketSizeGb}
            onChange={(e) => setBucketSizeGb(e.target.value)}
            placeholder="e.g. 1500 — surcharge applies above the included threshold"
          />
        )}

        <ModernButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleAdd}
          isDisabled={!selected}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add to Invoice
        </ModernButton>
      </div>
    </div>
  );
};

export default IntegrationItemBuilder;
