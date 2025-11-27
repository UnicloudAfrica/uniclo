import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientPageShell from "../components/ClientPageShell";

const ClientObjectStoragePurchasePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <ClientPageShell
        title="Purchase Object Storage"
        description="Choose the Zadara region and tier required for this client workspace."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Object Storage", href: "/client-dashboard/object-storage" },
          { label: "Purchase" },
        ]}
        subHeaderContent={
          <button
            type="button"
            onClick={() => navigate("/client-dashboard/object-storage")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to storage
          </button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          <p className="text-base font-semibold text-slate-900">Object storage purchase unavailable</p>
          <p className="mt-2">
            The object storage purchase form has been removed. Please contact support or your administrator to place
            a storage order.
          </p>
          <button
            type="button"
            onClick={() => navigate("/client-dashboard/object-storage")}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to storage
          </button>
        </div>
      </ClientPageShell>
    </>
  );
};

export default ClientObjectStoragePurchasePage;
