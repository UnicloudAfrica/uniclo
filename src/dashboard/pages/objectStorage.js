import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  HardDrive,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import ObjectStorageTable from "../../shared/components/objectStorage/ObjectStorageTable";
import ObjectStoragePlanActions from "../../shared/components/objectStorage/ObjectStoragePlanActions";
import useTenantAuthStore from "../../stores/tenantAuthStore";

const ObjectStoragePage = () => {
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
  } = useObjectStorage();
  const tenantContext = useTenantAuthStore((state) => state?.tenant);
  const navigate = useNavigate();

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    [accounts]
  );

  const summary = useMemo(() => {
    const totals = {
      total: accounts.length,
      active: 0,
      provisioning: 0,
      failed: 0,
    };
    accounts.forEach((account) => {
      const normalized = (account.status || "").toLowerCase();
      if (normalized.includes("active")) totals.active += 1;
      else if (normalized.includes("provision")) totals.provisioning += 1;
      else if (normalized.includes("fail")) totals.failed += 1;
    });
    return totals;
  }, [accounts]);

  const emptyStateConfig = {
    title: "No storage accounts yet",
    description:
      "Purchase a plan to provision S3-compatible capacity for this tenant.",
    actions: [
      {
        label: "Purchase storage",
        onClick: () => navigate("/dashboard/object-storage/purchase"),
      },
      {
        label: "Refresh status",
        onClick: refreshAccounts,
        variant: "secondary",
        disabled: accountsLoading,
      },
    ],
  };

  const heroCards = [
    {
      key: "accounts",
      label: "Accounts",
      value: summary.total,
      description: "Provisioned for your tenant",
      icon: HardDrive,
    },
    {
      key: "active",
      label: "Active",
      value: summary.active,
      description: "Ready for requests",
      icon: CheckCircle,
    },
    {
      key: "provisioning",
      label: "Provisioning",
      value: summary.provisioning,
      description: "In progress",
      icon: Activity,
    },
    {
      key: "failed",
      label: "Failed",
      value: summary.failed,
      description: "Needs attention",
      icon: AlertTriangle,
    },
  ];

  return (
    <TenantPageShell
      title="Object Storage"
      description="Track the Zadara object storage accounts provisioned for your tenant."
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#050F2C] via-[#0F3B68] to-[#1E80F9] text-white shadow-2xl">
          <div className="absolute inset-0 opacity-60">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" />
          </div>
          <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Tenant Storage
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Provision and monitor your object storage footprint
                </h2>
                <p className="text-sm text-white/80 sm:text-base">
                  Keep an eye on account health, refresh provisioning status,
                  and purchase additional capacity when workloads spike.
                </p>
              </div>
              <ObjectStoragePlanActions
                persona="tenant"
                hasTenantContext={Boolean(tenantContext)}
                canFastTrack={false}
                enableFastTrack={false}
                standardLabel="Provision storage"
                onBack={() => navigate(-1)}
                onStandardPlan={() =>
                  navigate("/dashboard/object-storage/create")
                }
                loading={accountsLoading}
              />
            </div>
            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {heroCards.map(
                ({ key, label, value, description, icon: Icon }) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
                      <span>{label}</span>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {value}
                    </p>
                    <p className="text-xs text-white/70">{description}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <ObjectStorageTable
          accounts={sortedAccounts}
          loading={accountsLoading}
          error={accountsError}
          onRetry={refreshAccounts}
          onRefresh={refreshAccounts}
          bucketsByAccount={accountBuckets}
          bucketLoading={bucketLoading}
          bucketErrors={bucketErrors}
          onLoadBuckets={loadBuckets}
          emptyState={emptyStateConfig}
          paginationMeta={accountsMeta}
          paginationState={accountQuery}
          onPageChange={changeAccountsPage}
          onPerPageChange={changeAccountsPerPage}
        />
      </div>
    </TenantPageShell>
  );
};

export default ObjectStoragePage;
