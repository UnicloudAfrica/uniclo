import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import ObjectStorageDashboardContent from "../../shared/components/object-storage/ObjectStorageDashboardContent";
import { objectStoragePresets } from "../../shared/config/objectStoragePresets";

const ObjectStorage = () => {
  const navigate = useNavigate();
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
      [...(accounts || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [accounts]
  );

  return (
    <TenantPageShell title="Silo Storage" description="Silo Storage management page">
      <ObjectStorageDashboardContent
        preset={objectStoragePresets.tenant}
        planActions={{
          onBack: () => navigate(-1),
          onStandardPlan: () => navigate("/dashboard/object-storage/create"),
          loading: accountsLoading,
        }}
        table={{
          accounts: sortedAccounts,
          loading: accountsLoading,
          error: accountsError,
          onRetry: refreshAccounts,
          onRefresh: refreshAccounts,
          onRowClick: (account) => navigate(`/dashboard/object-storage/${account.id}`),
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
    </TenantPageShell>
  );
};

export default ObjectStorage;
