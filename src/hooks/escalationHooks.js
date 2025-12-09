import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// Escalation level labels
export const ESCALATION_LEVELS = {
  0: { label: "Client Support", color: "blue", icon: "user" },
  1: { label: "Tenant Support", color: "orange", icon: "building" },
  2: { label: "UniCloud Admin", color: "purple", icon: "shield" },
  3: { label: "Provider Support", color: "red", icon: "cloud" },
};

// SLA status colors
export const SLA_STATUS_COLORS = {
  on_track: "green",
  at_risk: "yellow",
  breached: "red",
  met: "blue",
};

// ═══════════════════════════════════════════════════════════════════
// TICKETS / THREADS
// ═══════════════════════════════════════════════════════════════════

// Fetch tickets with escalation info
export const useFetchTickets = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: async () => {
      const res = await silentApi("GET", `/business/support/threads`, params);
      return res.data;
    },
    staleTime: 1000 * 60,
    ...options,
  });
};

// Fetch single ticket with escalation history
export const useFetchTicket = (id, options = {}) => {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await silentApi("GET", `/business/support/threads/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Fetch ticket SLA status
export const useFetchTicketSla = (id, options = {}) => {
  return useQuery({
    queryKey: ["ticketSla", id],
    queryFn: async () => {
      const res = await silentApi("GET", `/business/support/threads/${id}/sla`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
    refetchInterval: 1000 * 60, // Refresh every minute
    ...options,
  });
};

// Create ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api("POST", `/business/support/threads`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// ESCALATION ACTIONS
// ═══════════════════════════════════════════════════════════════════

// Escalate ticket
export const useEscalateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api("POST", `/business/support/threads/${id}/escalate`, {
        reason,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["ticketSla", variables.id] });
    },
  });
};

// Fetch escalation history
export const useFetchEscalationHistory = (ticketId, options = {}) => {
  return useQuery({
    queryKey: ["escalationHistory", ticketId],
    queryFn: async () => {
      const res = await silentApi("GET", `/business/support/threads/${ticketId}/escalations`);
      return res.data?.data || res.data;
    },
    enabled: !!ticketId,
    ...options,
  });
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN: Escalation management
// ═══════════════════════════════════════════════════════════════════

// Admin: Fetch all escalated tickets
export const useFetchEscalatedTickets = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["escalatedTickets", params],
    queryFn: async () => {
      const res = await silentApi("GET", `/admin/v1/support/escalated`, params);
      return res.data;
    },
    staleTime: 1000 * 30,
    ...options,
  });
};

// Admin: Assign ticket
export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assignee_id, assignee_type }) => {
      const res = await api("POST", `/admin/v1/support/threads/${id}/assign`, {
        assignee_id,
        assignee_type,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["escalatedTickets"] });
    },
  });
};

// Admin: Resolve ticket
export const useResolveTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution }) => {
      const res = await api("POST", `/admin/v1/support/threads/${id}/resolve`, {
        resolution,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["escalatedTickets"] });
    },
  });
};

// Admin: De-escalate ticket
export const useDeescalateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api("POST", `/admin/v1/support/threads/${id}/deescalate`, {
        reason,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["escalatedTickets"] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

// Get escalation level info
export const getEscalationLevelInfo = (level) => {
  return ESCALATION_LEVELS[level] || ESCALATION_LEVELS[0];
};

// Get SLA status color
export const getSlaStatusColor = (status) => {
  return SLA_STATUS_COLORS[status] || "gray";
};

// Calculate time remaining for SLA
export const calculateSlaTimeRemaining = (dueAt) => {
  if (!dueAt) return null;

  const now = new Date();
  const due = new Date(dueAt);
  const diff = due - now;

  if (diff <= 0) return { expired: true, text: "Breached" };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { expired: false, text: `${days}d ${hours % 24}h`, urgent: false };
  }

  if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m`, urgent: hours < 2 };
  }

  return { expired: false, text: `${minutes}m`, urgent: true };
};
