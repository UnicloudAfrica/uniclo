import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";

const TenantObjectStoragePurchase = () => {
  const navigate = useNavigate();

  return (
    <TenantPageShell
      title="Purchase Object Storage"
      description="Capture the tenant's preferred region and tier, then generate a payable order."
      subHeaderContent={
        <button
          type="button"
          onClick={() => navigate("/dashboard/object-storage")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to storage overview
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
          onClick={() => navigate("/dashboard/object-storage")}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to storage overview
        </button>
      </div>
    </TenantPageShell>
  );
};

export default TenantObjectStoragePurchase;
