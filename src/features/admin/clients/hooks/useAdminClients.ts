/**
 * Admin Clients Hooks
 * React Query hooks for admin-level client operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminClientApi } from "../api/clientApi";
import { queryKeys } from "@/shared/api/queryClient";
import type { ClientFormData, ClientUpdateData } from "@/shared/domains/clients/types/client.types";

export const useAdminClients = () => {
  return useQuery({
    queryKey: queryKeys.admin.clients.all(),
    queryFn: () => adminClientApi.fetchAll(),
  });
};

export const useAdminClient = (clientId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.admin.clients.detail(clientId),
    queryFn: () => adminClientApi.fetchById(clientId),
    enabled: options?.enabled ?? Boolean(clientId),
  });
};

export const useCreateAdminClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientFormData) => adminClientApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
    },
  });
};

export const useUpdateAdminClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: number; data: ClientUpdateData }) =>
      adminClientApi.update(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.clients.detail(variables.clientId),
      });
    },
  });
};

export const useDeleteAdminClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number) => adminClientApi.delete(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
    },
  });
};

export const useSuspendClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, reason }: { clientId: number; reason?: string }) =>
      adminClientApi.suspend(clientId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.clients.detail(variables.clientId),
      });
    },
  });
};

export const useActivateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number) => adminClientApi.activate(clientId),
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.detail(clientId) });
    },
  });
};

export const useBulkSuspendClients = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientIds, reason }: { clientIds: number[]; reason?: string }) =>
      adminClientApi.bulkSuspend(clientIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
    },
  });
};

export const useBulkDeleteClients = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientIds: number[]) => adminClientApi.bulkDelete(clientIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients.all() });
    },
  });
};
