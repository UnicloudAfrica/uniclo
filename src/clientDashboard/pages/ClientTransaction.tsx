// @ts-nocheck
import React, { useState } from "react";
import { Settings2 } from "lucide-react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientPaymentHistory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((previous) => !previous);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const headerActions = (
    <button className="flex items-center gap-2 rounded-full bg-[#F2F4F8] px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
      <Settings2 className="h-4 w-4 text-[#555E67]" />
      <span>Filter</span>
    </button>
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
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
