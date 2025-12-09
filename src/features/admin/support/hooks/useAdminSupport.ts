/**
 * Admin Support Hooks
 * React Query hooks for admin-level support/ticket operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSupportApi } from "../api/supportApi";
import { queryKeys } from "@/shared/api/queryClient";
import type {
  TicketFormData,
  TicketUpdateData,
  TicketMessageData,
} from "@/shared/domains/support/types/ticket.types";

export const useAdminTickets = () => {
  return useQuery({
    queryKey: queryKeys.admin.support.all(),
    queryFn: () => adminSupportApi.fetchAll(),
  });
};

export const useAdminTicket = (ticketId: number | string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.admin.support.detail(ticketId),
    queryFn: () => adminSupportApi.fetchById(ticketId),
    enabled: options?.enabled ?? Boolean(ticketId),
  });
};

export const useCreateAdminTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TicketFormData) => adminSupportApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
    },
  });
};

export const useUpdateAdminTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number | string; data: TicketUpdateData }) =>
      adminSupportApi.update(ticketId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.support.detail(variables.ticketId),
      });
    },
  });
};

export const useDeleteAdminTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number | string) => adminSupportApi.delete(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
    },
  });
};

export const useAddTicketMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      message,
    }: {
      ticketId: number | string;
      message: TicketMessageData;
    }) => adminSupportApi.addMessage(ticketId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.support.detail(variables.ticketId),
      });
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, userId }: { ticketId: number | string; userId: number }) =>
      adminSupportApi.assign(ticketId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.support.detail(variables.ticketId),
      });
    },
  });
};

export const useChangeTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number | string; status: string }) =>
      adminSupportApi.changeStatus(ticketId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.support.detail(variables.ticketId),
      });
    },
  });
};

export const useCloseTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number | string) => adminSupportApi.close(ticketId),
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.detail(ticketId) });
    },
  });
};

export const useReopenTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number | string) => adminSupportApi.reopen(ticketId),
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.detail(ticketId) });
    },
  });
};

export const useBulkAssignTickets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketIds, userId }: { ticketIds: number[]; userId: number }) =>
      adminSupportApi.bulkAssign(ticketIds, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
    },
  });
};

export const useBulkCloseTickets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketIds: number[]) => adminSupportApi.bulkClose(ticketIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.support.all() });
    },
  });
};
