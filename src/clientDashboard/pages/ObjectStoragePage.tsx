// @ts-nocheck
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import ObjectStorageDashboardContent from "../../shared/components/object-storage/ObjectStorageDashboardContent";
import { objectStoragePresets } from "../../shared/config/objectStoragePresets";
import useClientAuthStore from "../../stores/clientAuthStore";

const ClientObjectStoragePage: React.FC = () => {
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
    accountBuckets: accountSilos,
    bucketLoading: siloLoading,
    bucketErrors: siloErrors,
    loadBuckets: loadSilos,
  } = useObjectStorage();

  const sortedAccounts = useMemo(
    () =>
      [...(accounts as any[])].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [accounts]
  );

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Silo Storage"
        description="Purchase Zadara-backed storage, review Silo usage, and refresh provisioning status."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Silo Storage" }]}
      >
        <ObjectStorageDashboardContent
          preset={objectStoragePresets.client}
          planActions={{
            onBack: () => navigate(-1),
            onStandardPlan: () => navigate("/client-dashboard/object-storage/create"),
            hasTenantContext: Boolean(clientTenant),
            loading: accountsLoading,
          }}
          table={{
            accounts: sortedAccounts as any,
            loading: accountsLoading,
            error: accountsError,
            onRetry: refreshAccounts,
            onRefresh: refreshAccounts,
            onRowClick: (account: any) =>
              navigate(`/client-dashboard/object-storage/${account.id}`),
            silosByAccount: accountSilos,
            siloLoading,
            siloErrors,
            onLoadSilos: loadSilos,
            onCreateSilo: () => {},
            onDeleteSilo: () => {},
            paginationMeta: accountsMeta,
            paginationState: accountQuery,
            onPageChange: changeAccountsPage,
            onPerPageChange: changeAccountsPerPage,
          }}
        />
      </ClientPageShell>
    </>
  );
};

export default ClientObjectStoragePage;
