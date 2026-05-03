import { useParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { InvoiceDetail } from "@/shared/components/billing/invoice";

export default function AdminInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  return (
    <AdminPageShell
      title="Invoice Details"
      description="View and manage invoice line items, payments, and reminders"
      contentClassName="space-y-6"
    >
      <InvoiceDetail
        identifier={invoiceId || ""}
        backPath="/admin-dashboard/invoices"
        context="admin"
      />
    </AdminPageShell>
  );
}
