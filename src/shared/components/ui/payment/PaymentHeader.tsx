import { useMemo } from "react";
import { X, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { designTokens } from "@/styles/designTokens";

type PaymentStatusValue = "pending" | "completed" | "failed" | "expired" | "processing";

interface PaymentHeaderProps {
  paymentStatus: PaymentStatusValue;
  paymentMode: string | null;
  displayReference: string | null;
  isInline: boolean;
  timeRemaining: { hours: number; minutes: number; seconds: number } | null;
  onClose: () => void;
}

const PaymentHeader = ({
  paymentStatus,
  paymentMode,
  displayReference,
  isInline,
  timeRemaining,
  onClose,
}: PaymentHeaderProps) => {
  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "completed":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "failed":
      case "expired":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case "completed":
        return "Payment completed! Your instances are being provisioned and will be available shortly.";
      case "failed":
        return "Payment failed. Please try again or contact support.";
      case "expired":
        return "Payment link has expired. Please create a new order.";
      case "processing":
        return "Payment is processing. We will update the status once confirmation returns.";
      default:
        return paymentMode === "card"
          ? "Pay with card to complete your order. Status updates after confirmation."
          : "Complete your payment to proceed with instance provisioning.";
    }
  };

  const statusBadgeColor = useMemo(() => {
    const successBg = designTokens?.colors?.success?.[100] || "var(--theme-surface-alt)";
    const successText = designTokens?.colors?.success?.[700] || "rgb(var(--theme-success-700))";
    const dangerBg = designTokens?.colors?.error?.[100] || "rgb(var(--theme-danger-100))";
    const dangerText = designTokens?.colors?.error?.[700] || "rgb(var(--theme-danger-700))";
    const warningBg = designTokens?.colors?.warning?.[100] || "rgb(var(--theme-warning-100))";
    const warningText = designTokens?.colors?.warning?.[700] || "rgb(var(--theme-warning-700))";
    const neutralBg = designTokens?.colors?.neutral?.[100] || "var(--theme-surface-alt)";
    const neutralText = designTokens?.colors?.neutral?.[700] || "var(--theme-heading-color)";

    if (paymentStatus === "completed") {
      return { bg: successBg, text: successText, label: "Completed" };
    }
    if (paymentStatus === "failed") {
      return { bg: dangerBg, text: dangerText, label: "Failed" };
    }
    if (paymentStatus === "processing") {
      return { bg: warningBg, text: warningText, label: "Processing" };
    }
    return { bg: neutralBg, text: neutralText, label: "Pending" };
  }, [paymentStatus]);

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: designTokens.colors.neutral[200] }}
      >
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3
              className="text-xl font-semibold"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              {paymentStatus === "completed" ? "Payment Successful!" : "Complete Payment"}
            </h3>
            <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
              Transaction #{displayReference || "\u2014"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: statusBadgeColor.bg,
              color: statusBadgeColor.text,
            }}
          >
            {statusBadgeColor.label}
          </span>
          {!isInline && paymentStatus !== "completed" && (
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              style={{ color: designTokens.colors.neutral[500] }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div
        className="px-6 py-4 border-b"
        style={{
          backgroundColor:
            paymentStatus === "completed"
              ? designTokens.colors.success[50]
              : designTokens.colors.neutral[50],
          borderColor: designTokens.colors.neutral[200],
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-sm font-medium"
            style={{
              color:
                paymentStatus === "completed"
                  ? designTokens.colors.success[700]
                  : designTokens.colors.neutral[700],
            }}
          >
            {getStatusMessage()}
          </p>
          {timeRemaining && paymentStatus === "pending" && (
            <div
              className="text-sm font-medium"
              style={{ color: designTokens.colors.warning[600] }}
            >
              Expires in {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentHeader;
