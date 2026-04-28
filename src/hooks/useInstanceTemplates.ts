import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import adminSilentApi from "../index/admin/silent";
import tenantSilentApi from "../index/tenant/silentTenant";
import clientSilentApi from "../index/client/silent";
import ToastUtils from "../utils/toastUtil";
import { useApiContext } from "./useApiContext";

// Type definitions
export type TemplateComputeConfig = {
  instance_type_id?: string | number;
  id?: string | number;
  instance_id?: string | number;
};

export type TemplateOsImageConfig = {
  os_image_id?: string | number;
  id?: string | number;
  identifier?: string | number;
};

export type TemplateBandwidthConfig = {
  id?: string | number;
};

export type TemplateNetworkingConfig = {
  bandwidth_id?: string | number;
  bandwidth?: TemplateBandwidthConfig;
  bandwidth_count?: number | string;
  floating_ip_count?: number | string;
};

export type TemplateAddOnsConfig = {
  floating_ips?: { count?: number | string };
};

export type TemplateVolumeConfig = {
  id?: string | number;
  volume_type_id?: string | number;
  identifier?: string | number;
  storage_size_gb?: number | string;
  size_gb?: number | string;
  size?: number | string;
};

export type TemplateConfiguration = {
  region?: string | number;
  region_code?: string | number;
  location?: string | number;
  provider?: string | number;
  provider_code?: string | number;
  compute_instance_id?: string | number;
  compute?: TemplateComputeConfig;
  os_image_id?: string | number;
  os_image?: TemplateOsImageConfig;
  bandwidth_id?: string | number;
  bandwidth_count?: number | string;
  floating_ip_count?: number | string;
  networking?: TemplateNetworkingConfig;
  add_ons?: TemplateAddOnsConfig;
  volume_types?: TemplateVolumeConfig[];
  volumes?: TemplateVolumeConfig[];
  volume_type_id?: string | number;
  storage_size_gb?: number | string;
};

type ApiResponse<T = unknown> = {
  data?: T;
  message?: string | { message: string };
  error?: string;
} & Record<string, unknown>;

export interface InstanceTemplate {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  configuration: TemplateConfiguration;
  pricing_cache?: {
    monthly_total_usd?: number;
    yearly_total_usd?: number;
    currency?: string;
    breakdown?: Record<string, unknown>;
  };
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string | undefined;
  configuration: TemplateConfiguration;
  is_public?: boolean | undefined;
  category?: string | undefined;
}

export interface UpdateTemplatePayload {
  id: string;
  payload: {
    name?: string;
    description?: string | undefined;
    configuration?: TemplateConfiguration;
    is_public?: boolean | undefined;
    category?: string | undefined;
  };
}

export const useInstanceTemplates = () => {
  const queryClient = useQueryClient();
  const { context } = useApiContext();

  // Resolve the correct API client (memoized to prevent re-renders)
  const api = useMemo(() => {
    return context === "admin"
      ? adminSilentApi
      : context === "tenant"
        ? tenantSilentApi
        : clientSilentApi;
  }, [context]);

  // Tenant routes are nested under /admin prefix
  const basePath = context === "tenant" ? "/admin/instance-templates" : "/instance-templates";
  const queryKey = ["instance-templates", context];

  // 1. LIST Templates
  const {
    data,
    isPending: isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api<ApiResponse>("GET", basePath);
      // API utility returns the JSON body directly
      const items = response.data || response || [];
      return items as InstanceTemplate[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. CREATE Template
  const createMutation = useMutation({
    mutationFn: async (payload: CreateTemplatePayload) => {
      const response = await api<ApiResponse>(
        "POST",
        basePath,
        payload as unknown as Record<string, unknown>
      );
      return response.data || response;
    },
    onSuccess: () => {
      ToastUtils.success("Template created successfully!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error.response?.data?.message || error.message || "Operation failed.";
      ToastUtils.error(msg);
    },
  });

  // 3. DELETE Template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api<ApiResponse>("DELETE", `${basePath}/${id}`);
      return id;
    },
    onSuccess: () => {
      ToastUtils.success("Template deleted.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      ToastUtils.error("Failed to delete template.");
    },
  });

  // 4. UPDATE Template
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: UpdateTemplatePayload) => {
      const response = await api<ApiResponse>("PUT", `${basePath}/${id}`, payload);
      return response.data || response;
    },
    onSuccess: () => {
      ToastUtils.success("Template updated successfully!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error.response?.data?.message || error.message || "Failed to update template.";
      ToastUtils.error(msg);
    },
  });

  return {
    templates: data || [],
    isLoading,
    isError,
    refetch,
    createTemplate: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTemplate: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTemplate: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
