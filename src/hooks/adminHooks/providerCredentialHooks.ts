import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";
import logger from "@/utils/logger";

type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;

// ================================
// Provider Region Credentials API Functions
// ================================

const fetchProviderRegionCredentials = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/provider-region-credentials");
  if (!res.data) throw new Error("Failed to fetch provider region credentials");
  return res;
};

const createProviderRegionCredential = async (credentialData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/provider-region-credentials", credentialData);
  if (!res.data) throw new Error("Failed to create provider region credential");
  return res.data;
};

const resetProviderRegionCredentialPassword = async (resetData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/provider-region-credentials/reset-password",
    resetData
  );
  if (!res.data) throw new Error("Failed to reset provider region credential password");
  return res.data;
};

const linkProviderRegionCredentialUser = async (linkData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/provider-region-credentials/link-user",
    linkData
  );
  if (!res.data) throw new Error("Failed to link provider region credential user");
  return res.data;
};

const rotateProviderRegionCredentialIfMissing = async (rotateData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/provider-region-credentials/rotate-if-missing",
    rotateData
  );
  if (!res.data) throw new Error("Failed to rotate provider region credential");
  return res.data;
};

const reconcileProviderRegionCredentials = async (reconcileData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/provider-region-credentials/reconcile",
    reconcileData
  );
  if (!res.data) throw new Error("Failed to reconcile provider region credentials");
  return res.data;
};

// ================================
// Provider Region Credentials Hooks
// ================================

export const useFetchProviderRegionCredentials = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["provider-region-credentials"],
    queryFn: fetchProviderRegionCredentials,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateProviderRegionCredential = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProviderRegionCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-region-credentials"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating provider region credential:", error);
    },
  });
};

export const useResetProviderRegionCredentialPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetProviderRegionCredentialPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-region-credentials"] });
    },
    onError: (error: unknown) => {
      logger.error("Error resetting provider region credential password:", error);
    },
  });
};

// Export API functions for direct use
export {
  fetchProviderRegionCredentials,
  createProviderRegionCredential,
  resetProviderRegionCredentialPassword,
  linkProviderRegionCredentialUser,
  rotateProviderRegionCredentialIfMissing,
  reconcileProviderRegionCredentials,
};
