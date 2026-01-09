// @ts-nocheck
import React, { useState } from "react";
import { Building2, CheckCircle, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { useBankList, useVerifyAccount, useCreateSubaccount } from "../../hooks/useTenantBilling";

interface PaystackBankSetupProps {
  onComplete?: () => void;
}

const PaystackBankSetup: React.FC<PaystackBankSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<"bank" | "verify" | "complete">("bank");
  const [formData, setFormData] = useState({
    bank_code: "",
    account_number: "",
    business_name: "",
    percentage_charge: 100, // Default to 100% going to subaccount
  });
  const [verifiedAccount, setVerifiedAccount] = useState<{
    account_name: string;
    bank_name: string;
  } | null>(null);

  const { data: bankListData, isLoading: isLoadingBanks } = useBankList();
  const verifyMutation = useVerifyAccount();
  const createSubaccountMutation = useCreateSubaccount();

  const banks = bankListData?.banks || [];

  const handleVerifyAccount = async () => {
    if (!formData.bank_code || !formData.account_number) return;

    try {
      const result = await verifyMutation.mutateAsync({
        bank_code: formData.bank_code,
        account_number: formData.account_number,
      });

      if (result.verified) {
        setVerifiedAccount({
          account_name: result.account_name,
          bank_name: banks.find((b) => b.code === formData.bank_code)?.name || "",
        });
        setStep("verify");
      }
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!verifiedAccount) return;

    try {
      await createSubaccountMutation.mutateAsync({
        bank_code: formData.bank_code,
        account_number: formData.account_number,
        business_name: formData.business_name || verifiedAccount.account_name,
        percentage_charge: formData.percentage_charge,
      });

      setStep("complete");
      onComplete?.();
    } catch (error) {
      console.error("Subaccount creation failed:", error);
    }
  };

  if (step === "complete") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Account Connected!</h3>
        <p className="text-gray-600">Your Paystack subaccount has been set up successfully.</p>
        <p className="text-sm text-gray-500 mt-2">Payments will now be split automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Connect Bank Account</h3>
          <p className="text-sm text-gray-500">
            Set up your Paystack subaccount for split payments
          </p>
        </div>
      </div>

      {/* Step 1: Select Bank and Enter Account */}
      {step === "bank" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
            {isLoadingBanks ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading banks...
              </div>
            ) : (
              <select
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a bank...</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input
              type="text"
              maxLength={10}
              value={formData.account_number}
              onChange={(e) =>
                setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, "") })
              }
              placeholder="0123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleVerifyAccount}
            disabled={
              !formData.bank_code ||
              formData.account_number.length !== 10 ||
              verifyMutation.isPending
            }
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {verifyMutation.isPending ? "Verifying..." : "Verify Account"}
          </button>

          {verifyMutation.isError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Failed to verify account. Please check and try again.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Confirm and Create Subaccount */}
      {step === "verify" && verifiedAccount && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle className="w-4 h-4" />
              Account Verified
            </div>
            <div className="space-y-1 text-sm text-green-800">
              <p>
                <strong>Account Name:</strong> {verifiedAccount.account_name}
              </p>
              <p>
                <strong>Bank:</strong> {verifiedAccount.bank_name}
              </p>
              <p>
                <strong>Account Number:</strong> {formData.account_number}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder={verifiedAccount.account_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("bank")}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleCreateSubaccount}
              disabled={createSubaccountMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createSubaccountMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createSubaccountMutation.isPending ? "Creating..." : "Create Subaccount"}
            </button>
          </div>

          {createSubaccountMutation.isError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Failed to create subaccount. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaystackBankSetup;
