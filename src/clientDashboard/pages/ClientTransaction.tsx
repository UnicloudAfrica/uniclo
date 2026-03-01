import { Settings2 } from "lucide-react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientPaymentHistory() {
  const headerActions = (
    <button className="flex items-center gap-2 rounded-full bg-[var(--theme-surface-alt)] px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
      <Settings2 className="h-4 w-4 text-[var(--theme-heading-color)]" />
      <span>Filter</span>
    </button>
  );

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Payment History"
        description="Review your billing transactions and download detailed receipts."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Billing" },
          { label: "Payment History" },
        ]}
        actions={headerActions}
      />
    </>
  );
}
