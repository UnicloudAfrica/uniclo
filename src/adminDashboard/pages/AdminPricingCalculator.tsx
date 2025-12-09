// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell.tsx";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import { SharedPricingCalculator } from "../../shared/components";

const AdminPricingCalculator = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeadbar />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <AdminPageShell
            title="Advanced Pricing Calculator"
            description="Build, price, and assign complex infrastructure quotes."
          >
            <SharedPricingCalculator mode="admin" onExit={() => navigate("/admin-dashboard")} />
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
};
export default AdminPricingCalculator;
