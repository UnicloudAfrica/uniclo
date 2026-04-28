/**
 * Shared TanStack Query client.
 *
 * This module owns the single QueryClient instance used by the app.
 * Exporting it here (rather than constructing inline inside
 * QueryProvider) lets the auth store and any other non-React code
 * invalidate or clear caches without a React context dance.
 *
 * M-08: `queryClient.clear()` is called from authStore on logout and
 *       tenant switch, so cached per-tenant data from a previous
 *       session is not reused under a different identity.
 */
import { QueryClient } from "@tanstack/react-query";
import logger from "@/utils/logger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries once. Matches the previous inline config.
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        logger.error("Mutation Error:", error);
      },
    },
  },
});
