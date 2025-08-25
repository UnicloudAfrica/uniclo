// src/components/PaymentStep.jsx
import React from "react";
import { Loader2 } from "lucide-react";
import { formatPrice, getCurrencySymbol } from "../../../utils/resource";

const PaymentStep = ({
  isSubmissionPending,
  isSubmissionError,
  generalError,
  instanceRequestResponse,
  selectedPaymentOption,
  handlePaymentOptionChange,
  isPaying,
  isProfileFetching,
  saveCard,
  setSaveCard,
  amountToPayFromGateway,
}) => {
  const pricing_breakdown =
    instanceRequestResponse?.metadata?.pricing_breakdown;

  return (
    <div className="text-center space-y-6 py-10 w-full">
      <h3 className="text-2xl font-bold text-[#288DD1]">Payment Details</h3>
      {isSubmissionPending ? (
        <div className="flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Processing your request...</p>
        </div>
      ) : isSubmissionError ? (
        <div className="text-red-500">
          <p className="text-lg font-semibold">Error!</p>
          <p>
            {generalError || "Failed to process your order. Please try again."}
          </p>
        </div>
      ) : instanceRequestResponse ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-2 text-left">
              Payment Method
            </label>
            <span className="w-full px-2 py-4 border border-[#E9EAF4] rounded-[10px] block">
              {instanceRequestResponse.payment_gateway_options &&
              instanceRequestResponse.payment_gateway_options.length > 0 ? (
                <select
                  className="text-sm text-[#676767] w-full outline-none"
                  value={selectedPaymentOption?.id || ""}
                  onChange={handlePaymentOptionChange}
                  disabled={isPaying || isProfileFetching}
                >
                  {instanceRequestResponse.payment_gateway_options.map(
                    (option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.payment_type})
                      </option>
                    )
                  )}
                </select>
              ) : (
                <div className="flex items-center py-2 text-gray-500 text-sm">
                  No payment methods available.
                </div>
              )}
            </span>
          </div>
          {selectedPaymentOption?.payment_type.toLowerCase() !==
            "bank transfer" && (
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
          {selectedPaymentOption?.payment_type.toLowerCase() ===
            "bank transfer" &&
            selectedPaymentOption?.details && (
              <div className="bg-[#F8F8F8] rounded-lg py-4 px-6 text-left">
                <h3 className="text-sm font-medium text-[#1C1C1C] mb-4">
                  Bank Account Details
                </h3>
                <div className="space-y-2">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-normal text-[#676767]">
                      Account formatPrice:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {selectedPaymentOption.details.account_formatPrice ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-normal text-[#676767]">
                      Account Name:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {selectedPaymentOption.details.account_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-normal text-[#676767]">
                      Provider:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {selectedPaymentOption.details.provider || "N/A"}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-normal text-[#676767]">
                      Currency:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {selectedPaymentOption.details.currency || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          <div className="bg-[#F8F8F8] rounded-lg py-4 px-6 text-left">
            <h3 className="text-sm font-medium text-[#1C1C1C] mb-4">
              Transaction Breakdown
            </h3>
            {pricing_breakdown ? (
              <>
                {pricing_breakdown.lines.map((line) => (
                  <div
                    key={line.slug}
                    className="flex w-full items-center justify-between mb-2"
                  >
                    <span className="text-sm font-normal text-[#676767]">
                      {line.name}:
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      {getCurrencySymbol(pricing_breakdown.currency)}{" "}
                      {formatPrice(line.total_local)}
                    </span>
                  </div>
                ))}
                <hr className="my-2 border-[#E9EAF4]" />
                <div className="flex w-full items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#676767]">
                    Subtotal:
                  </span>
                  <span className="text-sm font-normal text-[#1c1c1c]">
                    {getCurrencySymbol(pricing_breakdown.currency)}{" "}
                    {formatPrice(pricing_breakdown.subtotal)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#676767]">
                    Tax (
                    {formatPrice(
                      (pricing_breakdown.tax / pricing_breakdown.subtotal) * 100
                    )}
                    % VAT):
                  </span>
                  <span className="text-sm font-normal text-[#1c1c1c]">
                    {getCurrencySymbol(pricing_breakdown.currency)}{" "}
                    {formatPrice(pricing_breakdown.tax)}
                  </span>
                </div>
                <hr className="my-2 border-[#E9EAF4]" />
                <div className="flex w-full items-center justify-between font-semibold">
                  <span className="text-sm text-[#1C1C1C]">Total:</span>
                  <span className="text-sm text-[#1c1c1c]">
                    {getCurrencySymbol(pricing_breakdown.currency)}{" "}
                    {formatPrice(pricing_breakdown.total)}
                  </span>
                </div>
                {selectedPaymentOption && (
                  <div className="flex w-full items-center justify-between font-semibold mt-2">
                    <span className="text-sm text-[#1C1C1C]">
                      Amount to Pay:
                    </span>
                    <span className="text-sm text-[#1c1c1c]">
                      {getCurrencySymbol(pricing_breakdown.currency)}{" "}
                      {formatPrice(selectedPaymentOption.total)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No pricing breakdown available.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-700">
          Proceed to previous step to generate payment details.
        </p>
      )}
    </div>
  );
};

export default PaymentStep;
