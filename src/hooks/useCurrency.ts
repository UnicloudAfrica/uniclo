import { useMemo } from "react";
import useAuthStore from "../stores/authStore";

/**
 * Resolve the user's display currency (Part D mirror on the frontend).
 *
 * Priority:
 *   1. `authStore.user.display_currency` if the user has a preference
 *   2. `authStore.tenant.display_currency` for tenant-scoped contexts
 *   3. NGN default (platform-wide)
 *
 * `symbol` + `precision` come from a small client-side table that
 * mirrors `config/currencies.php`. Adding a currency on the backend
 * requires also extending the table below — guarded by the smoke test
 * `useCurrency.test.tsx`.
 */

export interface CurrencyMeta {
  code: string;
  symbol: string;
  precision: number;
}

const CURRENCY_TABLE: Record<string, CurrencyMeta> = {
  NGN: { code: "NGN", symbol: "₦", precision: 2 },
  USD: { code: "USD", symbol: "$", precision: 2 },
  GBP: { code: "GBP", symbol: "£", precision: 2 },
  EUR: { code: "EUR", symbol: "€", precision: 2 },
  ZAR: { code: "ZAR", symbol: "R", precision: 2 },
  KES: { code: "KES", symbol: "KSh", precision: 2 },
};

const DEFAULT_CURRENCY = "NGN";

export interface UseCurrencyResult {
  /** Resolved display currency code (ISO 4217). */
  code: string;
  /** Display symbol (e.g. ₦, $). */
  symbol: string;
  /** Decimals to render. */
  precision: number;
  /** All supported currencies — for selector dropdowns. */
  supported: CurrencyMeta[];
}

export function useCurrency(): UseCurrencyResult {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);

  const code = useMemo<string>(() => {
    const userPref =
      typeof user?.display_currency === "string"
        ? user.display_currency.toUpperCase()
        : null;
    if (userPref && userPref in CURRENCY_TABLE) {
      return userPref;
    }

    const tenantPref =
      typeof tenant?.display_currency === "string"
        ? tenant.display_currency.toUpperCase()
        : null;
    if (tenantPref && tenantPref in CURRENCY_TABLE) {
      return tenantPref;
    }

    return DEFAULT_CURRENCY;
  }, [user, tenant]);

  const meta = CURRENCY_TABLE[code] ?? CURRENCY_TABLE[DEFAULT_CURRENCY];

  return {
    code: meta.code,
    symbol: meta.symbol,
    precision: meta.precision,
    supported: Object.values(CURRENCY_TABLE),
  };
}

export { CURRENCY_TABLE };
