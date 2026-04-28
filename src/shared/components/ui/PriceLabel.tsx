import { useFormatPrice } from "@/hooks/useFormatPrice";

export interface PriceLabelProps {
  /**
   * Amount denominated in `sourceCurrency`. Pass the raw number — the
   * component handles FX conversion + formatting internally.
   */
  amount: number;
  /** ISO 4217 currency code of `amount` (e.g. "USD"). */
  sourceCurrency: string;
  /**
   * Optional `PriceDTO` envelope already materialised by the backend
   * (via `EmitsPriceDTO`). When supplied the component renders the
   * pre-computed `formatted_display` string directly — preferred for
   * resources that ship it already.
   */
  envelope?: {
    amount_display: number | null;
    currency_display: string;
    formatted_display: string | null;
    fx_source: string;
  };
  className?: string;
  /**
   * Show a small tooltip explaining the locked/live/published rate
   * source. Defaults to false — opt in on invoice detail views.
   */
  showFxSource?: boolean;
}

/**
 * Stable-rate price renderer. When the backend already shipped a
 * `formatted_display`, we use it verbatim (cheapest path + respects
 * locked invoice rates). Otherwise `useFormatPrice` looks up the
 * current published rate (1h cached) and formats according to the
 * user's display currency preference.
 *
 * Always calls the hook so React's rules-of-hooks ordering is stable,
 * but drops its result when an envelope is supplied.
 */
export function PriceLabel({
  amount,
  sourceCurrency,
  envelope,
  className,
  showFxSource = false,
}: PriceLabelProps) {
  // Always call the hook — React rules-of-hooks require unconditional
  // ordering. When `envelope` is supplied we disable the network fetch
  // and ignore the hook result (render from the envelope instead).
  const live = useFormatPrice(amount, sourceCurrency, { enabled: !envelope });

  if (envelope?.formatted_display) {
    return (
      <span className={className} title={showFxSource ? envelope.fx_source : undefined}>
        {envelope.formatted_display}
      </span>
    );
  }

  return (
    <span
      className={className}
      title={
        showFxSource ? (live.fallback ? "live fallback" : "published") : undefined
      }
    >
      {live.formatted}
    </span>
  );
}

export default PriceLabel;
