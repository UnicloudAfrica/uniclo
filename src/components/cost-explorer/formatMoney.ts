/**
 * Shared money formatter for the PUBLIC cost explorer.
 *
 * The cost explorer is unauthenticated, so it cannot use `useFormatPrice`
 * (which reads the logged-in user's display-currency preference + hits the
 * FX endpoint). Instead we format each amount from the currency CODE that
 * rides on the pricing record / cart item — never a hardcoded symbol.
 *
 * Public pricing responses default to NGN and most don't carry a currency
 * field yet; callers pass the record's `currency` when present and fall
 * back to the literal the API is documented to serve ("NGN"). When a third
 * currency ever appears in the data, this formatter renders it correctly
 * instead of the old binary NGN-vs-USD symbol switch.
 *
 * Locale is `en-NG` to match `useFormatPrice`'s formatting; with
 * `style: "currency"` the runtime picks the right symbol from the code
 * (naira for NGN, US$ for USD, etc.).
 */
export function formatMoney(amount: number, currency = "NGN"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const code = (currency || "NGN").toUpperCase();
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Unknown ISO code — render the code as a prefix rather than throw.
    return `${code} ${value.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export default formatMoney;
