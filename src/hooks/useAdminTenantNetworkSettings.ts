// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentAdminApi from "../index/admin/silent";
import adminApi from "../index/admin/api";

export interface TenantNetworkSettingsResponse {
  tenant_id: string;
  tenant_name?: string;
  network_settings: {
    force_eip_for_public_preset?: boolean;
    allow_preset_upgrade_for_eip?: boolean;
    require_eip_preflight?: boolean;
    strict_eip_preflight?: boolean;
    [key: string]: any;
  };
}

const fetchTenantNetworkSettings = async (tenantId: string) => {
  const res = await silentAdminApi("GET", `/tenants/${tenantId}/network`);
  if (!res.data) throw new Error("Failed to fetch tenant network settings");
  return res.data as TenantNetworkSettingsResponse;
};

const updateTenantNetworkSettings = async ({
  tenantId,
  data,
}: {
  tenantId: string;
  data: Record<string, any>;
}) => {
  const res = await adminApi("PUT", `/tenants/${tenantId}/network`, {
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
      console.error("Error updating tenant network settings:", error);
    },
  });
};
