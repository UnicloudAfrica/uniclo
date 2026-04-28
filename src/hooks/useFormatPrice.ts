import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import silentApi from "../index/silent";
import { CURRENCY_TABLE, useCurrency } from "./useCurrency";
import type { PublishedFxRateResponse } from "../shared/types/pricing";

/**
 * Format a price for display, respecting the user's preferred currency
 * (Part I hook). Calls the public `/api/v1/exchange-rates/published`
 * endpoint which returns a STABLE admin-controlled rate — so repeated
 * renders during a published-rate window all show the same amount.
 *
 * React Query caches the rate for 1 hour client-side; combined with the
 * server-side 60/min throttle on the public group, the hook is safe to
 * call from every component that renders a price.
 *
 * When the hook is given an amount ALREADY in the user's display
 * currency (`sourceCurrency === display code`), it short-circuits and
 * renders directly — no network call is made.
 */

export interface UseFormatPriceResult {
  /** Display amount after conversion (or source amount if identity). */
  displayAmount: number | null;
  /** Display currency code (e.g. "NGN"). */
  displayCurrency: string;
  /** Pre-formatted string ready to drop into a React node. */
  formatted: string;
  /** FX rate used, or 1.0 for identity. Null while loading. */
  rate: number | null;
  /** True while the rate lookup is pending. */
  isLoading: boolean;
  /** True if we fell back to the source amount (e.g. no rate published yet). */
  fallback: boolean;
}

export function useFormatPrice(
  amount: number,
  sourceCurrency: string,
  options: { enabled?: boolean } = {},
): UseFormatPriceResult {
  const { code: target, symbol, precision } = useCurrency();
  const normalizedSource = sourceCurrency.toUpperCase();

  const identity = normalizedSource === target;
  const hookEnabled = options.enabled ?? true;

  // Only fetch the rate when we actually need to convert. Callers that
  // already have a PriceDTO envelope pass { enabled: false } so no
  // network call is made.
  const { data, isLoading } = useQuery<PublishedFxRateResponse | null>({
    queryKey: ["exchange-rates", "published", normalizedSource, target],
    queryFn: async () => {
      try {
        const res = await silentApi<{ data: PublishedFxRateResponse | null }>(
          "GET",
          `/exchange-rates/published?source_currency=${normalizedSource}&target_currency=${target}`,
        );
        return res?.data ?? null;
      } catch {
        // Endpoint returns 404 when no rate is published — treat as null.
        return null;
      }
    },
    enabled: hookEnabled && !identity,
    staleTime: 60 * 60 * 1000, // 1 hour — matches the stability window
    gcTime: 2 * 60 * 60 * 1000,
  });

  return useMemo<UseFormatPriceResult>(() => {
    if (identity) {
      return {
        displayAmount: amount,
        displayCurrency: target,
        formatted: renderFormatted(amount, symbol, precision),
        rate: 1,
        isLoading: false,
        fallback: false,
      };
    }

    if (isLoading) {
      return {
        displayAmount: null,
        displayCurrency: target,
        formatted: "…",
        rate: null,
        isLoading: true,
        fallback: false,
      };
    }

    if (!data || typeof data.rate !== "number") {
      // No published rate — fall back to rendering the source amount
      // with its original currency symbol so the UI never shows ₦NaN.
      const srcMeta = CURRENCY_TABLE[normalizedSource];
      return {
        displayAmount: null,
        displayCurrency: normalizedSource,
        formatted: srcMeta
          ? renderFormatted(amount, srcMeta.symbol, srcMeta.precision)
          : `${normalizedSource} ${amount.toFixed(2)}`,
        rate: null,
        isLoading: false,
        fallback: true,
      };
    }

    const displayAmount = round(amount * data.rate, precision);
    return {
      displayAmount,
      displayCurrency: target,
      formatted: renderFormatted(displayAmount, symbol, precision),
      rate: data.rate,
      isLoading: false,
      fallback: false,
    };
  }, [amount, data, identity, isLoading, normalizedSource, precision, symbol, target]);
}

function renderFormatted(amount: number, symbol: string, precision: number): string {
  const formatter = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return `${symbol}${formatter.format(amount)}`;
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
