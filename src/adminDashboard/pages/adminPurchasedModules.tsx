// @ts-nocheck
import React, { useState } from "react";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchProducts } from "../../hooks/adminHooks/productsHook";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernTable from "../../shared/components/ui/ModernTable";
import { ModernCard } from "../../shared/components/ui";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import {
  Loader2,
  Package,
  ShoppingCart,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Download,
} from "lucide-react";
import { designTokens } from "../../styles/designTokens";

export default function AdminPurchasedModules() {
  const { isLoading } = useAuthRedirect();
  const {
    data: purchasedProducts,
    isFetching: ispurchasedProductsFetching,
    isError: isPurchasedProductsError,
    error: purchasedProductsError,
    refetch: refetchPurchasedProducts,
  } = useFetchProducts();

  // Function to toggle mobile menu

  // Function to close mobile menu

  // Calculate module statistics
  const moduleStats = {
    totalModules: purchasedProducts?.length || 0,
    totalValue: purchasedProducts?.reduce((sum, module) => sum + (module.price || 0), 0) || 0,
    recentPurchases:
      purchasedProducts?.filter((module) => {
        const purchaseDate = new Date(module.purchasedDate || module.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return purchaseDate >= thirtyDaysAgo;
      }).length || 0,
    uniqueModuleTypes: [
      ...new Set(purchasedProducts?.map((module) => module.type || "Standard") || []),
    ].length,
  };
  // Define columns for ModernTable
  const columns = [
    {
      key: "name",
      header: "Module Name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (value) => (
        <div className="max-w-xs truncate">
          <span title={value}>{value || "No description available"}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (value) => (
        <div className="flex items-center gap-1">
          <DollarSign size={14} style={{ color: designTokens.colors.success[500] }} />
          <span className="font-medium">${(value || 0).toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: "purchasedDate",
      header: "Purchase Date",
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">
            {value
              ? new Date(value).toLocaleDateString()
              : item.created_at
                ? new Date(item.created_at).toLocaleDateString()
                : "N/A"}
          </span>
        </div>
      ),
    },
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Download size={16} />,
      label: "Download",
      onClick: (item) => handleDownload(item),
    },
    {
      icon: <Edit2 size={16} />,
      label: "Edit",
      onClick: (item) => handleEdit(item),
    },
    {
      icon: <Trash2 size={16} />,
      label: "Delete",
      onClick: (item) => handleDelete(item),
      variant: "destructive",
    },
  ];

  // Action handlers
  const handleDownload = (module: any) => {
    console.log("Download module:", module);
    // Implement download logic
  };
  const handleEdit = (module: any) => {
    console.log("Edit module:", module);
    // Implement edit logic
  };
  const handleDelete = (module: any) => {
    console.log("Delete module:", module);
    // Implement delete logic
  };
  const handleAddModule = () => {
    console.log("Add new module");
    // Implement add module logic
  };
  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: designTokens.colors.primary[500] }}
        />
        <p className="ml-2" style={{ color: designTokens.colors.neutral[700] }}>
          Loading...
        </p>
      </div>
    );
  }

  // Module loading state
  if (ispurchasedProductsFetching) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8 flex items-center justify-center">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: designTokens.colors.primary[500] }}
          />
          <p className="ml-2" style={{ color: designTokens.colors.neutral[700] }}>
            Loading purchased modules...
          </p>
        </main>
      </>
    );
  }

  // Error state
  if (isPurchasedProductsError) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        <AdminActiveTab />
        <main
          className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8 flex items-center justify-center"
          style={{ backgroundColor: designTokens.colors.neutral[25] }}
        >
          <ModernCard className="max-w-xl w-full">
            <div className="text-center">
              <div
                className="text-lg font-medium mb-2"
                style={{ color: designTokens.colors.error[700] }}
              >
                Failed to load purchased modules
              </div>
              <div className="text-sm mb-4" style={{ color: designTokens.colors.error[600] }}>
                {purchasedProductsError?.message || "An unexpected error occurred."}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <ModernButton onClick={() => refetchPurchasedProducts()} variant="outline">
                  Retry
                </ModernButton>
                <ModernButton onClick={handleAddModule}>Add Module</ModernButton>
              </div>
            </div>
          </ModernCard>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminActiveTab />
      <main
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Purchased Modules
              </h1>
              <p className="mt-1 text-sm" style={{ color: designTokens.colors.neutral[600] }}>
                Manage your purchased modules and licensing
              </p>
            </div>
            <ModernButton onClick={handleAddModule} className="flex items-center gap-2">
              <Plus size={18} />
              Add Module
            </ModernButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Modules"
              value={moduleStats.totalModules}
              icon={<Package size={24} />}
              color="primary"
              description="All purchased modules"
            />
            <ModernStatsCard
              title="Total Value"
              value={`$${moduleStats.totalValue.toFixed(2)}`}
              icon={<DollarSign size={24} />}
              color="success"
              description="Combined module cost"
            />
            <ModernStatsCard
              title="Recent Purchases"
              value={moduleStats.recentPurchases}
              icon={<ShoppingCart size={24} />}
              color="info"
              description="Last 30 days"
            />
            <ModernStatsCard
              title="Module Types"
              value={moduleStats.uniqueModuleTypes}
              icon={<Package size={24} />}
              color="warning"
              description="Different categories"
            />
          </div>

          {/* Modules Table */}
          <ModernCard>
            <ModernTable
              title={`Purchased Modules (${moduleStats.totalModules} total)`}
              data={purchasedProducts || []}
              columns={columns}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
              sortable={true}
              loading={ispurchasedProductsFetching}
              emptyMessage="No purchased modules found. Purchase your first module to get started."
            />
          </ModernCard>
        </div>
      </main>
    </>
  );
}
