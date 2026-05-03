import ClientPageShell from "../components/ClientPageShell";
import { InvoiceList } from "@/shared/components/billing/invoice";

const ClientInvoices: React.FC = () => {
  return (
    <ClientPageShell
      title="Invoices"
      description="View your invoices and payment history"
      contentClassName="space-y-6"
    >
      <InvoiceList
        context="client"
        detailBasePath="/client-dashboard/invoices"
      />
    </ClientPageShell>
  );
};

export default ClientInvoices;
