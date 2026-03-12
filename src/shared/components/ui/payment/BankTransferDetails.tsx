import { Server } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import type { PaymentGatewayOption } from "./types";

interface BankTransferDetailsProps {
  selectedPaymentOption: PaymentGatewayOption;
}

const BankTransferDetails = ({ selectedPaymentOption }: BankTransferDetailsProps) => {
  const details = selectedPaymentOption.details;
  if (!details) return null;

  return (
    <div
      className="mt-6 rounded-xl border px-6 py-4"
      style={{
        backgroundColor: designTokens.colors.warning[50],
        borderColor: designTokens.colors.warning[200],
      }}
    >
      <h4
        className="mb-3 flex items-center font-semibold"
        style={{ color: designTokens.colors.warning[700] }}
      >
        <Server className="mr-2 h-4 w-4" />
        Bank Transfer Details
      </h4>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {details.account_name && (
          <div className="flex justify-between">
            <span style={{ color: designTokens.colors.warning[700] }}>Account Name:</span>
            <span
              className="font-mono font-medium"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              {details.account_name}
            </span>
          </div>
        )}
        {details.account_number && (
          <div className="flex justify-between">
            <span style={{ color: designTokens.colors.warning[700] }}>Account Number:</span>
            <span
              className="font-mono font-medium"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              {details.account_number}
            </span>
          </div>
        )}
        {details.bank_name && (
          <div className="flex justify-between">
            <span style={{ color: designTokens.colors.warning[700] }}>Bank:</span>
            <span className="font-medium" style={{ color: designTokens.colors.neutral[900] }}>
              {details.bank_name}
            </span>
          </div>
        )}
        <div
          className="flex items-center justify-between border-t pt-2"
          style={{ borderColor: designTokens.colors.warning[200] }}
        >
          <span style={{ color: designTokens.colors.warning[700] }}>Amount to Transfer:</span>
          <span className="text-lg font-bold" style={{ color: designTokens.colors.success[700] }}>
            {"\u20A6"}
            {selectedPaymentOption.total?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BankTransferDetails;
