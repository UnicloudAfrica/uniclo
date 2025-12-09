// Shared Banking Types and Utilities

export interface Bank {
  code: string;
  name: string;
}

export interface BankDetails {
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_code: string | null;
  is_verified: boolean;
}

export interface Payout {
  id: number;
  tenant_id: number;
  amount_cents: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  bank_name: string;
  account_number: string;
  account_name: string;
  gateway_reference: string | null;
  processed_at: string | null;
  created_at: string;
  notes: string | null;
}

export interface PayoutSummary {
  pending: number;
  total_received: number;
  this_month: number;
}

// Utility functions
export const formatCurrency = (amount: number, currency: string = "NGN"): string => {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const maskAccountNumber = (accountNumber: string | null): string => {
  if (!accountNumber || accountNumber.length < 4) return "****";
  return `****${accountNumber.slice(-4)}`;
};

export const formatBankAccount = (
  bankName: string | null,
  accountNumber: string | null
): string => {
  if (!bankName || !accountNumber) return "Not configured";
  return `${bankName} - ${maskAccountNumber(accountNumber)}`;
};

export const PAYOUT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  processing: { bg: "bg-blue-100", text: "text-blue-800", label: "Processing" },
  completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
  failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-800", label: "Cancelled" },
};

export const getPayoutStatusStyle = (status: string) => {
  return PAYOUT_STATUS_STYLES[status] || PAYOUT_STATUS_STYLES.pending;
};

export const formatPayoutDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
