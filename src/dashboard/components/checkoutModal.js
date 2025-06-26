import { X, Loader2 } from "lucide-react";
import PaystackPop from "@paystack/inline-js"; // Correct import
import { useState, useCallback, useMemo } from "react";
import { useFetchProfile } from "../../hooks/resource";

const CheckoutModal = ({
  isOpen,
  onClose,
  checkoutData,
  onPaymentSuccess,
  goBackToCart,
}) => {
  // Extract metadata with fallbacks
  const metadata = checkoutData?.metadata || {
    country: "NG",
    subtotal: 0,
    tax_rate: { vat: 0.075 },
    tax_amount: 0,
    lines: [],
  };
  const { country, subtotal, tax_rate, tax_amount, lines } = metadata;
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();

  // Use amount from checkoutData as the amount to pay
  const totalWithTax = checkoutData?.amount || subtotal + tax_amount;

  // Determine the selected payment method's amount (if available)
  const selectedOption = checkoutData?.payment_gateway_options?.find(
    (option) => option.name.toLowerCase() === "paystack"
  );
  const amountToPay = selectedOption?.total || totalWithTax;

  // State
  const [isPaying, setIsPaying] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;

  // Create Paystack instance once using useMemo
  const popup = useMemo(() => new PaystackPop(), []);

  // Handle Paystack payment with useCallback to prevent redefinition
  const handlePaystackPayment = useCallback(() => {
    if (!paystackKey) {
      console.error("Paystack key is missing");
      setIsPaying(false);
      return;
    }

    setIsPaying(true);

    popup.newTransaction({
      key: paystackKey,
      email: profile?.email,
      amount: amountToPay * 100, // Convert to kobo
      reference: checkoutData?.identifier, // Fallback reference
      channels: ["card"],
      onSuccess: (transaction) => {
        console.log("Paystack Payment Successful:", transaction);
        setIsPaying(false);
        onPaymentSuccess({ reference: transaction.reference, saveCard });
        onClose();
      },
      onCancel: () => {
        console.log("Paystack Payment Cancelled");
        setIsPaying(false);
      },
      onError: (error) => {
        console.error("Paystack Payment Error:", error);
        setIsPaying(false);
      },
    });
  }, [paystackKey, amountToPay, checkoutData?.identifier, saveCard, popup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1010] font-Outfit">
      <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[400px] w-full overflow-y-auto">
          <div className="space-y-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                Payment Method
              </label>
              <span className="w-full px-2 py-4 border border-[#E9EAF4] rounded-[10px] block">
                <select className="text-sm text-[#676767] w-full outline-none">
                  {checkoutData?.payment_gateway_options?.length > 0 ? (
                    checkoutData.payment_gateway_options.map((option) => (
                      <option
                        key={option.id}
                        value={option.name.toLowerCase()}
                        selected={option.name.toLowerCase() === "paystack"}
                      >
                        {option.name} ({option.payment_type})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No payment methods available
                    </option>
                  )}
                </select>
              </span>
            </div>

            {/* Save Card Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saveCard"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="saveCard" className="text-sm text-[#676767]">
                Save card details for later
              </label>
            </div>

            {/* Transaction Breakdown */}
            <div className="bg-[#F8F8F8] rounded-lg py-4 px-6">
              <h3 className="text-sm font-medium text-[#1C1C1C] mb-4">
                Transaction Breakdown
              </h3>
              {lines.length > 0 ? (
                lines.map((line, index) => (
                  <div
                    key={index}
                    className="flex w-full items-center justify-between mb-2"
                  >
                    <span className="text-sm font-normal text-[#676767]">
                      {line.type} - {line.qty} x ₦
                      {parseFloat(line.unit_price).toLocaleString()}
                    </span>
                    <span className="text-sm font-normal text-[#1c1c1c]">
                      ₦{line.line_amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No items to display</p>
              )}
              <hr className="my-2 border-[#E9EAF4]" />
              <div className="flex w-full items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#676767]">
                  Total for Items
                </span>
                <span className="text-sm font-normal text-[#1c1c1c]">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex w-full items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#676767]">
                  Total including Tax ({(tax_rate.vat * 100).toFixed(2)}% VAT)
                </span>
                <span className="text-sm font-normal text-[#1c1c1c]">
                  ₦{totalWithTax.toLocaleString()}
                </span>
              </div>
              <hr className="my-2 border-[#E9EAF4]" />
              <div className="flex w-full items-center justify-between font-semibold">
                <span className="text-sm text-[#1C1C1C]">Amount to Pay</span>
                <span className="text-sm text-[#1c1c1c]">
                  ₦{amountToPay.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={goBackToCart}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePaystackPayment}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isPaying}
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Proceed"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
