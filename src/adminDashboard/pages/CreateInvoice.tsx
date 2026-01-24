// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { SharedCreateInvoice } from "../../shared/components";

const CreateInvoice = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <AdminPageShell
            title="Create Invoice"
            description="Build comprehensive invoices, assign them to tenants or users, and generate pricing breakdowns."
            contentClassName="pb-20"
          >
            <SharedCreateInvoice mode="admin" onExit={() => navigate("/admin-dashboard")} />
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
};
export default CreateInvoice;
