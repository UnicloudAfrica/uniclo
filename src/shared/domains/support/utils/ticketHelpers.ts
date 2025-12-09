/**
 * Support/Ticket Helper Utilities
 * Shared utility functions for support ticket operations
 */

import type { Ticket, TicketStatus, TicketPriority, TicketStats } from "../types/ticket.types";

/**
 * Get ticket status variant (colors and labels)
 */
export const getTicketStatusVariant = (status: TicketStatus) => {
  switch (status) {
    case "open":
      return {
        label: "Open",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
    case "pending":
      return {
        label: "Pending",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "in_progress":
      return {
        label: "In Progress",
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-500",
      };
    case "resolved":
      return {
        label: "Resolved",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "closed":
      return {
        label: "Closed",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
      };
    case "reopened":
      return {
        label: "Reopened",
        bg: "bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
      };
    default:
      return {
        label: "Unknown",
        bg: "bg-gray-50",
        text: "text-gray-500",
        dot: "bg-gray-300",
      };
  }
};

/**
 * Get ticket priority variant (colors and labels)
 */
export const getTicketPriorityVariant = (priority: TicketPriority) => {
  switch (priority) {
    case "critical":
      return {
        label: "Critical",
        bg: "bg-red-100",
        text: "text-red-800",
        icon: "🔴",
      };
    case "urgent":
      return {
        label: "Urgent",
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: "🟠",
      };
    case "high":
      return {
        label: "High",
        bg: "bg-amber-100",
        text: "text-amber-800",
        icon: "🟡",
      };
    case "normal":
      return {
        label: "Normal",
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: "🔵",
      };
    case "low":
      return {
        label: "Low",
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: "⚪",
      };
    default:
      return {
        label: "Normal",
        bg: "bg-gray-100",
        text: "text-gray-600",
        icon: "○",
      };
  }
};

/**
 * Calculate ticket statistics
 */
export const calculateTicketStats = (tickets: Ticket[]): TicketStats => {
  const stats = tickets.reduce(
    (acc, ticket) => {
      acc.total++;

      switch (ticket.status) {
        case "open":
          acc.open++;
          break;
        case "pending":
          acc.pending++;
          break;
        case "in_progress":
          acc.in_progress++;
          break;
        case "resolved":
          acc.resolved++;
          break;
        case "closed":
          acc.closed++;
          break;
      }

      if (ticket.sla_breached) {
        acc.breached_sla++;
      }

      return acc;
    },
    {
      total: 0,
      open: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      breached_sla: 0,
    }
  );

  return stats;
};

/**
 * Check if SLA is breached
 */
export const isSLABreached = (ticket: Ticket): boolean => {
  if (!ticket.sla_due_at) return false;
  if (ticket.status === "resolved" || ticket.status === "closed") return false;

  const dueDate = new Date(ticket.sla_due_at);
  const now = new Date();

  return now > dueDate;
};

/**
 * Calculate time until SLA breach
 */
export const timeUntilSLABreach = (ticket: Ticket): string => {
  if (!ticket.sla_due_at) return "—";

  const dueDate = new Date(ticket.sla_due_at);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();

  if (diffMs < 0) return "Breached";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
};

/**
 * Calculate response time
 */
export const calculateResponseTime = (ticket: Ticket): string => {
  if (!ticket.first_response_at || !ticket.created_at) return "—";

  const created = new Date(ticket.created_at);
  const responded = new Date(ticket.first_response_at);
  const diffMs = responded.getTime() - created.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Format ticket age
 */
export const formatTicketAge = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
};

/**
 * Check if ticket can be closed
 */
export const canCloseTicket = (ticket: Ticket): boolean => {
  return ["open", "pending", "in_progress", "resolved"].includes(ticket.status);
};

/**
 * Check if ticket can be reopened
 */
export const canReopenTicket = (ticket: Ticket): boolean => {
  return ["resolved", "closed"].includes(ticket.status);
};

/**
 * Filter tickets by search query
 */
export const filterTicketsBySearch = (tickets: Ticket[], searchQuery: string): Ticket[] => {
  if (!searchQuery.trim()) return tickets;

  const query = searchQuery.toLowerCase();
  return tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(query) ||
      ticket.description?.toLowerCase().includes(query) ||
      ticket.identifier?.toLowerCase().includes(query) ||
      ticket.user_name?.toLowerCase().includes(query) ||
      ticket.user_email?.toLowerCase().includes(query)
  );
};

/**
 * Sort tickets by priority
 */
export const sortTicketsByPriority = (tickets: Ticket[]): Ticket[] => {
  const priorityOrder: Record<TicketPriority, number> = {
    critical: 1,
    urgent: 2,
    high: 3,
    normal: 4,
    low: 5,
  };

  return [...tickets].sort((a, b) => {
    const orderA = priorityOrder[a.priority] || 99;
    const orderB = priorityOrder[b.priority] || 99;
    return orderA - orderB;
  });
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = (ticket: Ticket, lastReadAt?: string): number => {
  if (!ticket.messages || !lastReadAt) return 0;

  const lastRead = new Date(lastReadAt);
  return ticket.messages.filter((msg) => new Date(msg.created_at) > lastRead).length;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
