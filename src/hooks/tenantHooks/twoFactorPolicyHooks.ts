import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/tenant/silentTenant";
import api from "../../index/tenant/tenantApi";
import ToastUtils from "@/utils/toastUtil";

/**
 * Tenant 2FA Policy hooks — wrap the
 * `tenant/v1/security/2fa/policy` and `.../exemptions/{user}`
 * endpoints introduced for the per-tenant 2FA enforcement UI.
 *
 * Mirrors the admin variant in shape but operates on per-tenant
 * settings (stored in TenantSetting rather than SystemSetting) and
 * scopes user lookups to the actor's tenant.
 */

type CohortStats = {
  total: number;
  enrolled: number;
  exempt: number;
  unenrolled: number;
};

export type TenantTwoFactorPolicy = {
  force_2fa: boolean;
  force_client_2fa: boolean;
  stats: {
    total_users: number;
    enrolled_users: number;
    exempt_users: number;
    unenrolled_non_exempt_users: number;
    staff?: CohortStats;
    clients?: CohortStats;
  };
};

export type TenantExemptUser = {
  id: number;
  identifier: string;
  name: string;
  email: string;
  role: string;
  updated_at: string;
};

export const useFetchTenantTwoFactorPolicy = () => {
  return useQuery({
    queryKey: ["tenantTwoFactorPolicy"],
    queryFn: async () => {
      const res = (await silentApi("GET", "/security/2fa/policy")) as {
        data: TenantTwoFactorPolicy;
      };
      return res.data;
    },
    staleTime: 30_000,
  });
};

export type TenantPolicyUpdate = Partial<{
  force_2fa: boolean;
  force_client_2fa: boolean;
}>;

export const useUpdateTenantTwoFactorPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TenantPolicyUpdate | boolean) => {
      // Backward-compat: bare boolean → force_2fa toggle
      const body = typeof payload === "boolean" ? { force_2fa: payload } : payload;
      return await api("PUT", "/security/2fa/policy", body as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantTwoFactorPolicy"] });
      ToastUtils.success("Tenant 2FA policy updated.");
    },
    onError: (err: { message?: string } | undefined) => {
      ToastUtils.error(err?.message || "Failed to update tenant policy.");
    },
  });
};

export const useFetchTenantTwoFactorExemptions = () => {
  return useQuery({
    queryKey: ["tenantTwoFactorExemptions"],
    queryFn: async () => {
      const res = (await silentApi("GET", "/security/2fa/exemptions")) as {
        data: TenantExemptUser[];
      };
      return res.data;
    },
    staleTime: 30_000,
  });
};

export const useToggleTenantTwoFactorExemption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      exempt_from_2fa,
      reason,
    }: {
      userId: number | string;
      exempt_from_2fa: boolean;
      reason?: string;
    }) => {
      return await api("PUT", `/security/2fa/exemptions/${userId}`, {
        exempt_from_2fa,
        reason: reason ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantTwoFactorPolicy"] });
      queryClient.invalidateQueries({ queryKey: ["tenantTwoFactorExemptions"] });
      ToastUtils.success("Exemption updated.");
    },
    onError: (err: { message?: string } | undefined) => {
      ToastUtils.error(err?.message || "Failed to update exemption.");
    },
  });
};
