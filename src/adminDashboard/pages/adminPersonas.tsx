// @ts-nocheck
import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell.tsx";
import ProductSideMenu from "./inventoryComponents/productssidemenu";

export default function AdminPersonas() {
  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminActiveTab />
      <AdminPageShell
        title="Product Personas"
        description="Define customer personas to tailor module bundles and pricing."
        contentClassName="flex flex-col lg:flex-row gap-6"
      >
        <ProductSideMenu />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6"></div>
      </AdminPageShell>
    </>
  );
}
