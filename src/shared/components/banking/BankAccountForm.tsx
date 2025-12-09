// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Search, Check, Loader2, AlertCircle } from "lucide-react";
import { Bank, BankDetails } from "./bankDetailsTypes";

interface BankAccountFormProps {
  initialData?: BankDetails;
  banks: Bank[];
  isLoadingBanks?: boolean;
  onVerify: (
    accountNumber: string,
    bankCode: string
  ) => Promise<{ account_name: string; verified: boolean }>;
  onSave: (data: {
    bank_name: string;
    account_number: string;
    account_name: string;
    bank_code: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
  initialData,
  banks,
  isLoadingBanks = false,
  onVerify,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState(initialData?.account_number || "");
  const [accountName, setAccountName] = useState(initialData?.account_name || "");
  const [isVerified, setIsVerified] = useState(initialData?.is_verified || false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Set initial bank if provided
  useEffect(() => {
    if (initialData?.bank_code && banks.length > 0) {
      const bank = banks.find((b) => b.code === initialData.bank_code);
      if (bank) setSelectedBank(bank);
    }
  }, [initialData, banks]);

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerify = async () => {
    if (!selectedBank || accountNumber.length < 10) return;

    setIsVerifying(true);
    setVerifyError(null);
    try {
      const result = await onVerify(accountNumber, selectedBank.code);
      setAccountName(result.account_name);
      setIsVerified(result.verified);
      if (!result.verified) {
        setVerifyError("Account verification pending");
      }
    } catch (error: any) {
      setVerifyError(error.message || "Verification failed");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBank || !accountNumber || !accountName) return;
    await onSave({
      bank_name: selectedBank.name,
      bank_code: selectedBank.code,
      account_number: accountNumber,
      account_name: accountName,
    });
  };

  const handleBankChange = (bank: Bank) => {
    setSelectedBank(bank);
    setIsVerified(false);
    setAccountName("");
    setVerifyError(null);
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value.replace(/\D/g, "").slice(0, 10));
    setIsVerified(false);
    setAccountName("");
    setVerifyError(null);
  };

  return (
    <div className="space-y-6">
      {/* Bank Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bank <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchQuery && filteredBanks.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  onClick={() => {
                    handleBankChange(bank);
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  {bank.name}
                  {selectedBank?.code === bank.code && <Check className="w-4 h-4 text-green-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedBank && (
          <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
            Selected: <strong>{selectedBank.name}</strong>
          </div>
        )}
      </div>

      {/* Account Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => handleAccountNumberChange(e.target.value)}
            placeholder="Enter 10-digit account number"
            maxLength={10}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={!selectedBank || accountNumber.length < 10 || isVerifying}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Verify
          </button>
        </div>
      </div>

      {/* Account Name (from verification) */}
      {accountName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
          <div
            className={`px-4 py-3 rounded-lg ${isVerified ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-800"}`}
          >
            {accountName}
          </div>
        </div>
      )}

      {/* Verification Error */}
      {verifyError && (
        <div className="flex items-center gap-2 text-yellow-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {verifyError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedBank || !accountNumber || !accountName || isSaving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Bank Details
        </button>
      </div>
    </div>
  );
};

export default BankAccountForm;
