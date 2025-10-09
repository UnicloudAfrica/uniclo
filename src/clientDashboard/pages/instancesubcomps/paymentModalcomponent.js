// src/components/PaymentModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import PaystackPop from "@paystack/inline-js";
import { useFetchClientProfile } from "../../../hooks/clientHooks/resources";

const PaymentModal = ({ isOpen, onClose, transaction, onPaymentInitiated }) => {
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [saveCard, setSaveCard] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;
  const { data: profile, isFetching: isProfileFetching } =
    useFetchClientProfile();
  const popup = useMemo(() => new PaystackPop(), []);

  useEffect(() => {
    if (isOpen && transaction?.payment_gateway_options?.length > 0) {
      const paystackCardOption = transaction.payment_gateway_options.find(
        (option) =>
          option.name.toLowerCase() === "paystack" &&
          option.payment_type.toLowerCase() === "card"
      );
      setSelectedPaymentOption(
        paystackCardOption || transaction.payment_gateway_options[0]
      );
    } else {
      setSelectedPaymentOption(null);
    }
  }, [isOpen, transaction]);

  const handlePaymentOptionChange = (e) => {
    const selectedId = e.target.value;
    const option = transaction?.payment_gateway_options?.find(
      (opt) => String(opt.id) === String(selectedId)
    );
    setSelectedPaymentOption(option);
  };

  const handlePaystackCardPayment = useCallback(() => {
    if (
      !paystackKey ||
      !profile?.email ||
      !transaction?.amount ||
      !transaction?.identifier
    ) {
      // alert("Payment cannot proceed due to missing configuration or details.");
      return;
    }

    setIsPaying(true);

    popup.newTransaction({
      key: paystackKey,
      email: profile.email,
      amount: transaction.amount * 100,
      reference: transaction.identifier,
      channels: ["card"],
      onSuccess: (response) => {
        setIsPaying(false);
        onPaymentInitiated(transaction.identifier, saveCard);
        onClose();
      },
      onCancel: () => {
        setIsPaying(false);
        alert("Payment cancelled.");
      },
      onError: (error) => {
        alert(`Payment failed: ${error.message || "Unknown error"}`);
        setIsPaying(false);
      },
    });
  }, [
    paystackKey,
    profile?.email,
    transaction,
    saveCard,
    popup,
    onClose,
    onPaymentInitiated,
  ]);

  const handleBankTransferPaid = () => {
    if (transaction?.identifier) {
      onPaymentInitiated(transaction.identifier, saveCard);
      onClose();
    } else {
      // alert("No transaction reference available.");
    }
  };

  if (!isOpen || !transaction) return null;

  const pricingBreakdown = transaction.metadata?.pricing_breakdown;
  const amountToPay = pricingBreakdown?.total || 0;

  // Extract costs from pricing_breakdown.lines with number validation
  const computeCost =
    Number(
      pricingBreakdown?.lines?.find((line) => line.slug === "compute")
        ?.total_local
    ) || 0;
  const storageCost =
    Number(
      pricingBreakdown?.lines?.find((line) => line.slug === "storage")
        ?.total_local
    ) || 0;
  const osCost =
    Number(
      pricingBreakdown?.lines?.find((line) => line.slug === "os-image")
        ?.total_local
    ) || 0;
  const bandwidthCost =
    Number(
      pricingBreakdown?.lines?.find((line) => line.slug === "bandwidth")
        ?.total_local
    ) || 0;

  console.log(transaction);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1010] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPaying}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-6 w-full">
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2 text-left">
                Payment Method
              </label>
              <span className="w-full px-2 py-4 border border-[#E9EAF4] rounded-[10px] block">
                {transaction.payment_gateway_options &&
                transaction.payment_gateway_options.length > 0 ? (
                  <select
                    className="text-sm text-[#676767] w-full outline-none"
                    value={selectedPaymentOption?.id || ""}
                    onChange={handlePaymentOptionChange}
                    disabled={isPaying || isProfileFetching}
                  >
                    {transaction.payment_gateway_options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.payment_type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center py-2 text-gray-500 text-sm">
                    No payment methods available.
                  </div>
                )}
              </span>
            </div>
            {selectedPaymentOption?.payment_type.toLowerCase() === "card" && (
              <div className="flex items-center justify-start w-full">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="mr-2 h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                  disabled={isPaying}
                />
                <label htmlFor="saveCard" className="text-sm text-[#676767]">
                  Save card details for later
                </label>
              </div>
            )}
            <div className="bg-[#F8F8F8] rounded-lg py-4 px-6 text-left">
              <h3 className="text-sm font-medium text-[#1C1C1C] mb-4">
                Transaction Breakdown
              </h3>
              {pricingBreakdown ? (
                <>
                  <div className="flex w-full items-center justify-between mb-2">
                    <span className="text-sm font-normal text-[#676767]">
                      Compute Cost:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(computeCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between mb-2">
                    <span className="text-sm font-normal text-[#676767]">
                      Storage Cost:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(storageCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between mb-2">
                    <span className="text-sm font-normal text-[#676767]">
                      OS Cost:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(osCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between mb-2">
                    <span className="text-sm font-normal text-[#676767]">
                      Bandwidth Cost:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(bandwidthCost).toLocaleString()}
                    </span>
                  </div>
                  <hr className="my-2 border-[#E9EAF4]" />
                  <div className="flex w-full items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#676767]">
                      Subtotal:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(pricingBreakdown.subtotal).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#676767]">
                      Tax (
                      {Number(
                        (pricingBreakdown.tax / pricingBreakdown.subtotal) * 100
                      ).toFixed(2)}
                      % VAT):
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(pricingBreakdown.tax).toLocaleString()}
                    </span>
                  </div>
                  <hr className="my-2 border-[#E9EAF4]" />
                  <div className="flex w-full items-center justify-between font-semibold">
                    <span className="text-sm text-[#1C1C1C]">Total:</span>
                    <span className="text-sm text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(pricingBreakdown.total).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between font-semibold mt-2">
                    <span className="text-sm text-[#1C1C1C]">
                      Amount to Pay:
                    </span>
                    <span className="text-sm text-[#1c1c1c]">
                      {pricingBreakdown.currency}{" "}
                      {Number(amountToPay).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No pricing breakdown available.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isPaying}
          >
            Close
          </button>
          {selectedPaymentOption?.name.toLowerCase() === "paystack" &&
            selectedPaymentOption?.payment_type.toLowerCase() === "card" && (
              <button
                onClick={handlePaystackCardPayment}
                disabled={isPaying || isProfileFetching}
                className="ml-3 px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Pay with Card
                {(isPaying || isProfileFetching) && (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                )}
              </button>
            )}
          {selectedPaymentOption?.name.toLowerCase() === "paystack" &&
            selectedPaymentOption?.payment_type.toLowerCase() ===
              "bank transfer" && (
              <button
                onClick={handleBankTransferPaid}
                disabled={isPaying}
                className="ml-3 px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                I have paid
                {isPaying && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
