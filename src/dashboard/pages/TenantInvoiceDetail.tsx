import { useState } from "react";
import { useParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { InvoiceDetail } from "@/shared/components/billing/invoice";
import ModernButton from "@/shared/components/ui/ModernButton";
import RefundModal from "@/shared/components/billing/RefundModal";
import { useFetchInvoiceById, type Invoice } from "@/shared/hooks/resources/invoiceHooks";

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const TenantInvoiceDetail: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { data, refetch } = useFetchInvoiceById(invoiceId || "");
  const invoice = data as Invoice | undefined;

  const [showRefund, setShowRefund] = useState(false);

  // Refundable when the invoice has captured money and isn't already
  // fully reversed. Mirrors the backend's refund eligibility.
  const canRefund =
    !!invoice &&
    toNumber(invoice.amount_paid) > 0 &&
    invoice.status !== "void" &&
    invoice.status !== "refunded";

  return (
    <TenantPageShell
      title="Invoice Details"
      description="View and manage invoice line items, payments, and reminders"
      contentClassName="space-y-6"
    >
      {canRefund && invoice ? (
        <div className="flex justify-end">
          <ModernButton
            variant="outlineDanger"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => setShowRefund(true)}
          >
            Issue Refund
          </ModernButton>
        </div>
      ) : null}

      <InvoiceDetail identifier={invoiceId || ""} backPath="/dashboard/invoices" context="tenant" />

      {invoice ? (
        <RefundModal
          invoice={invoice}
          isOpen={showRefund}
          onClose={() => setShowRefund(false)}
          onRefunded={() => refetch()}
        />
      ) : null}
    </TenantPageShell>
  );
};

export default TenantInvoiceDetail;
