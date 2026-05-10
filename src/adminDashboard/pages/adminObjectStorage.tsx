import { useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import useAuthStore from "@/stores/authStore";
import ObjectStorageDashboardContent from "@/shared/components/object-storage/ObjectStorageDashboardContent";
import type {
  Account as ObjectStorageAccount,
  Silo as ObjectStorageSilo,
} from "@/shared/components/object-storage/ObjectStorageTable";
import { objectStoragePresets } from "@/shared/config/objectStoragePresets";

const parseCreatedAt = (value: unknown): number => {
  if (typeof value !== "string") return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const AdminObjectStorage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminTenant = useAuthStore((state) => state?.tenant);
  const currentTenant = useAuthStore((state) => state?.currentTenant);
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

  const sortedAccounts = useMemo<ObjectStorageAccount[]>(
    () =>
      [...accounts]
        .filter((account) => typeof account?.id === "string" || typeof account?.id === "number")
        .map((account) => {
          const id = String(account.id);
          const name = typeof account["name"] === "string" ? account["name"] : "Unnamed account";
          const status = typeof account["status"] === "string" ? account["status"] : "pending";
          const createdAt = typeof account["created_at"] === "string" ? account["created_at"] : "";

          return {
            ...account,
            id,
            name,
            status,
            created_at: createdAt,
          };
        })
        .sort((a, b) => parseCreatedAt(b.created_at) - parseCreatedAt(a.created_at)),
    [accounts]
  );

  // Refresh accounts when navigating back from delete
  useEffect(() => {
    if (location.state?.refresh) {
      refreshAccounts();
      // Clear the state to prevent refresh on subsequent renders
      globalThis.window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshAccounts]);

  const handleCreateSilo = (accountId: string, payload: { name: string }) =>
    createSilo(accountId, payload);

  const handleDeleteSilo = (accountId: string, silo: ObjectStorageSilo) =>
    deleteSilo(accountId, silo.id as unknown);
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
            onRowClick: (account: ObjectStorageAccount) =>
              navigate(`/admin-dashboard/object-storage/${account.id}`),
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
