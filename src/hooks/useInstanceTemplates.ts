import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import adminSilentApi from "../index/admin/silent";
import tenantSilentApi from "../index/tenant/silentTenant";
import clientSilentApi from "../index/client/silent";
import ToastUtils from "../utils/toastUtil";
import { useApiContext } from "./useApiContext";

// Type definitions
export interface InstanceTemplate {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  configuration: Record<string, any>;
  pricing_cache?: {
    monthly_total_usd?: number;
    yearly_total_usd?: number;
    currency?: string;
    breakdown?: Record<string, any>;
  };
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  configuration: Record<string, any>;
  is_public?: boolean;
  category?: string;
}

export interface UpdateTemplatePayload {
  id: string;
  payload: {
    name?: string;
    description?: string;
    configuration?: Record<string, any>;
    is_public?: boolean;
    category?: string;
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
      const response = await api("GET", "/instance-templates");
      // API utility returns the JSON body directly
      const items = response.data || response || [];
      return items as InstanceTemplate[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. CREATE Template
  const createMutation = useMutation({
    mutationFn: async (payload: CreateTemplatePayload) => {
      const response = await api("POST", "/instance-templates", payload);
      return response.data || response;
    },
    onSuccess: () => {
      ToastUtils.success("Template created successfully!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to create template.";
      ToastUtils.error(msg);
    },
  });

  // 3. DELETE Template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api("DELETE", `/instance-templates/${id}`);
      return id;
    },
    onSuccess: (id) => {
      ToastUtils.success("Template deleted.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      ToastUtils.error("Failed to delete template.");
    },
  });

  // 4. UPDATE Template
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: UpdateTemplatePayload) => {
      const response = await api("PUT", `/instance-templates/${id}`, payload);
      return response.data || response;
    },
    onSuccess: () => {
      ToastUtils.success("Template updated successfully!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update template.";
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
