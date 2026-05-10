import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import ObjectStorageDashboardContent from "@/shared/components/object-storage/ObjectStorageDashboardContent";
import { objectStoragePresets } from "@/shared/config/objectStoragePresets";
import useAuthStore from "@/stores/authStore";

interface StorageAccount {
  id: string | number;
  created_at: string;
  [key: string]: unknown;
}

const ClientObjectStoragePage: React.FC = () => {
  const navigate = useNavigate();
  const clientTenant = useAuthStore((state) => state?.tenant);
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
      [...(accounts as StorageAccount[])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [accounts]
  );

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Silo Storage"
        description="Purchase cloud-backed storage, review Silo usage, and refresh provisioning status."
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
            accounts: sortedAccounts as StorageAccount[],
            loading: accountsLoading,
            error: accountsError,
            onRetry: refreshAccounts,
            onRefresh: refreshAccounts,
            onRowClick: (account: StorageAccount) =>
              navigate(`/client-dashboard/object-storage/${account.id}`),
            silosByAccount: accountSilos,
            siloLoading,
            siloErrors,
            onLoadSilos: (id: string | number) => loadSilos(id),
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
