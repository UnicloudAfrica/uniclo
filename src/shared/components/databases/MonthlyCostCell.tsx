import React from "react";
import { useFormatPrice } from "@/hooks/useFormatPrice";

/**
 * Renders a managed-database monthly cost in the user's preferred
 * display currency. Source currency comes from the row (persisted by
 * the order action); display currency comes from `useCurrency()`
 * inside `useFormatPrice`.
 *
 * Lives in its own file (instead of inline in `ManagedDatabaseList`)
 * so it can be unit-tested without pulling in the full list component
 * dependency graph. The cell isolates the hook call per row — React
 * hooks can't run in a loop, so the table's `render` callback returns
 * `<MonthlyCostCell />` rather than a string.
 *
 * Behaviour:
 *
 *   - `amount` ≤ 0 or non-finite  → renders an em dash "—".
 *   - `currency` undefined        → defaults to USD (legacy rows that
 *                                   predate the multi-currency column).
 *   - source === display currency → no FX call, instant render.
 *   - mismatch                    → fetches the published FX rate
 *                                   (cached 1h) and renders the
 *                                   converted amount with the display
 *                                   currency's symbol.
 *   - no rate published yet       → renders the source amount with the
 *                                   source-currency symbol, so the UI
 *                                   never shows `$NGN-amount` again.
 */
export interface MonthlyCostCellProps {
  amount: number | string | undefined;
  currency: string | undefined;
}

const MonthlyCostCell: React.FC<MonthlyCostCellProps> = ({ amount, currency }) => {
  const numeric = Number(amount ?? 0);
  const sourceCurrency = (currency || "USD").toUpperCase();
  const { formatted } = useFormatPrice(numeric, sourceCurrency);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return <>—</>;
  }
  return <>{formatted}</>;
};

export default MonthlyCostCell;
