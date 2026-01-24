// @ts-nocheck
import React, { useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import useAdminAuthStore from "../../stores/adminAuthStore";
import ObjectStorageDashboardContent from "../../shared/components/object-storage/ObjectStorageDashboardContent";
import { objectStoragePresets } from "../../shared/config/objectStoragePresets";

const AdminObjectStorage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    accountBuckets: accountSilos,
    bucketLoading: siloLoading,
    bucketErrors: siloErrors,
    loadBuckets: loadSilos,
    createBucket: createSilo,
    deleteBucket: deleteSilo,
  } = useObjectStorage();

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [accounts]
  );

  // Refresh accounts when navigating back from delete
  useEffect(() => {
    if (location.state?.refresh) {
      refreshAccounts();
      // Clear the state to prevent refresh on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshAccounts]);

  const handleCreateSilo = (accountId: any, name: any) =>
    createSilo(accountId, {
      name,
    });

  const handleDeleteSilo = (accountId: any, silo: any) => deleteSilo(accountId, silo.id);
  return (
    <>
      <AdminPageShell
        title="Silo Storage"
        description="Track tenant Silo Storage plans, approve fast-track requests, and oversee payment status."
        contentClassName="space-y-6"
      >
        <ObjectStorageDashboardContent
          preset={objectStoragePresets.admin}
          planActions={{
            onBack: () => navigate(-1),
            onStandardPlan: () => navigate("/admin-dashboard/object-storage/create"),
            onFastTrack: () => navigate("/admin-dashboard/object-storage/create?mode=fast-track"),
            hasTenantContext: Boolean(adminTenant || currentTenant),
            loading: accountsLoading,
          }}
          table={{
            accounts: sortedAccounts,
            loading: accountsLoading,
            error: accountsError,
            onRetry: refreshAccounts,
            onRefresh: refreshAccounts,
            onRowClick: (account: any) => navigate(`/admin-dashboard/object-storage/${account.id}`),
            silosByAccount: accountSilos,
            siloLoading,
            siloErrors,
            onLoadSilos: loadSilos,
            onCreateSilo: handleCreateSilo,
            onDeleteSilo: handleDeleteSilo,
            paginationMeta: accountsMeta,
            paginationState: accountQuery,
            onPageChange: changeAccountsPage,
            onPerPageChange: changeAccountsPerPage,
          }}
        />
      </AdminPageShell>
    </>
  );
};
export default AdminObjectStorage;
