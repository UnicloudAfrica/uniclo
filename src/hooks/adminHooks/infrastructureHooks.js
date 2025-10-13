import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch infrastructure status for all projects
const fetchInfrastructureOverview = async (params = {}) => {
  const queryString = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  const uri = `/project-infrastructure${queryString ? `?${queryString}` : ""}`;
  const res = await silentApi("GET", uri);
  
  if (!res.data) {
    throw new Error("Failed to fetch infrastructure overview");
  }
  return res.data;
};

// GET: Fetch infrastructure status for a specific project
const fetchProjectInfrastructure = async (projectId, region = null) => {
  const queryString = region ? `?region=${encodeURIComponent(region)}` : "";
  const uri = `/project-infrastructure/${projectId}${queryString}`;
  
  const res = await silentApi("GET", uri);
  if (!res.data) {
    throw new Error(`Failed to fetch infrastructure for project ${projectId}`);
  }
  return res.data;
};

// POST: Set up infrastructure component
const setupInfrastructureComponent = async (componentData) => {
  const res = await api("POST", "/project-infrastructure", componentData);
  if (!res.success && !res.data) {
    throw new Error(res.message || "Failed to setup infrastructure component");
  }
  return res;
};

// Hook to fetch infrastructure overview for all projects
export const useFetchInfrastructureOverview = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["infrastructure-overview", params],
    queryFn: () => fetchInfrastructureOverview(params),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes (shorter for real-time updates)
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
    ...options,
  });
};

// Hook to fetch infrastructure status for a specific project
export const useFetchProjectInfrastructure = (projectId, region = null, options = {}) => {
  return useQuery({
    queryKey: ["project-infrastructure", projectId, region],
    queryFn: () => fetchProjectInfrastructure(projectId, region),
    enabled: !!projectId, // Only fetch if project ID is provided
    staleTime: 1000 * 60 * 1, // Cache for 1 minute for faster updates
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time status updates
    ...options,
  });
};

// Hook to setup infrastructure components
export const useSetupInfrastructure = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: setupInfrastructureComponent,
    onSuccess: (data, variables) => {
      // Invalidate infrastructure queries for the affected project
      queryClient.invalidateQueries(["project-infrastructure", variables.project_identifier]);
      queryClient.invalidateQueries(["infrastructure-overview"]);
      
      // Also invalidate the project details to refresh overall status
      queryClient.invalidateQueries(["admin-project", variables.project_identifier]);
    },
    onError: (error) => {
      console.error("Error setting up infrastructure:", error);
    },
  });
};

// Hook for quick VPC setup
export const useQuickSetupVPC = () => {
  const setupInfrastructure = useSetupInfrastructure();
  
  return useMutation({
    mutationFn: async ({ projectId, name, cidrBlock, region, autoConfig = true }) => {
      return setupInfrastructure.mutateAsync({
        project_identifier: projectId,
        component: "vpc",
        name: name,
        cidr_block: cidrBlock,
        region: region,
        auto_configure: autoConfig,
      });
    },
    onSuccess: setupInfrastructure.onSuccess,
    onError: setupInfrastructure.onError,
  });
};

// Hook for quick Edge Networks setup
export const useQuickSetupEdgeNetworks = () => {
  const setupInfrastructure = useSetupInfrastructure();
  
  return useMutation({
    mutationFn: async ({ projectId, region, autoConfig = true }) => {
      return setupInfrastructure.mutateAsync({
        project_identifier: projectId,
        component: "edge_networks",
        region: region,
        auto_configure: autoConfig,
      });
    },
    onSuccess: setupInfrastructure.onSuccess,
    onError: setupInfrastructure.onError,
  });
};

// Hook for setting up any component with specific configuration
export const useSetupComponent = () => {
  const setupInfrastructure = useSetupInfrastructure();
  
  return useMutation({
    mutationFn: async ({ projectId, component, config = {}, autoConfig = true }) => {
      return setupInfrastructure.mutateAsync({
        project_identifier: projectId,
        component: component,
        auto_configure: autoConfig,
        ...config,
      });
    },
    onSuccess: setupInfrastructure.onSuccess,
    onError: setupInfrastructure.onError,
  });
};