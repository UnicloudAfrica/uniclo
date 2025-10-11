"use client";
import React, { useCallback, useEffect, useState } from "react";
import { X, Check, Loader2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useVerifyClientTransaction } from "../../../hooks/clientHooks/transactionHooks";

const SuccessModal = ({
  isOpen,
  onClose,
  transactionReference,
  saveCard,
  closeEv,
}) => {
  const [hasVerified, setHasVerified] = useState(false);
  const [hasError, setHasError] = useState(false);

  const {
    mutate: verifyTransaction,
    isPending,
    isSuccess,
    isError,
    reset,
  } = useVerifyClientTransaction();
  const queryClient = useQueryClient();

  const startVerification = useCallback(() => {
    if (transactionReference && !hasVerified && !isPending && !isSuccess) {
      verifyTransaction(
        {
          transactionIdentifier: transactionReference,
          userData: {
            payment_gateway: "Paystack", // Assuming Paystack for this context
            save_card_details: saveCard || false,
          },
        },
        {
          onSuccess: () => {
            setHasVerified(true);
            setHasError(false);
            queryClient.invalidateQueries(["instances"]);
            closeEv();
          },
          onError: (err) => {
            console.error("Transaction verification failed:", err);
            setHasVerified(false);
            setHasError(true);
          },
        }
      );
    }
  }, [
    transactionReference,
    saveCard,
    hasVerified,
    isPending,
    isSuccess,
    verifyTransaction,
  ]);

  useEffect(() => {
    if (isOpen && transactionReference) {
      startVerification();
    }
  }, [isOpen, transactionReference]);

  const handleRetry = () => {
    reset(); // Reset react-query mutation state
    setHasError(false);
    setHasVerified(false);
    startVerification(); // Retry immediately
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1020] font-Outfit">
      <div className="bg-white rounded-[30px] w-full max-w-[650px] mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[30px]">
          <h2 className="text-lg font-semibold text-[#1C1C1C]">
            Transaction Status
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {isPending && (
            <>
              <div className="w-20 h-20 bg-[#E0E0E0] rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-[#676767] animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-3">
                Verifying transaction...
              </h3>
              <p className="text-[#676767] text-base leading-relaxed max-w-[500px] mx-auto">
                Please wait while we verify your payment.
              </p>
            </>
          )}

          {isSuccess && (
            <>
              <div className="w-20 h-20 bg-[#008D4F] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-3">
                Successful!
              </h3>
              <p className="text-[#676767] text-base leading-relaxed max-w-[500px] mx-auto">
                Your module has been successfully provisioned. You can now start
                using your new service right away.
              </p>
            </>
          )}

          {hasError && isError && (
            <>
              <div className="w-20 h-20 bg-[#FFD6D6] rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-[#D14343]" />
              </div>
              <h3 className="text-xl font-semibold text-[#D14343] mb-3">
                Verification Failed
              </h3>
              <p className="text-[#676767] text-base leading-relaxed max-w-[500px] mx-auto mb-4">
                We couldn't verify your transaction. Please try again.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-[--theme-color] text-white font-medium rounded-[30px] hover:bg-[--secondary-color] transition-colors"
              >
                Retry Verification
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {isSuccess && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-[--theme-color] text-white font-semibold text-base rounded-[30px] hover:bg-[--secondary-color] transition-colors"
            >
              Go back home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessModal;
