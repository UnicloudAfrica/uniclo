/**
 * Shared pricing types mirroring the backend PriceDTO shape (Part H).
 *
 * Every API resource that surfaces a price emits these fields through
 * the `EmitsPriceDTO` trait. Consumers read `amount_display` + `fx_rate`
 * rather than guessing which currency a raw number is in.
 */

/**
 * Identifier for where the display amount's rate came from.
 *
 * - `locked`         — historical invoice; rate snapshotted at issue time
 * - `manual`         — admin pinned this currency amount explicitly
 * - `auto_localized` — cached from the last published rate change
 * - `published`      — runtime lookup against PublishedFxRate
 * - `live`           — fell through to ExchangeRateService (should be rare)
 * - `identity`       — source currency == display currency
 * - `unlocked`       — legacy row without a snapshot; treat amount as approximate
 */
export type PriceFxSource =
  | "locked"
  | "manual"
  | "auto_localized"
  | "published"
  | "live"
  | "identity"
  | "unlocked";

export interface PriceDTO {
  amount_source: number;
  currency_source: string;
  amount_display: number | null;
  currency_display: string;
  fx_rate: number | null;
  fx_source: PriceFxSource;
  formatted_source: string;
  formatted_display: string | null;
}

/** Currency whitelist entry — mirrors `config/currencies.php`. */
export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  precision: number;
}

/** Response shape from `GET /api/v1/exchange-rates/published`. */
export interface PublishedFxRateResponse {
  rate: number;
  source_currency: string;
  target_currency: string;
  effective_from?: string;
  fx_source: "published" | "identity";
}
