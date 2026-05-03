import AdminPageShell from "../components/AdminPageShell";
import { InvoiceList } from "@/shared/components/billing/invoice";

export default function AdminInvoices() {
  return (
    <AdminPageShell
      title="Invoices"
      description="Manage all invoices issued across the platform"
      contentClassName="space-y-6"
    >
      <InvoiceList
        context="admin"
        detailBasePath="/admin-dashboard/invoices"
      />
    </AdminPageShell>
  );
}
