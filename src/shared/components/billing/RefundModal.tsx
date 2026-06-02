/**
 * RefundModal — issue a refund against a paid invoice.
 *
 * Used by the tenant invoice detail page. Caps the refund amount at the
 * invoice's `amount_paid` and records an optional reason. Money is
 * rendered through `PriceLabel` so the currency comes from the invoice
 * data (never a hardcoded symbol).
 */
import React, { useMemo, useState } from "react";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernTextarea from "@/shared/components/ui/ModernTextarea";
import ModernButton from "@/shared/components/ui/ModernButton";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";
import { useRefundInvoice } from "@/shared/hooks/resources/refundHooks";
import type { Invoice } from "@/shared/hooks/resources/invoiceHooks";

interface RefundModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful refund (e.g. to refetch the detail). */
  onRefunded?: () => void;
}

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const RefundModal: React.FC<RefundModalProps> = ({ invoice, isOpen, onClose, onRefunded }) => {
  const refund = useRefundInvoice();

  const refundable = useMemo(() => toNumber(invoice.amount_paid), [invoice.amount_paid]);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const amountNum = amount.trim() === "" ? NaN : Number(amount);
  const amountError = (() => {
    if (amount.trim() === "") return "";
    if (!Number.isFinite(amountNum) || amountNum <= 0) return "Enter an amount greater than zero.";
    if (amountNum > refundable) return "Amount cannot exceed the amount paid.";
    return "";
  })();

  const canSubmit =
    Number.isFinite(amountNum) && amountNum > 0 && amountNum <= refundable && !refund.isPending;

  const close = () => {
    setAmount("");
    setReason("");
    onClose();
  };

  const submit = () => {
    if (!canSubmit) return;
    refund.mutate(
      {
        id: invoice.uuid,
        amount: amountNum,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          close();
          onRefunded?.();
        },
      }
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      title={`Refund ${invoice.invoice_number ?? "invoice"}`}
      onClose={close}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-[rgb(var(--theme-color-50))] px-3 py-2 text-sm">
          <span className="text-[var(--theme-muted-color)]">Refundable</span>
          <PriceLabel
            amount={refundable}
            sourceCurrency={invoice.currency}
            className="font-semibold tabular-nums text-[var(--theme-heading-color)]"
          />
        </div>

        <ModernInput
          label="Refund amount"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          size="sm"
          error={amountError}
          required
        />

        <ModernTextarea
          label="Reason (optional)"
          placeholder="Why is this invoice being refunded?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-1">
          <ModernButton variant="secondary" onClick={close}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={submit}
            isLoading={refund.isPending}
            isDisabled={!canSubmit}
          >
            Issue Refund
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
};

export default RefundModal;
