/**
 * Client Helper Utilities
 * Shared utility functions for client-related operations
 */

import type { Client, ClientStatus, ClientStats } from "../types/client.types";

/**
 * Get client status variant
 */
export const getClientStatusVariant = (status: ClientStatus) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "inactive":
      return {
        label: "Inactive",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
      };
    case "suspended":
      return {
        label: "Suspended",
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
      };
    case "pending":
      return {
        label: "Pending",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
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
 * Calculate client statistics
 */
export const calculateClientStats = (clients: Client[]): ClientStats => {
  return clients.reduce(
    (stats, client) => {
      stats.total++;

      switch (client.status) {
        case "active":
          stats.active++;
          break;
        case "inactive":
          stats.inactive++;
          break;
        case "suspended":
          stats.suspended++;
          break;
        case "pending":
          stats.pending++;
          break;
      }

      return stats;
    },
    { total: 0, active: 0, inactive: 0, suspended: 0, pending: 0 }
  );
};

/**
 * Format client display name
 */
export const getClientDisplayName = (client: Client): string => {
  if (client.company || client.company_name) {
    return client.company || client.company_name || client.name;
  }
  return client.name;
};

/**
 * Format address for display
 */
export const formatAddress = (address: Client["address"]): string => {
  if (!address) return "—";

  const parts = [
    address.street,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(", ") || "—";
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

/**
 * Check if client has outstanding balance
 */
export const hasOutstandingBalance = (client: Client): boolean => {
  return (client.current_balance || 0) > 0;
};

/**
 * Check if client is over credit limit
 */
export const isOverCreditLimit = (client: Client): boolean => {
  if (!client.credit_limit) return false;
  return (client.current_balance || 0) > client.credit_limit;
};

/**
 * Calculate days since last login
 */
export const daysSinceLastLogin = (lastLoginAt: string | undefined): number => {
  if (!lastLoginAt) return -1;

  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const diffMs = now.getTime() - lastLogin.getTime();

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Filter clients by search query
 */
export const filterClientsBySearch = (clients: Client[], searchQuery: string): Client[] => {
  if (!searchQuery.trim()) return clients;

  const query = searchQuery.toLowerCase();
  return clients.filter(
    (client) =>
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.company?.toLowerCase().includes(query) ||
      client.company_name?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
  );
};

/**
 * Get primary contact email
 */
export const getPrimaryContactEmail = (client: Client): string => {
  if (client.primary_contact?.email) {
    return client.primary_contact.email;
  }

  if (client.contacts && client.contacts.length > 0) {
    const primary = client.contacts.find((c) => c.is_primary);
    if (primary) return primary.email;
    return client.contacts[0].email;
  }

  return client.email;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get client initials for avatar
 */
export const getClientInitials = (client: Client): string => {
  const name = getClientDisplayName(client);
  const parts = name.split(" ");

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};
