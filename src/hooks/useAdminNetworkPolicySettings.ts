import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentAdminApi from "../index/admin/silent";
import adminApi from "../index/admin/api";
import logger from "../utils/logger";
import type { ApiEnvelope } from "@/shared/types/admin";
import type { QueryHookOptions } from "@/shared/types/hooks";

export interface NetworkPolicySettings {
  force_eip_for_public_preset?: boolean;
  allow_preset_upgrade_for_eip?: boolean;
  require_eip_preflight?: boolean;
  strict_eip_preflight?: boolean;
}

const fetchNetworkPolicy = async () => {
  const res = await silentAdminApi<ApiEnvelope<NetworkPolicySettings>>("GET", "/settings/admin/network-policy");
  if (!res.data) throw new Error("Failed to fetch network policy");
  return res.data;
};

const updateNetworkPolicy = async (network_policy: NetworkPolicySettings) => {
  const res = await adminApi<ApiEnvelope<NetworkPolicySettings>>("PUT", "/settings/admin/network-policy", { network_policy } as unknown as Record<string, unknown>);
  if (!res.data) throw new Error("Failed to update network policy");
  return res.data;
};

export const useAdminNetworkPolicySettings = (options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: ["admin-network-policy"],
    queryFn: fetchNetworkPolicy,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateAdminNetworkPolicySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNetworkPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-network-policy"] });
    },
    onError: (error) => {
      logger.error("Error updating network policy:", error);
    },
  });
};
