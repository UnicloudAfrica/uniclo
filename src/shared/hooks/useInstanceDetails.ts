import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi, { adminSilentApi } from "../../index/admin/api";
import tenantApi from "../../index/tenant/tenantApi";
import tenantSilentApi from "../../index/tenant/silentTenant";
import { useLocation } from "react-router-dom";

export type InstanceHierarchy = "admin" | "tenant" | "client";

export const useInstanceHierarchy = (): InstanceHierarchy => {
  const location = useLocation();
  if (location.pathname.startsWith("/admin-dashboard")) return "admin";
  if (location.pathname.startsWith("/client-dashboard")) return "client";
  return "tenant";
};

export const useInstanceDetails = (identifier: string) => {
  const hierarchy = useInstanceHierarchy();

  const queryClient = useQueryClient();

  // Fetch Logic
  const fetchDetails = async () => {
    const uri =
      hierarchy === "admin"
        ? `/cube-instance/${identifier}`
        : `/admin/cube-instance/${identifier}`;

    const api = hierarchy === "admin" ? adminSilentApi : tenantSilentApi;
    const res = await api("GET", uri);
    return res?.data || res;
  };

  const detailsQuery = useQuery({
    queryKey: ["instance-details", identifier, hierarchy],
    queryFn: fetchDetails,
    enabled: !!identifier,
    staleTime: 30000,
  });

  // Action Logic
  const executeAction = async ({
    action,
    params = {},
  }: {
    action: string;
    params?: Record<string, unknown>;
  }) => {
    const uri =
      hierarchy === "admin"
        ? `/cube-instance/${identifier}/actions`
        : `/admin/cube-instance/${identifier}/actions`;

    const apiCall = hierarchy === "admin" ? adminApi : tenantApi;
    const res = await apiCall("POST", uri, { action, params });
    return res;
  };

  const actionMutation = useMutation({
    mutationFn: executeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance-details", identifier] });
    },
  });

  // Refresh Status
  const refreshStatus = async () => {
    const uri =
      hierarchy === "admin"
        ? `/cube-instance/${identifier}/refresh-status`
        : `/admin/cube-instance/${identifier}/refresh-status`;

    const apiCall = hierarchy === "admin" ? adminApi : tenantApi;
    return await apiCall("POST", uri);
  };

  const refreshMutation = useMutation({
    mutationFn: refreshStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance-details", identifier] });
    },
  });

  return {
    details: detailsQuery.data,
    isLoading: detailsQuery.isLoading,
    isError: detailsQuery.isError,
    error: detailsQuery.error,
    refetch: detailsQuery.refetch,
    executeAction: actionMutation.mutateAsync,
    isActionPending: actionMutation.isPending,
    refreshStatus: refreshMutation.mutateAsync,
    isRefreshing: refreshMutation.isPending,
    hierarchy,
  };
};
