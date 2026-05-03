/**
 * AdminAccounting — UI for the read-only accounting reports backed by
 * `/admin/v1/accounting/*` (or `/tenant/v1/admin/accounting/*` when
 * mounted under the tenant dashboard via `mode="tenant"`).
 *
 * Surfaces four reports as tabs: Trial Balance, Income Statement (P&L),
 * Balance Sheet, and General Ledger. Each tab keeps its own date-range
 * state so flipping between reports doesn't reset what the user is
 * looking at. Plain-language preambles up top because not every admin is
 * a CPA.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Coins,
  Layers,
  ScrollText,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import {
  STANDARD_ACCOUNT_OPTIONS,
  formatAccountingCurrency,
  getAccountTypeTone,
  useFetchBalanceSheet,
  useFetchGeneralLedger,
  useFetchIncomeStatement,
  useFetchTrialBalance,
  type AccountSection,
  type AccountType,
} from "@/shared/hooks/resources/accountingHooks";

// ─── Types ─────────────────────────────────────────────────────

type TabId = "trial-balance" | "income-statement" | "balance-sheet" | "general-ledger";

interface AdminAccountingProps {
  /**
   * Toggles between the admin (platform-wide) and tenant (auto-scoped)
   * surface. Defaults to "admin"; the tenant route mounts this with
   * `mode="tenant"` so the tenant version of the hook URL prefix kicks
   * in automatically.
   */
  mode?: "admin" | "tenant";
}

// ─── Date helpers ──────────────────────────────────────────────

const todayIso = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const startOfMonthIso = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
};

// ─── Shared UI primitives ──────────────────────────────────────

const PlainEnglishCallout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100">
    {children}
  </div>
);

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, right, children }) => (
  <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="rounded-lg bg-neutral-100 p-2 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
    {children}
  </section>
);

