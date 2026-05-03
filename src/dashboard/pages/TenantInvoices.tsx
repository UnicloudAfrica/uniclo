import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { InvoiceList } from "@/shared/components/billing/invoice";

const TenantInvoices: React.FC = () => {
  return (
    <TenantPageShell
      title="Invoices"
      description="Manage invoices issued to your customers"
      contentClassName="space-y-6"
    >
      <InvoiceList
        context="tenant"
        detailBasePath="/dashboard/invoices"
      />
    </TenantPageShell>
  );
};

export default TenantInvoices;
