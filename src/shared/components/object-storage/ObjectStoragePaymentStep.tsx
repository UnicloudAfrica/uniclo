import React from "react";
import { SummaryTotals } from "../../../hooks/useObjectStoragePricing";

export interface PaymentOption {
  gateway: string;
  method?: string;
  identifier?: string;
  amount?: number;
  currency?: string;
  charge_breakdown?: {
    total_fees?: number;
    subtotal?: number;
    tax?: number;
  };
  payment_url?: string;
  public_key?: string;
  reference?: string;
}

export interface ObjectStoragePaymentStepProps {
  paymentOptions: PaymentOption[];
  selectedOption: PaymentOption | null;
  onSelectOption: (option: PaymentOption) => void;
  onPaystackPay?: (option: PaymentOption) => void;
  onStripePay?: (option: PaymentOption) => void;
  totals: SummaryTotals;
  isPaymentComplete?: boolean;
  isPaymentFailed?: boolean;
  isProcessing?: boolean;
  transactionId?: string;
  dashboardContext: "admin" | "tenant" | "client";
}

export const ObjectStoragePaymentStep: React.FC<ObjectStoragePaymentStepProps> = ({
  paymentOptions,
  selectedOption,
  onSelectOption,
  onPaystackPay,
  onStripePay,
  totals,
  isPaymentComplete,
  isPaymentFailed,
  isProcessing,
  transactionId,
  dashboardContext,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const getGatewayIcon = (gateway: string) => {
    switch (gateway?.toLowerCase()) {
      case "paystack":
        return "💳";
      case "stripe":
        return "💳";
      case "bank_transfer":
      case "bank":
        return "🏦";
      default:
        return "💰";
    }
  };

  const getGatewayLabel = (option: PaymentOption) => {
    const gateway = option.gateway || "Unknown";
    const method = option.method || "";
    if (method) {
      return `${gateway} - ${method}`;
    }
    return gateway;
  };

  const handlePayNow = (option: PaymentOption) => {
    const gateway = option.gateway?.toLowerCase();
    if (gateway === "paystack" && onPaystackPay) {
      onPaystackPay(option);
    } else if (gateway === "stripe" && onStripePay) {
      onStripePay(option);
    } else if (option.payment_url) {
      window.open(option.payment_url, "_blank");
    }
  };

  return (
    <div className="payment-step">
      <div className="step-header">
        <h2 className="step-title">Payment</h2>
        <p className="step-description">Select a payment method to complete your order.</p>
      </div>

      {/* Payment Status */}
      {isPaymentComplete && (
        <div className="payment-status-banner success">
          <span className="status-icon">✓</span>
          <div className="status-content">
            <div className="status-title">Payment Successful</div>
            {transactionId && <div className="status-detail">Transaction: {transactionId}</div>}
          </div>
        </div>
      )}

      {isPaymentFailed && (
        <div className="payment-status-banner failed">
          <span className="status-icon">✕</span>
          <div className="status-content">
            <div className="status-title">Payment Failed</div>
            <div className="status-detail">Please try again or select a different method.</div>
          </div>
        </div>
      )}

      {/* Payment Amount */}
      <div className="payment-amount-card">
        <div className="amount-label">Amount Due</div>
        <div className="amount-value">{formatCurrency(totals.total, totals.currency)}</div>
        {totals.tax > 0 && (
          <div className="amount-breakdown">
            Subtotal: {formatCurrency(totals.subtotal, totals.currency)} + Tax:{" "}
            {formatCurrency(totals.tax, totals.currency)}
          </div>
        )}
      </div>

      {/* Payment Options */}
      {!isPaymentComplete && paymentOptions.length > 0 && (
        <div className="payment-options">
          <h3 className="section-title">Available Payment Methods</h3>
          <div className="options-grid">
            {paymentOptions.map((option, index) => {
              const isSelected = selectedOption === option;
              const fees = option.charge_breakdown?.total_fees || 0;

              return (
                <div
                  key={`${option.gateway}-${option.method || index}`}
                  className={`payment-option-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelectOption(option)}
                >
                  <div className="option-header">
                    <span className="option-icon">{getGatewayIcon(option.gateway)}</span>
                    <span className="option-name">{getGatewayLabel(option)}</span>
                    {isSelected && <span className="selected-badge">✓</span>}
                  </div>
                  {fees > 0 && (
                    <div className="option-fees">
                      Gateway fee: {formatCurrency(fees, option.currency || totals.currency)}
                    </div>
                  )}
                  {isSelected && (
                    <button
                      type="button"
                      className="btn btn-primary btn-pay-now"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayNow(option);
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Pay Now"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Payment Options */}
      {!isPaymentComplete && paymentOptions.length === 0 && (
        <div className="no-payment-options">
          <p>No payment options available. Please go back and generate payment options.</p>
        </div>
      )}

      {/* Payment Complete - Continue */}
      {isPaymentComplete && (
        <div className="payment-complete-actions">
          <p className="success-message">
            Payment has been successfully processed. You can now proceed to review and submit your
            order.
          </p>
        </div>
      )}
    </div>
  );
};
