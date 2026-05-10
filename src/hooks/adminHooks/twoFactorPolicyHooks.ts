import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import ToastUtils from "@/utils/toastUtil";

/**
 * Admin 2FA Policy hooks — wrap the
 * `admin/v1/security/2fa/policy` and `.../exemptions/{user}`
 * endpoints introduced for the platform-wide 2FA enforcement UI.
 */

export type AdminTwoFactorPolicy = {
  force_admin_2fa: boolean;
  force_tenantless_client_2fa: boolean;
  stats: {
    total_admins: number;
    enrolled_admins: number;
    exempt_admins: number;
    unenrolled_non_exempt_admins: number;
    tenantless_clients?: {
      total: number;
      enrolled: number;
      exempt: number;
      unenrolled: number;
    };
  };
};

export type ExemptUser = {
  id: number;
  identifier: string;
  name: string;
  email: string;
  role: string;
  is_super_admin?: boolean;
  updated_at: string;
};

export const useFetchAdminTwoFactorPolicy = () => {
  return useQuery({
    queryKey: ["adminTwoFactorPolicy"],
    queryFn: async () => {
      const res = (await silentApi("GET", "/security/2fa/policy")) as {
        data: AdminTwoFactorPolicy;
      };
      return res.data;
    },
    staleTime: 30_000,
  });
};

export type AdminPolicyUpdate = Partial<{
  force_admin_2fa: boolean;
  force_tenantless_client_2fa: boolean;
}>;

export const useUpdateAdminTwoFactorPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AdminPolicyUpdate | boolean) => {
      // Backward-compat: accept a bare boolean (old signature) as
      // force_admin_2fa toggle.
      const body =
        typeof payload === "boolean" ? { force_admin_2fa: payload } : payload;
      return await api("PUT", "/security/2fa/policy", body as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTwoFactorPolicy"] });
      ToastUtils.success("Policy updated.");
    },
    onError: (err: { message?: string } | undefined) => {
      ToastUtils.error(err?.message || "Failed to update policy.");
    },
  });
};

export const useFetchAdminTwoFactorExemptions = () => {
  return useQuery({
    queryKey: ["adminTwoFactorExemptions"],
    queryFn: async () => {
      const res = (await silentApi("GET", "/security/2fa/exemptions")) as {
        data: ExemptUser[];
      };
      return res.data;
    },
    staleTime: 30_000,
  });
};

export const useToggleAdminTwoFactorExemption = () => {
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
      queryClient.invalidateQueries({ queryKey: ["adminTwoFactorPolicy"] });
      queryClient.invalidateQueries({ queryKey: ["adminTwoFactorExemptions"] });
      ToastUtils.success("Exemption updated.");
    },
    onError: (err: { message?: string } | undefined) => {
      ToastUtils.error(err?.message || "Failed to update exemption.");
    },
  });
};
