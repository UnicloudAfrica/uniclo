/**
 * Admin Instances Hooks
 * React Query hooks for admin-level instance operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminInstanceApi } from "../api/instanceApi";
import { queryKeys } from "@/shared/api/queryClient";
import type {
  InstanceFormData,
  MultiInstanceConfig,
} from "@/shared/domains/instances/types/instance.types";

export const useAdminInstances = () => {
  return useQuery({
    queryKey: queryKeys.admin.instances.all(),
    queryFn: () => adminInstanceApi.fetchAll(),
  });
};

export const useAdminInstance = (instanceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.admin.instances.detail(instanceId),
    queryFn: () => adminInstanceApi.fetchById(instanceId),
    enabled: options?.enabled ?? Boolean(instanceId),
  });
};

export const useCreateAdminInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InstanceFormData) => adminInstanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.instances.all() });
    },
  });
};

export const useCreateMultipleInstances = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: MultiInstanceConfig) => adminInstanceApi.createMultiple(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.instances.all() });
    },
  });
};

export const useUpdateAdminInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, data }: { instanceId: string; data: Partial<InstanceFormData> }) =>
      adminInstanceApi.update(instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.instances.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.instances.detail(variables.instanceId),
      });
    },
  });
};

export const useDeleteAdminInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => adminInstanceApi.delete(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.instances.all() });
    },
  });
};

export const useInstanceAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, action }: { instanceId: string; action: string }) =>
      adminInstanceApi.performAction(instanceId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.instances.detail(variables.instanceId),
      });
    },
  });
};

export const useBulkInstanceAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceIds, action }: { instanceIds: string[]; action: string }) =>
      adminInstanceApi.bulkAction(instanceIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.instances.all() });
    },
  });
};

export const useInstanceConsole = (instanceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.admin.instances.detail(instanceId), "console"],
    queryFn: () => adminInstanceApi.getConsoleOutput(instanceId),
    enabled: options?.enabled ?? Boolean(instanceId),
    refetchInterval: 5000, // Refresh every 5s
  });
};

export const useInstanceMetrics = (instanceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.admin.instances.detail(instanceId), "metrics"],
    queryFn: () => adminInstanceApi.getMetrics(instanceId),
    enabled: options?.enabled ?? Boolean(instanceId),
    refetchInterval: 10000, // Refresh every 10s
  });
};
