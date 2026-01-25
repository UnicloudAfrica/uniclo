// @ts-nocheck
import React, { useState, useEffect } from "react";
import { X, HardDrive, Plus, Check, Loader2, Zap } from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";
import PaymentModal from "../ui/PaymentModal";

interface ExtensionOption {
  gb: number;
  label: string;
  price_monthly: number;
  price_yearly: number;
}

interface ExtendStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
  currentQuotaGb: number;
  usedGb: number;
  onSuccess?: () => void;
}

const ExtendStorageModal: React.FC<ExtendStorageModalProps> = ({
  isOpen,
  onClose,
  accountId,
  accountName,
  currentQuotaGb,
  usedGb,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<ExtensionOption[]>([]);
  const [pricePerGb, setPricePerGb] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [customGb, setCustomGb] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Fast track state
  const [fastTrackEligible, setFastTrackEligible] = useState(false);
  const [fastTrackEnabled, setFastTrackEnabled] = useState(false);

  useEffect(() => {
    if (isOpen && accountId) {
      loadPricing();
    }
  }, [isOpen, accountId]);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const data = await objectStorageApi.getExtensionPricing(accountId);
      setOptions(data.options || []);
      setPricePerGb(data.pricing?.price_per_gb || 0.16);
      setCurrency(data.pricing?.currency || "USD");

      // Set fast track eligibility (but don't auto-enable)
      const eligible = data.fast_track?.eligible || false;
      setFastTrackEligible(eligible);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedGb = (): number => {
    if (selectedOption !== null) {
      const opt = options.find((o) => o.gb === selectedOption);
      return opt?.gb || 0;
    }
    return parseInt(customGb) || 0;
  };

  const getPrice = (): number => {
    const gb = getSelectedGb();
    if (gb <= 0) return 0;
    const months = billingPeriod === "yearly" ? 12 : 1;
    return Math.round(pricePerGb * gb * months * 100) / 100;
  };

  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      NGN: "₦",
      GBP: "£",
      EUR: "€",
      ZAR: "R",
      KES: "KSh",
      GHS: "GH₵",
    };
    return symbols[curr?.toUpperCase()] || curr + " ";
  };

  const formatPrice = (amount: number): string => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async () => {
    const additionalGb = getSelectedGb();
    if (additionalGb <= 0) {
      ToastUtils.error("Please select or enter the amount of storage to add");
      return;
    }

    setSubmitting(true);
    try {
      const months = billingPeriod === "yearly" ? 12 : 1;
      const result = await objectStorageApi.extendStorage(
        accountId,
        additionalGb,
        months,
        fastTrackEligible && fastTrackEnabled
      );
      setPaymentResult(result);

      if (result.payment?.required === false || result.transaction?.status === "successful") {
        ToastUtils.success("Storage extended successfully!");
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to initiate storage extension");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedGb = getSelectedGb();
  const price = getPrice();
  const newQuota = currentQuotaGb + selectedGb;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Extend Storage</h3>
              <p className="text-sm text-white/80">{accountName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : paymentResult?.payment?.required ? (
            /* Payment Required - Use existing PaymentModal as proper modal */
            <PaymentModal
              isOpen={true}
              onClose={() => {
                setPaymentResult(null); // Reset to go back to selection
              }}
              mode="modal"
              transactionData={{
                data: {
                  transaction: paymentResult.transaction,
                  payment: paymentResult.payment,
                  order: {
                    storage_profiles: [
                      {
                        name: accountName,
                        months: billingPeriod === "yearly" ? 12 : 1,
                        subtotal: price,
                        currency: currency,
                      },
                    ],
                  },
                },
              }}
              onPaymentComplete={() => {
                ToastUtils.success("Payment successful! Storage extended.");
                onSuccess?.();
                onClose();
              }}
            />
          ) : (
            /* Selection UI */
            <>
              {/* Current Usage */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Current Storage</span>
                  <span className="text-sm font-medium text-gray-700">{currentQuotaGb} GB</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min((usedGb / currentQuotaGb) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{usedGb.toFixed(2)} GB used</span>
                  <span className="text-xs text-gray-400">
                    {(currentQuotaGb - usedGb).toFixed(2)} GB free
                  </span>
                </div>
              </div>

              {/* Billing Period Toggle */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingPeriod === "monthly"
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingPeriod === "yearly"
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Yearly (Save ~15%)
                </button>
              </div>

              {/* Fast Track Toggle (if eligible) */}
              {fastTrackEligible && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <div>
                        <span className="font-medium text-amber-800">Fast Track</span>
                        <p className="text-xs text-amber-600">Skip payment - instant activation</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={fastTrackEnabled}
                        onChange={(e) => setFastTrackEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:trangray-x-full rtl:peer-checked:after:-trangray-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </div>
                  </label>
                </div>
              )}

              {/* Quick Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {options.map((option) => (
                  <button
                    key={option.gb}
                    onClick={() => {
                      setSelectedOption(option.gb);
                      setCustomGb("");
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedOption === option.gb
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-lg text-gray-800">{option.label}</span>
                      {selectedOption === option.gb && (
                        <Check className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatPrice(
                        billingPeriod === "yearly" ? option.price_yearly : option.price_monthly
                      )}
                      /{billingPeriod === "yearly" ? "yr" : "mo"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Or enter custom amount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customGb}
                    onChange={(e) => {
                      setCustomGb(e.target.value);
                      setSelectedOption(null);
                    }}
                    placeholder="e.g., 200"
                    min="1"
                    max="1000"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <span className="text-gray-500 font-medium">GB</span>
                </div>
              </div>

              {/* Summary */}
              {selectedGb > 0 && (
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-primary-700">New Total Quota</span>
                    <span className="font-bold text-primary-800">{newQuota} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">
                      {billingPeriod === "yearly" ? "Annual" : "Monthly"} Cost
                    </span>
                    <span className="text-2xl font-bold text-primary-800">
                      {formatPrice(price)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedGb <= 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add {selectedGb > 0 ? `${selectedGb} GB` : "Storage"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtendStorageModal;
