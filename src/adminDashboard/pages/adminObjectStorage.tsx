// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Plus,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import useAdminAuthStore from "../../stores/adminAuthStore";
import ObjectStorageTable from "../../shared/components/objectStorage/ObjectStorageTable";
import ObjectStoragePlanActions from "../../shared/components/objectStorage/ObjectStoragePlanActions";

const AdminObjectStorage = () => {
  const navigate = useNavigate();
  const adminTenant = useAdminAuthStore((state) => state?.tenant);
  const currentTenant = useAdminAuthStore((state) => state?.currentTenant);
  const {
    accounts,
    accountsLoading,
    accountsError,
    accountsMeta,
    accountQuery,
    refreshAccounts,
    changeAccountsPage,
    changeAccountsPerPage,
    accountBuckets,
    bucketLoading,
    bucketErrors,
    loadBuckets,
    createBucket,
    deleteBucket,
  } = useObjectStorage();

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [accounts]
  );

  const statusCounts = useMemo(() => {
    const base = {
      total: accounts.length,
      active: 0,
      provisioning: 0,
      failed: 0,
    };
    accounts.forEach((account: any) => {
      const status = (account.status || "").toLowerCase();
      if (status.includes("active")) base.active += 1;
      else if (status.includes("provision")) base.provisioning += 1;
      else if (status.includes("fail")) base.failed += 1;
    });
    return base;
  }, [accounts]);

  const handleCreateBucket = (accountId: any, name: any) =>
    createBucket(accountId, {
      name,
    });

  const handleDeleteBucket = (accountId: any, bucket: any) => deleteBucket(accountId, bucket.id);

  const emptyStateConfig = {
    title: "No storage accounts yet",
    description:
      "Create a plan or fast-track a tenant to provision their first Zadara object storage account.",
    actions: [
      {
        label: "Process Storage Payment",
        onClick: () => navigate("/admin-dashboard/object-storage/create"),
        variant: "primary",
      },
      {
        label: "Fast-track tenant",
        onClick: () => navigate("/admin-dashboard/object-storage/create?mode=fast-track"),
        variant: "secondary",
      },
    ],
  };
  const heroCards = [
    {
      key: "accounts",
      label: "Accounts",
      value: statusCounts.total,
      description: "Provisioned records",
      icon: HardDrive,
    },
    {
      key: "active",
      label: "Active",
      value: statusCounts.active,
      description: "Ready for requests",
      icon: CheckCircle,
    },
    {
      key: "provisioning",
      label: "Provisioning",
      value: statusCounts.provisioning,
      description: "In-flight builds",
      icon: Activity,
    },
    {
      key: "failed",
      label: "Failed",
      value: statusCounts.failed,
      description: "Action needed",
      icon: AlertTriangle,
    },
  ];

  const renderHeroCard = (card: any) => {
    const Icon = card.icon;
    return (
      <div
        key={card.key}
        className="rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur"
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
          <span>{card.label}</span>
          <Icon className="h-4 w-4" />
        </div>
        <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
        <p className="text-xs text-white/70">{card.description}</p>
      </div>
    );
  };
  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <main className="admin-dashboard-content">
        <div className="py-6 px-4 md:px-8">
          <AdminPageShell
            title="Object storage"
            description="Track tenant storage plans, approve fast-track requests, and oversee payment status."
            contentClassName="space-y-6"
          >
            <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#050F2C] via-[#0F3B68] to-[#1E80F9] text-white shadow-2xl">
              <div className="absolute inset-0 opacity-60">
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" />
              </div>
              <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
                <div className="max-w-xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                    Storage Ops
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      Approve, fast-track, and monitor tenant capacity
                    </h2>
                    <p className="text-sm text-white/80 sm:text-base">
                      Keep Zadara accounts in sync, trigger payments, and react to provisioning
                      issues before they impact customers.
                    </p>
                  </div>
                  <ObjectStoragePlanActions
                    persona="admin"
                    hasTenantContext={Boolean(adminTenant || currentTenant)}
                    enableFastTrack
                    standardLabel="Process Storage Payment"
                    fastTrackLabel="Fast-track Provisioning"
                    onBack={() => navigate(-1)}
                    onStandardPlan={() => navigate("/admin-dashboard/object-storage/create")}
                    onFastTrack={() =>
                      navigate("/admin-dashboard/object-storage/create?mode=fast-track")
                    }
                    loading={accountsLoading}
                  />
                </div>
                <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
                  {heroCards.map(renderHeroCard)}
                </div>
              </div>
            </section>

            <ObjectStorageTable
              accounts={sortedAccounts}
              loading={accountsLoading}
              error={accountsError}
              onRetry={refreshAccounts}
              onRefresh={refreshAccounts}
              onRowClick={(account: any) =>
                navigate(`/admin-dashboard/object-storage/${account.id}`)
              }
              bucketsByAccount={accountBuckets}
              bucketLoading={bucketLoading}
              bucketErrors={bucketErrors}
              onLoadBuckets={loadBuckets}
              onCreateBucket={handleCreateBucket}
              onDeleteBucket={handleDeleteBucket}
              enableBucketActions
              emptyState={emptyStateConfig}
              paginationMeta={accountsMeta}
              paginationState={accountQuery}
              onPageChange={changeAccountsPage}
              onPerPageChange={changeAccountsPerPage}
            />
          </AdminPageShell>
        </div>
      </main>
    </>
  );
};
export default AdminObjectStorage;
