import { useParams } from "react-router-dom";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { InvoiceDetail } from "@/shared/components/billing/invoice";

const TenantInvoiceDetail: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  return (
    <TenantPageShell
      title="Invoice Details"
      description="View and manage invoice line items, payments, and reminders"
      contentClassName="space-y-6"
    >
      <InvoiceDetail
        identifier={invoiceId || ""}
        backPath="/dashboard/invoices"
        context="tenant"
      />
    </TenantPageShell>
  );
};

export default TenantInvoiceDetail;
