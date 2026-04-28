import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentAdminApi from "../index/admin/silent";
import adminApi from "../index/admin/api";
import logger from "../utils/logger";

export interface TenantNetworkSettingsResponse {
  tenant_id: string;
  tenant_name?: string;
  network_settings: {
    force_eip_for_public_preset?: boolean;
    allow_preset_upgrade_for_eip?: boolean;
    require_eip_preflight?: boolean;
    strict_eip_preflight?: boolean;
    [key: string]: unknown;
  };
}

const fetchTenantNetworkSettings = async (
  tenantId: string
): Promise<TenantNetworkSettingsResponse> => {
  const res = await silentAdminApi<{ data?: TenantNetworkSettingsResponse }>(
    "GET",
    `/tenants/${tenantId}/network`
  );
  if (!res.data) throw new Error("Failed to fetch tenant network settings");
  return res.data;
};

const updateTenantNetworkSettings = async ({
  tenantId,
  data,
}: {
  tenantId: string;
  data: Record<string, unknown>;
}): Promise<unknown> => {
  const res = await adminApi<{ data?: unknown }>("PUT", `/tenants/${tenantId}/network`, {
    network_settings: data,
  });
  if (!res.data) throw new Error("Failed to update tenant network settings");
  return res.data;
};

export const useAdminTenantNetworkSettings = (tenantId: string, options = {}) => {
  return useQuery({
    queryKey: ["admin-tenant-network", tenantId],
    queryFn: () => fetchTenantNetworkSettings(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateAdminTenantNetworkSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantNetworkSettings,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-network", variables.tenantId] });
    },
    onError: (error) => {
      logger.error("Error updating tenant network settings:", error);
    },
  });
};
