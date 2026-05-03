import { useParams } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import { InvoiceDetail } from "@/shared/components/billing/invoice";

const ClientInvoiceDetail: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  return (
    <ClientPageShell
      title="Invoice Details"
      description="View invoice line items and pay outstanding balances"
      contentClassName="space-y-6"
    >
      <InvoiceDetail
        identifier={invoiceId || ""}
        backPath="/client-dashboard/invoices"
        context="client"
      />
    </ClientPageShell>
  );
};

export default ClientInvoiceDetail;
