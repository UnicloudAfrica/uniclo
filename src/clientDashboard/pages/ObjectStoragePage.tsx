// @ts-nocheck
import React, { useMemo, useState } from "react";
import { CheckCircle, HardDrive, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientPageShell from "../components/ClientPageShell";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import ObjectStorageTable from "../../shared/components/objectStorage/ObjectStorageTable";
import ObjectStoragePlanActions from "../../shared/components/objectStorage/ObjectStoragePlanActions";
import useClientAuthStore from "../../stores/clientAuthStore";

interface HeroCard {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ClientObjectStoragePage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const clientTenant = useClientAuthStore((state) => state?.tenant);
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

  const sortedAccounts = useMemo(
    () =>
      [...(accounts as any[])].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [accounts]
  );

  const summary = useMemo(() => {
    const metrics = { total: (accounts as any[]).length, active: 0 };
    (accounts as any[]).forEach((account: any) => {
      if ((account.status || "").toLowerCase().includes("active")) {
        metrics.active += 1;
      }
    });
    return metrics;
  }, [accounts]);

  const heroCards: HeroCard[] = [
    {
      key: "accounts",
      label: "Accounts",
      value: summary.total,
      description: "Provisioned across UniCloud",
      icon: HardDrive,
    },
    {
      key: "active",
      label: "Active",
      value: summary.active,
      description: "Ready for uploads",
      icon: CheckCircle,
    },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const emptyStateConfig = {
    title: "No storage accounts yet",
    description: "Kick off a plan purchase to provision your first Zadara object storage account.",
    actions: [
      {
        label: "Purchase storage",
        onClick: () => navigate("/client-dashboard/object-storage/purchase"),
      },
      {
        label: "Refresh status",
        onClick: refreshAccounts,
        variant: "secondary" as const,
        disabled: accountsLoading,
      },
    ],
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <ClientPageShell
        title="Object Storage"
        description="Purchase Zadara-backed storage, review bucket usage, and refresh provisioning status."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Object Storage" }]}
      >
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#050F2C] via-[#0B3264] to-[#1A6DD8] text-white shadow-2xl">
            <div className="absolute inset-0 opacity-60">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" />
            </div>
            <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
              <div className="max-w-xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  Client Storage
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Purchase, track, and scale your S3 capacity
                  </h2>
                  <p className="text-sm text-white/80 sm:text-base">
                    Keep Zadara orders aligned with tenant demand and jump into account details
                    without leaving the console.
                  </p>
                </div>
                <ObjectStoragePlanActions
                  persona="client"
                  hasTenantContext={Boolean(clientTenant)}
                  enableFastTrack={false}
                  standardLabel="Provision storage"
                  onBack={() => navigate(-1)}
                  onStandardPlan={() => navigate("/client-dashboard/object-storage/create")}
                  onFastTrack={() => {}}
                  loading={accountsLoading}
                />
              </div>
              <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
                {heroCards.map(({ key, label, value, description, icon: Icon }) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
                      <span>{label}</span>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                    <p className="text-xs text-white/70">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ObjectStorageTable
            accounts={sortedAccounts as any}
            loading={accountsLoading}
            error={accountsError}
            onRetry={refreshAccounts}
            onRefresh={refreshAccounts}
            bucketsByAccount={accountBuckets}
            bucketLoading={bucketLoading}
            bucketErrors={bucketErrors}
            onLoadBuckets={loadBuckets}
            onCreateBucket={() => {}}
            onDeleteBucket={() => {}}
            emptyState={emptyStateConfig}
            paginationMeta={accountsMeta}
            paginationState={accountQuery}
            onPageChange={changeAccountsPage}
            onPerPageChange={changeAccountsPerPage}
          />
        </div>
      </ClientPageShell>
    </>
  );
};

export default ClientObjectStoragePage;