const DateField: React.FC<{
  label: string;
  value: string;
  onChange: (next: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">
    <span>{label}</span>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:ring-sky-800"
    />
  </label>
);

const CurrencyHint: React.FC<{ currency?: string }> = ({ currency = "NGN" }) => (
  <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
    Currency: {currency}
  </span>
);

const AccountTypePill: React.FC<{ type: AccountType }> = ({ type }) => {
  const tone = getAccountTypeTone(type);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`}
    >
      {tone.label}
    </span>
  );
};

const ErrorBlock: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
    <AlertTriangle size={28} />
    <p>{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
      >
        Retry
      </button>
    )}
  </div>
);

const EmptyTableRow: React.FC<{ colSpan: number; label: string }> = ({
  colSpan,
  label,
}) => (
  <tr>
    <td
      colSpan={colSpan}
      className="px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400"
    >
      {label}
    </td>
  </tr>
);

// ─── Tab 1: Trial Balance ──────────────────────────────────────

const TrialBalanceTab: React.FC = () => {
  const [asOf, setAsOf] = useState<string>(todayIso());

  const { data, isLoading, isError, error, refetch } = useFetchTrialBalance({
    asOf,
  });

  const accounts = data?.accounts ?? [];
  const totals = data?.totals;
  const ledgerCurrency = data?.ledger?.base_currency ?? "NGN";

  return (
    <div className="space-y-5">
      <PlainEnglishCallout>
        A snapshot of every account&apos;s balance on this date. Debits should
        equal credits — if they don&apos;t, something is off in the books.
      </PlainEnglishCallout>

      <SectionCard
        title="Trial Balance"
        subtitle="Postable accounts grouped by code with cumulative balances as of the chosen date."
        icon={<Layers size={18} />}
        right={
          <>
            <CurrencyHint currency={ledgerCurrency} />
            <DateField label="As of" value={asOf} onChange={setAsOf} />
          </>
        }
      >
        {isLoading ? (
          <SkeletonCard className="h-64" />
        ) : isError ? (
          <ErrorBlock
            message={error?.message ?? "Failed to load trial balance."}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {accounts.length === 0 ? (
                  <EmptyTableRow colSpan={5} label="No accounts found for this ledger." />
                ) : (
                  accounts.map((row) => (
                    <tr
                      key={row.account_code}
                      className="text-neutral-800 dark:text-neutral-100"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {row.account_code}
                      </td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">
                        <AccountTypePill type={row.type} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {row.debit_balance > 0
                          ? formatAccountingCurrency(row.debit_balance, ledgerCurrency)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {row.credit_balance > 0
                          ? formatAccountingCurrency(row.credit_balance, ledgerCurrency)
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="border-t-2 border-neutral-300 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100">
                    <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                      Totals
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">
                      {formatAccountingCurrency(totals.debit, ledgerCurrency)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">
                      {formatAccountingCurrency(totals.credit, ledgerCurrency)}
                    </td>
                  </tr>
                  <tr className={
                    totals.is_balanced
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200"
                  }>
                    <td colSpan={5} className="px-3 py-3 text-sm">
                      <div className="flex items-center justify-end gap-2 font-semibold">
                        {totals.is_balanced ? (
                          <>
                            <CheckCircle2 size={16} /> Books balance — debits equal credits.
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} /> Out of balance by{" "}
                            {formatAccountingCurrency(
                              Math.abs(totals.debit - totals.credit),
                              ledgerCurrency
                            )}
                            . Investigate journal entries.
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

// ─── Tab 2: Income Statement ───────────────────────────────────

const AccountSectionTable: React.FC<{
  title: string;
  section: AccountSection;
  currency: string;
  emptyLabel: string;
}> = ({ title, section, currency, emptyLabel }) => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
    <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200">
      {title}
    </div>
    <table className="min-w-full text-sm">
      <thead className="hidden">
        <tr>
          <th>Code</th>
          <th>Account</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {section.accounts.length === 0 ? (
          <EmptyTableRow colSpan={3} label={emptyLabel} />
        ) : (
          section.accounts.map((row) => (
            <tr key={row.account_code} className="text-neutral-800 dark:text-neutral-100">
              <td className="px-3 py-2 font-mono text-xs text-neutral-500 dark:text-neutral-400 w-20">
                {row.account_code}
              </td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2 text-right font-mono">
                {formatAccountingCurrency(row.balance, currency)}
              </td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot>
        <tr className="border-t border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-100">
          <td colSpan={2} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
            Total {title}
          </td>
          <td className="px-3 py-2 text-right font-mono font-semibold">
            {formatAccountingCurrency(section.total, currency)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
);

const IncomeStatementTab: React.FC = () => {
  const [from, setFrom] = useState<string>(startOfMonthIso());
  const [to, setTo] = useState<string>(todayIso());

  const { data, isLoading, isError, error, refetch } = useFetchIncomeStatement({
    from,
    to,
  });

  const ledgerCurrency = data?.ledger?.base_currency ?? "NGN";
  const netIncome = data?.net_income ?? 0;
  const netPositive = netIncome >= 0;

  return (
    <div className="space-y-5">
      <PlainEnglishCallout>
        Money in minus money out for this period. Net income tells you
        whether the business made or lost money.
      </PlainEnglishCallout>

      <SectionCard
        title="Income Statement (P&L)"
        subtitle="Revenue and expense activity over the chosen date range."
        icon={<BarChart3 size={18} />}
        right={
          <>
            <CurrencyHint currency={ledgerCurrency} />
            <DateField label="From" value={from} onChange={setFrom} />
            <DateField label="To" value={to} onChange={setTo} />
          </>
        }
      >
        {isLoading ? (
          <SkeletonCard className="h-64" />
        ) : isError ? (
          <ErrorBlock
            message={error?.message ?? "Failed to load income statement."}
            onRetry={() => refetch()}
          />
        ) : data ? (
          <div className="space-y-4">
            <AccountSectionTable
              title="Revenue"
              section={data.revenue}
              currency={ledgerCurrency}
              emptyLabel="No revenue posted in this period."
            />
            <AccountSectionTable
              title="Expenses"
              section={data.expenses}
              currency={ledgerCurrency}
              emptyLabel="No expenses posted in this period."
            />
            <div
              className={`rounded-2xl border p-6 text-center ${
                netPositive
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20"
                  : "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/20"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Net Income
              </div>
              <div
                className={`mt-2 font-mono text-3xl font-bold ${
                  netPositive
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}
              >
                {formatAccountingCurrency(netIncome, ledgerCurrency)}
              </div>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                {netPositive
                  ? "Revenue exceeded expenses for this period — the business is in the black."
                  : "Expenses exceeded revenue for this period — the business is operating at a loss."}
              </p>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
};

// ─── Tab 3: Balance Sheet ──────────────────────────────────────

const BalanceSheetTab: React.FC = () => {
  const [asOf, setAsOf] = useState<string>(todayIso());

  const { data, isLoading, isError, error, refetch } = useFetchBalanceSheet({
    asOf,
  });

  const ledgerCurrency = data?.ledger?.base_currency ?? "NGN";
  const totals = data?.totals;

  return (
    <div className="space-y-5">
      <PlainEnglishCallout>
        What we own (assets) and how it&apos;s funded (liabilities + equity)
        on this date. Assets must equal liabilities plus equity.
      </PlainEnglishCallout>

      <SectionCard
        title="Balance Sheet"
        subtitle="Snapshot of assets, liabilities, and equity as of the chosen date."
        icon={<Coins size={18} />}
        right={
          <>
            <CurrencyHint currency={ledgerCurrency} />
            <DateField label="As of" value={asOf} onChange={setAsOf} />
          </>
        }
      >
        {isLoading ? (
          <SkeletonCard className="h-64" />
        ) : isError ? (
          <ErrorBlock
            message={error?.message ?? "Failed to load balance sheet."}
            onRetry={() => refetch()}
          />
        ) : data ? (
          <div className="space-y-4">
            <AccountSectionTable
              title="Assets"
              section={data.assets}
              currency={ledgerCurrency}
              emptyLabel="No asset balances recorded."
            />
            <AccountSectionTable
              title="Liabilities"
              section={data.liabilities}
              currency={ledgerCurrency}
              emptyLabel="No liability balances recorded."
            />
            <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200">
                Equity
              </div>
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {data.equity.accounts.length === 0 && (data.equity.retained_earnings ?? 0) === 0 ? (
                    <EmptyTableRow colSpan={3} label="No equity balances recorded." />
                  ) : (
                    <>
                      {data.equity.accounts.map((row) => (
                        <tr
                          key={row.account_code}
                          className="text-neutral-800 dark:text-neutral-100"
                        >
                          <td className="px-3 py-2 font-mono text-xs text-neutral-500 dark:text-neutral-400 w-20">
                            {row.account_code}
                          </td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatAccountingCurrency(row.balance, ledgerCurrency)}
                          </td>
                        </tr>
                      ))}
                      {data.equity.retained_earnings !== undefined && (
                        <tr className="text-neutral-800 dark:text-neutral-100">
                          <td className="px-3 py-2 font-mono text-xs text-neutral-500 dark:text-neutral-400 w-20">
                            —
                          </td>
                          <td className="px-3 py-2 italic">Retained Earnings (computed)</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatAccountingCurrency(
                              data.equity.retained_earnings,
                              ledgerCurrency
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-100">
                    <td colSpan={2} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
                      Total Equity
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {formatAccountingCurrency(data.equity.total, ledgerCurrency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {totals && (
              <div
                className={`rounded-2xl border p-5 ${
                  totals.is_balanced
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20"
                    : "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/20"
                }`}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Total Assets
                    </div>
                    <div className="mt-1 font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {formatAccountingCurrency(totals.assets, ledgerCurrency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Total Liabilities + Equity
                    </div>
                    <div className="mt-1 font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {formatAccountingCurrency(
                        totals.liabilities_and_equity,
                        ledgerCurrency
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={`mt-3 flex items-center gap-2 text-sm font-semibold ${
                    totals.is_balanced
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {totals.is_balanced ? (
                    <>
                      <CheckCircle2 size={16} /> Balance sheet balances —
                      assets equal liabilities + equity.
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} /> Off by{" "}
                      {formatAccountingCurrency(
                        Math.abs(totals.assets - totals.liabilities_and_equity),
                        ledgerCurrency
                      )}
                      . Check the journal for unbalanced entries.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
};

// ─── Tab 4: General Ledger ─────────────────────────────────────

const GeneralLedgerTab: React.FC = () => {
  const [account, setAccount] = useState<string>(STANDARD_ACCOUNT_OPTIONS[0]?.code ?? "1100");
  const [from, setFrom] = useState<string>(startOfMonthIso());
  const [to, setTo] = useState<string>(todayIso());

  // Use the trial-balance call to discover the ledger's actual chart of
  // accounts so the dropdown stays accurate even if the platform adds
  // new accounts later. Fall back to the hard-coded standard list while
  // it loads.
  const tb = useFetchTrialBalance({ asOf: todayIso() });

  const accountOptions = useMemo(() => {
    if (tb.data?.accounts && tb.data.accounts.length > 0) {
      return tb.data.accounts.map((a) => ({
        code: a.account_code,
        name: a.name,
        type: a.type,
      }));
    }
    return STANDARD_ACCOUNT_OPTIONS;
  }, [tb.data]);

  const { data, isLoading, isError, error, refetch } = useFetchGeneralLedger({
    account,
    from,
    to,
  });

  const ledgerCurrency = data?.ledger?.base_currency ?? "NGN";
  const lines = data?.lines ?? [];

  return (
    <div className="space-y-5">
      <PlainEnglishCallout>
        Every transaction that touched this account, in chronological
        order. The running balance shows what the account looked like
        after each entry.
      </PlainEnglishCallout>

      <SectionCard
        title="General Ledger"
        subtitle="Detailed transaction history for a single account over the chosen period."
        icon={<ScrollText size={18} />}
        right={<CurrencyHint currency={ledgerCurrency} />}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <span>Account</span>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:ring-sky-800"
            >
              {accountOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} — {opt.name}
                </option>
              ))}
            </select>
          </label>
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>

        {isLoading ? (
          <SkeletonCard className="h-64" />
        ) : isError ? (
          <ErrorBlock
            message={error?.message ?? "Failed to load general ledger."}
            onRetry={() => refetch()}
          />
        ) : data ? (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Account
                </div>
                <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  <span className="font-mono">{data.account.code}</span> · {data.account.name}
                </div>
                <div className="mt-1">
                  <AccountTypePill type={data.account.type} />
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Opening Balance
                </div>
                <div className="mt-1 font-mono text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatAccountingCurrency(data.opening_balance, ledgerCurrency)}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Closing Balance
                </div>
                <div className="mt-1 font-mono text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatAccountingCurrency(data.closing_balance, ledgerCurrency)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <th className="px-3 py-2">Posted</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Kind</th>
                    <th className="px-3 py-2 text-right">Debit</th>
                    <th className="px-3 py-2 text-right">Credit</th>
                    <th className="px-3 py-2 text-right">Running</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {lines.length === 0 ? (
                    <EmptyTableRow
                      colSpan={6}
                      label="No transactions touched this account in the selected period."
                    />
                  ) : (
                    (() => {
                      const isDebitNormal = data.account.normal_balance === "debit";
                      let running = data.opening_balance;
                      return lines.map((line, idx) => {
                        const movement = isDebitNormal
                          ? line.debit - line.credit
                          : line.credit - line.debit;
                        running = Math.round((running + movement) * 10000) / 10000;
                        return (
                          <tr
                            key={`${line.entry_uuid ?? "row"}-${idx}`}
                            className="text-neutral-800 dark:text-neutral-100"
                          >
                            <td className="px-3 py-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                              {line.posted_at ?? "—"}
                            </td>
                            <td className="px-3 py-2">{line.description ?? line.memo ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                              {line.kind ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {line.debit > 0
                                ? formatAccountingCurrency(line.debit, ledgerCurrency)
                                : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {line.credit > 0
                                ? formatAccountingCurrency(line.credit, ledgerCurrency)
                                : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">
                              {formatAccountingCurrency(running, ledgerCurrency)}
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
};

// ─── Top-level page ────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "trial-balance", label: "Trial Balance", icon: <Layers size={16} /> },
  { id: "income-statement", label: "Income Statement", icon: <BarChart3 size={16} /> },
  { id: "balance-sheet", label: "Balance Sheet", icon: <Coins size={16} /> },
  { id: "general-ledger", label: "General Ledger", icon: <ScrollText size={16} /> },
];

const AccountingBody: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("trial-balance");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "trial-balance" && <TrialBalanceTab />}
      {activeTab === "income-statement" && <IncomeStatementTab />}
      {activeTab === "balance-sheet" && <BalanceSheetTab />}
      {activeTab === "general-ledger" && <GeneralLedgerTab />}
    </div>
  );
};

const AdminAccounting: React.FC<AdminAccountingProps> = ({ mode = "admin" }) => {
  const description =
    mode === "tenant"
      ? "Read-only accounting reports for your tenant ledger — trial balance, P&L, balance sheet, and per-account history."
      : "Read-only accounting reports across the platform ledger — trial balance, P&L, balance sheet, and per-account history.";

  if (mode === "tenant") {
    return (
      <TenantPageShell
        title="Accounting"
        description={description}
        contentClassName="space-y-6"
        icon={<BookOpen size={22} />}
      >
        <AccountingBody />
      </TenantPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Accounting"
      description={description}
      contentClassName="space-y-6"
      icon={<BookOpen size={22} />}
    >
      <AccountingBody />
    </AdminPageShell>
  );
};

export default AdminAccounting;
