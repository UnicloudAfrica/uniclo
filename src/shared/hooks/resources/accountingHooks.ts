import { RESILIENCE } from "@/shared/branding";

/**
 * Accounting Hooks — Context-aware hooks for the read-only accounting
 * reports shipped in Phase A of the accounting plan.
 *
 * Per-context URL conventions:
 *   - admin:  GET /admin/v1/accounting/...           (resourcePath = "/accounting")
 *   - tenant: GET /tenant/v1/admin/accounting/...    (resourcePath = "/admin/accounting")
 *
 * The four reports backing the admin Accounting page are all idempotent
 * GETs with no mutations, so we only need silent React-Query reads. The
 * tenant scope automatically derives the ledger from the calling user's
 * tenant — there is no `ledger=` query knob to pass through there.
 */
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions<T = unknown> = Partial<
  Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
>;

const asEnvelope = <T = AnyRecord>(res: unknown): { data?: T } =>
  (res ?? {}) as { data?: T };

// ─── Types ─────────────────────────────────────────────────────

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type LedgerHandle = string; // "platform" | "tenant:<uuid>" | "<numeric id>"

export interface LedgerEnvelope {
  id: number;
  uuid: string;
  name: string;
  owner_type: string;
  owner_id: string | number | null;
  base_currency: string;
}

export interface TrialBalanceRow {
  account_code: string;
  name: string;
  type: AccountType;
  normal_balance: "debit" | "credit";
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalanceTotals {
  debit: number;
  credit: number;
  is_balanced: boolean;
}

export interface TrialBalanceResponse {
  ledger: LedgerEnvelope;
  as_of: string;
  accounts: TrialBalanceRow[];
  totals: TrialBalanceTotals;
}

export interface AccountSection {
  accounts: Array<{ account_code: string; name: string; balance: number }>;
  total: number;
}

export interface IncomeStatementResponse {
  ledger: LedgerEnvelope;
  from: string;
  to: string;
  revenue: AccountSection;
  expenses: AccountSection;
  net_income: number;
}

export interface BalanceSheetResponse {
  ledger: LedgerEnvelope;
  as_of: string;
  assets: AccountSection;
  liabilities: AccountSection;
  equity: AccountSection & { retained_earnings?: number };
  totals: {
    assets: number;
    liabilities_and_equity: number;
    is_balanced: boolean;
  };
}

export interface GeneralLedgerLine {
  entry_uuid: string | null;
  posted_at: string | null;
  kind: string | null;
  reference_type: string | null;
  reference_id: number | string | null;
  description: string | null;
  debit: number;
  credit: number;
  memo: string | null;
}

export interface GeneralLedgerResponse {
  ledger: LedgerEnvelope;
  account: {
    code: string;
    name: string;
    type: AccountType;
    normal_balance: "debit" | "credit";
  };
  opening_balance: number;
  lines: GeneralLedgerLine[];
  closing_balance: number;
  from: string;
  to: string;
}

// ─── Path helpers ──────────────────────────────────────────────

const accountingPath = (context: ApiContext, endpoint: string): string => {
  const suffix = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (context === "tenant") return `/admin/accounting${suffix}`;
  // Admin uses prefix "" → absolute "/accounting/..." resolves to
  // ${API}/admin/v1/accounting/... which matches the routes file.
  return `/accounting${suffix}`;
};

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
};

// ─── Query keys ────────────────────────────────────────────────

export const accountingKeys = {
  all: (context: ApiContext) => ["accounting", context] as const,
  trialBalance: (context: ApiContext, params: Record<string, unknown>) =>
    ["accounting", context, "trial-balance", params] as const,
  incomeStatement: (context: ApiContext, params: Record<string, unknown>) =>
    ["accounting", context, "income-statement", params] as const,
  balanceSheet: (context: ApiContext, params: Record<string, unknown>) =>
    ["accounting", context, "balance-sheet", params] as const,
  generalLedger: (context: ApiContext, params: Record<string, unknown>) =>
    ["accounting", context, "general-ledger", params] as const,
};

// ─── Trial Balance ─────────────────────────────────────────────

export interface TrialBalanceParams {
  asOf?: string; // YYYY-MM-DD
  ledger?: LedgerHandle;
}

export function useFetchTrialBalance(
  params: TrialBalanceParams = {},
  options?: QueryOptions<TrialBalanceResponse | undefined>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const queryParams: Record<string, unknown> = {
    as_of: params.asOf,
  };
  // The tenant endpoint doesn't accept `ledger=` (it's always derived
  // from the authed user's tenant). Only pass it for admin so we don't
  // leak a parameter the backend would silently ignore.
  if (context === "admin" && params.ledger) {
    queryParams.ledger = params.ledger;
  }

  return useQuery<TrialBalanceResponse | undefined, Error>({
    queryKey: accountingKeys.trialBalance(context, queryParams),
    queryFn: async () => {
      const url = `${accountingPath(context, "trial-balance")}${buildQueryString(queryParams)}`;
      const res = await entry.silentApi.get<AnyRecord>(url);
      return asEnvelope<TrialBalanceResponse>(res).data;
    },
    ...options,
  });
}

// ─── Income Statement ──────────────────────────────────────────

export interface IncomeStatementParams {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  ledger?: LedgerHandle;
}

