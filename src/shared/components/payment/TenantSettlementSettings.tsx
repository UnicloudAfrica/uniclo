import { useState } from "react";
import { CheckCircle, AlertCircle, Search, Loader2, Landmark } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import {
  useFetchTenantSplitStatus,
  useFetchBanks,
  useVerifyBankAccount,
  useSetupTenantSplit,
  type Bank,
} from "@/hooks/paymentSplitHooks";

export default function TenantSettlementSettings() {
  const { data: status, isLoading: statusLoading } = useFetchTenantSplitStatus();
  const { data: banks } = useFetchBanks();
  const verifyMutation = useVerifyBankAccount();
  const setupMutation = useSetupTenantSplit();

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState("");

  const bankList = Array.isArray(banks) ? banks : [];
  const filteredBanks = bankList.filter((b: Bank) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleVerify = () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    verifyMutation.mutate(
      { account_number: accountNumber, bank_code: bankCode },
      {
        onSuccess: (data) => {
          setVerifiedName(data?.account_name ?? null);
          if (!businessName && data?.account_name) {
            setBusinessName(data.account_name);
          }
        },
      }
    );
  };

  const handleSetup = () => {
    if (!bankCode || !accountNumber || !businessName) return;
    setupMutation.mutate({ bank_code: bankCode, account_number: accountNumber, business_name: businessName });
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: designTokens.colors.neutral[400] }} />
      </div>
    );
  }

  const hasSubaccount = status?.has_subaccount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
          Settlement Account
        </h3>
        <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
          Configure your bank account to receive your share of revenue from customer payments automatically via Paystack split settlement.
        </p>
      </div>

      {/* Current Status */}
      {hasSubaccount ? (
        <div
          className="flex items-start gap-4 rounded-xl border p-5"
          style={{ borderColor: designTokens.colors.success[200], backgroundColor: designTokens.colors.success[50] }}
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: designTokens.colors.success[500] }} />
          <div>
            <p className="font-semibold" style={{ color: designTokens.colors.success[700] }}>Settlement Account Active</p>
            <p className="mt-1 text-sm" style={{ color: designTokens.colors.success[600] }}>
              Revenue from your customers' payments will be automatically settled to your bank account.
            </p>
            {status?.bank_details && (
              <div className="mt-3 space-y-1 text-sm" style={{ color: designTokens.colors.neutral[700] }}>
                <p><span className="font-medium">Bank:</span> {status.bank_details.bank_name}</p>
                <p><span className="font-medium">Account:</span> {status.bank_details.account_number}</p>
                <p><span className="font-medium">Name:</span> {status.bank_details.account_name}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex items-start gap-4 rounded-xl border p-5"
          style={{ borderColor: designTokens.colors.warning[200], backgroundColor: designTokens.colors.warning[50] }}
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: designTokens.colors.warning[500] }} />
          <div>
            <p className="font-semibold" style={{ color: designTokens.colors.warning[700] }}>No Settlement Account</p>
            <p className="mt-1 text-sm" style={{ color: designTokens.colors.warning[600] }}>
              Set up your bank account below to receive automatic revenue settlements from customer payments.
            </p>
          </div>
        </div>
      )}

      {/* Setup Form */}
      <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: designTokens.colors.neutral[800] }}>
          <Landmark className="h-4 w-4" style={{ color: designTokens.colors.primary[600] }} />
          {hasSubaccount ? "Update Settlement Account" : "Set Up Settlement Account"}
        </h4>

        <div className="space-y-4">
          {/* Bank Selection */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
              Bank *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: designTokens.colors.neutral[400] }} />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search bank..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              />
            </div>
            {bankSearch && filteredBanks.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border shadow-sm" style={{ borderColor: designTokens.colors.neutral[200] }}>
                {filteredBanks.slice(0, 10).map((bank: Bank) => (
                  <button
                    key={bank.code}
                    onClick={() => { setBankCode(bank.code); setBankSearch(bank.name); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    style={{ color: designTokens.colors.neutral[700] }}
                  >
                    {bank.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account Number + Verify */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
              Account Number *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setVerifiedName(null); }}
                placeholder="0123456789"
                maxLength={10}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: designTokens.colors.neutral[300] }}
              />
              <button
                onClick={handleVerify}
                disabled={accountNumber.length !== 10 || !bankCode || verifyMutation.isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: designTokens.colors.primary[600] }}
              >
                {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </button>
            </div>
          </div>

          {/* Verified Account Name */}
          {verifiedName && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: designTokens.colors.success[50], color: designTokens.colors.success[700] }}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{verifiedName}</span>
            </div>
          )}

          {/* Business Name */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: designTokens.colors.neutral[700] }}>
              Business Name *
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: designTokens.colors.neutral[300] }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSetup}
            disabled={!bankCode || !accountNumber || !businessName || setupMutation.isPending}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: designTokens.colors.primary[600] }}
          >
            {setupMutation.isPending ? "Setting up..." : hasSubaccount ? "Update Settlement Account" : "Set Up Settlement Account"}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <h4 className="mb-3 text-sm font-semibold" style={{ color: designTokens.colors.neutral[800] }}>
          How Split Settlement Works
        </h4>
        <div className="space-y-2 text-sm" style={{ color: designTokens.colors.neutral[600] }}>
          <p>1. Your customer pays for a service (e.g. $100)</p>
          <p>2. Paystack splits the payment automatically at source</p>
          <p>3. Your share is settled to your bank account (T+1)</p>
          <p>4. Platform and integration partner shares are settled separately</p>
          <p className="mt-3 text-xs" style={{ color: designTokens.colors.neutral[400] }}>
            Paystack transaction fee (1.5%) is deducted from the total before splitting.
          </p>
        </div>
      </div>
    </div>
  );
}
