import { QueryClient } from "@tanstack/react-query";

/**
 * React Query Client Configuration
 * Centralized configuration for data fetching, caching, and mutations
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: how long inactive data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests
      retry: 1,

      // Refetch on window focus
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 0,

      // Global error handler for mutations
      onError: (error: any) => {
        console.error("Mutation error:", error);
        // You can add toast notifications here
      },
    },
  },
});

/**
 * Query keys factory for consistent cache key management
 */
export const queryKeys = {
  // Admin query keys
  admin: {
    all: ["admin"] as const,
    partners: () => [...queryKeys.admin.all, "partners"] as const,
    partner: (id: string) => [...queryKeys.admin.partners(), id] as const,

    clients: {
      all: () => [...queryKeys.admin.all, "clients"] as const,
      detail: (id: number | string) => [...queryKeys.admin.all, "clients", id] as const,
    },

    instances: {
      all: () => [...queryKeys.admin.all, "instances"] as const,
      detail: (id: string) => [...queryKeys.admin.all, "instances", id] as const,
    },

    projects: {
      all: () => [...queryKeys.admin.all, "projects"] as const,
      detail: (id: string) => [...queryKeys.admin.all, "projects", id] as const,
      status: (id: string) => [...queryKeys.admin.all, "projects", id, "status"] as const,
    },

    support: {
      all: () => [...queryKeys.admin.all, "support"] as const,
      detail: (id: string | number) => [...queryKeys.admin.all, "support", id] as const,
    },
  },

  // Tenant query keys
  tenant: {
    all: ["tenant"] as const,
    dashboard: () => [...queryKeys.tenant.all, "dashboard"] as const,
    partners: () => [...queryKeys.tenant.all, "partners"] as const,
    partner: (id: string) => [...queryKeys.tenant.partners(), id] as const,
    clients: () => [...queryKeys.tenant.all, "clients"] as const,
    client: (id: string) => [...queryKeys.tenant.clients(), id] as const,
    instances: () => [...queryKeys.tenant.all, "instances"] as const,
    instance: (id: string) => [...queryKeys.tenant.instances(), id] as const,
    projects: () => [...queryKeys.tenant.all, "projects"] as const,
    project: (id: string) => [...queryKeys.tenant.projects(), id] as const,
    support: () => [...queryKeys.tenant.all, "support"] as const,
    ticket: (id: string) => [...queryKeys.tenant.support(), id] as const,
  },

  // Client query keys
  client: {
    all: ["client"] as const,
    projects: () => [...queryKeys.client.all, "projects"] as const,
    project: (id: string) => [...queryKeys.client.projects(), id] as const,
    instances: () => [...queryKeys.client.all, "instances"] as const,
    instance: (id: string) => [...queryKeys.client.instances(), id] as const,
    support: () => [...queryKeys.client.all, "support"] as const,
    ticket: (id: string) => [...queryKeys.client.support(), id] as const,
  },

  // Common/shared query keys
  common: {
    regions: () => ["regions"] as const,
    region: (id: string) => [...queryKeys.common.regions(), id] as const,
    products: () => ["products"] as const,
    pricing: () => ["pricing"] as const,
  },
} as const;

export default queryClient;