export function useFetchIncomeStatement(
  params: IncomeStatementParams = {},
  options?: QueryOptions<IncomeStatementResponse | undefined>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const queryParams: Record<string, unknown> = {
    from: params.from,
    to: params.to,
  };
  if (context === "admin" && params.ledger) {
    queryParams.ledger = params.ledger;
  }

  return useQuery<IncomeStatementResponse | undefined, Error>({
    queryKey: accountingKeys.incomeStatement(context, queryParams),
    queryFn: async () => {
      const url = `${accountingPath(context, "income-statement")}${buildQueryString(queryParams)}`;
      const res = await entry.silentApi.get<AnyRecord>(url);
      return asEnvelope<IncomeStatementResponse>(res).data;
    },
    ...options,
  });
}

// ─── Balance Sheet ─────────────────────────────────────────────

export interface BalanceSheetParams {
  asOf?: string;
  ledger?: LedgerHandle;
}

export function useFetchBalanceSheet(
  params: BalanceSheetParams = {},
  options?: QueryOptions<BalanceSheetResponse | undefined>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const queryParams: Record<string, unknown> = {
    as_of: params.asOf,
  };
  if (context === "admin" && params.ledger) {
    queryParams.ledger = params.ledger;
  }

  return useQuery<BalanceSheetResponse | undefined, Error>({
    queryKey: accountingKeys.balanceSheet(context, queryParams),
    queryFn: async () => {
      const url = `${accountingPath(context, "balance-sheet")}${buildQueryString(queryParams)}`;
      const res = await entry.silentApi.get<AnyRecord>(url);
      return asEnvelope<BalanceSheetResponse>(res).data;
    },
    ...options,
  });
}

// ─── General Ledger ────────────────────────────────────────────

export interface GeneralLedgerParams {
  account?: string; // chart-of-account code, e.g. "1100"
  from?: string;
  to?: string;
  ledger?: LedgerHandle;
}

export function useFetchGeneralLedger(
  params: GeneralLedgerParams = {},
  options?: QueryOptions<GeneralLedgerResponse | undefined>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const queryParams: Record<string, unknown> = {
    account: params.account,
    from: params.from,
    to: params.to,
  };
  if (context === "admin" && params.ledger) {
    queryParams.ledger = params.ledger;
  }

  return useQuery<GeneralLedgerResponse | undefined, Error>({
    queryKey: accountingKeys.generalLedger(context, queryParams),
    queryFn: async () => {
      const url = `${accountingPath(context, "general-ledger")}${buildQueryString(queryParams)}`;
      const res = await entry.silentApi.get<AnyRecord>(url);
      return asEnvelope<GeneralLedgerResponse>(res).data;
    },
    // The endpoint requires an account code; only fire once we have one.
    enabled: Boolean(params.account) && (options?.enabled ?? true),
    ...options,
  });
}

// ─── Helpers ───────────────────────────────────────────────────

const NGN_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export const formatAccountingCurrency = (
  amount: number | string | null | undefined,
  currency = "NGN"
): string => {
  const n =
    typeof amount === "number"
      ? amount
      : amount === null || amount === undefined
        ? 0
        : Number(amount) || 0;
  if (currency === "NGN") {
    try {
      return NGN_FORMATTER.format(n);
    } catch {
      return `₦${n.toFixed(2)}`;
    }
  }
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

/**
 * Hard-coded fallback list of the 18 standard chart-of-account codes.
 * Mirrors `App\Services\Accounting\ChartOfAccountsTemplate::ACCOUNTS`
 * and is used as a seed for the General Ledger account selector
 * before the trial-balance round-trip lands. Provider account labels
 * are kept generic to comply with the platform's
 * provider-name redaction policy (Zadara/Nobus/StaqDB never
 * surface in the UI).
 */
export const STANDARD_ACCOUNT_OPTIONS: Array<{
  code: string;
  name: string;
  type: AccountType;
}> = [
  { code: "1000", name: "Cash & Bank", type: "asset" },
  { code: "1100", name: "Accounts Receivable", type: "asset" },
  { code: "1200", name: "Provider Prepayments", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "2100", name: "VAT Payable", type: "liability" },
  { code: "2200", name: "Tenant Settlements Payable", type: "liability" },
  { code: "3000", name: "Equity", type: "equity" },
  { code: "4000", name: "Compute Revenue", type: "revenue" },
  { code: "4100", name: "Object Storage Revenue", type: "revenue" },
  { code: "4200", name: "Managed Database Revenue", type: "revenue" },
  { code: "4300", name: "Shield Revenue", type: "revenue" },
  { code: "4400", name: `${RESILIENCE} Revenue`, type: "revenue" },
  { code: "4900", name: "Other Revenue", type: "revenue" },
  { code: "5000", name: "Provider A COGS", type: "expense" },
  { code: "5100", name: "Provider B COGS", type: "expense" },
  { code: "5200", name: "Provider C COGS", type: "expense" },
  { code: "5500", name: "Payment Processing Fees", type: "expense" },
  { code: "6000", name: "Operating Expenses", type: "expense" },
];

const ACCOUNT_TYPE_TONE: Record<
  AccountType,
  { label: string; bg: string; text: string }
> = {
  asset: {
    label: "Asset",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  liability: {
    label: "Liability",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
  },
  equity: {
    label: "Equity",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-800 dark:text-indigo-200",
  },
  revenue: {
    label: "Revenue",
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-800 dark:text-sky-200",
  },
  expense: {
    label: "Expense",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-800 dark:text-rose-200",
  },
};

export const getAccountTypeTone = (type: AccountType) =>
  ACCOUNT_TYPE_TONE[type] ?? ACCOUNT_TYPE_TONE.asset;
