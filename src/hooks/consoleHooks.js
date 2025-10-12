import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import instanceApiService from "../services/instanceApi";
import api from "../index/api";
import silentApi from "../index/silent";

/**
 * Console Access Hooks
 * 
 * These hooks provide functionality for accessing instance consoles
 * using the re-enabled console access functionality.
 */

// GET: Fetch console URL for an instance
const fetchConsoleUrl = async (instanceId, consoleType = 'novnc') => {
  return await instanceApiService.getConsoleUrl(instanceId, consoleType);
};

// GET: Fetch console URL using direct API call (alternative approach)
const fetchConsoleUrlDirect = async (instanceId) => {
  const res = await silentApi("GET", `/business/instance-consoles/${instanceId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch console URL for instance ${instanceId}`);
  }
  return res.data;
};

// Hook to get console URL for an instance
export const useGetConsoleUrl = (instanceId, consoleType = 'novnc', options = {}) => {
  return useQuery({
    queryKey: ["console-url", instanceId, consoleType],
    queryFn: () => fetchConsoleUrl(instanceId, consoleType),
    enabled: !!instanceId, // Only fetch if instanceId is provided
    staleTime: 1000 * 60, // Cache for 1 minute (console URLs may expire)
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

// Hook to get console URL using direct API call
export const useGetConsoleUrlDirect = (instanceId, options = {}) => {
  return useQuery({
    queryKey: ["console-url-direct", instanceId],
    queryFn: () => fetchConsoleUrlDirect(instanceId),
    enabled: !!instanceId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

// Hook to refresh console URL (useful when console sessions expire)
export const useRefreshConsoleUrl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ instanceId, consoleType = 'novnc' }) => 
      fetchConsoleUrl(instanceId, consoleType),
    onSuccess: (data, variables) => {
      // Update the cache with new console URL
      queryClient.setQueryData(
        ["console-url", variables.instanceId, variables.consoleType], 
        data
      );
    },
    onError: (error) => {
      console.error("Error refreshing console URL:", error);
    },
  });
};

// Utility function to check if console access is available for an instance
export const useConsoleAccessCheck = (instanceId, options = {}) => {
  return useQuery({
    queryKey: ["console-access-check", instanceId],
    queryFn: async () => {
      try {
        const result = await fetchConsoleUrl(instanceId);
        return { 
          available: true, 
          consoleUrl: result.consoleUrl,
          data: result.data 
        };
      } catch (error) {
        return { 
          available: false, 
          error: error.message 
        };
      }
    },
    enabled: !!instanceId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
};

// Export individual functions for direct use if needed
export {
  fetchConsoleUrl,
  fetchConsoleUrlDirect
};