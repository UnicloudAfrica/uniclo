import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

// GET: Fetch all tenant projects
const fetchTenantProjects = async (params: any = {}) => {
  const queryParams = { ...params };

  // Build query string from parameters
  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  const uri = `/admin/projects${queryString ? `?${queryString}` : ""}`;

  const res = await tenantSilentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch projects");
  }
  return res;
};

// GET: Fetch project by ID
const fetchTenantProjectById = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantSilentApi("GET", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res;
};

// GET: Fetch project status
const fetchTenantProjectStatus = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantSilentApi("GET", `/admin/projects/${encodedId}/status`);
  if (!res.project) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// POST: Create a new project
const createTenantProject = async (projectData: Record<string, unknown>) => {
  const res = await tenantApi("POST", "/admin/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateTenantProject = async ({
  id,
  projectData,
}: {
  id: string;
  projectData: Record<string, unknown>;
}) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("PATCH", `/admin/projects/${encodedId}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteTenantProject = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("DELETE", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// POST: Archive a project
const archiveTenantProject = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/archive`);
  if (!res.success && !res.data) {
    throw new Error(`Failed to archive project with ID ${id}`);
  }
  return res.data || res;
};

// POST: Activate a project
const activateTenantProject = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/activate`);
  if (!res.success && !res.data) {
    throw new Error(`Failed to activate project with ID ${id}`);
  }
  return res.data || res;
};

// POST: Enable VPC for project
const enableTenantVpc = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/enable-vpc`);
  if (!res.data) {
    throw new Error(`Failed to enable VPC for project ${id}`);
  }
  return res.data;
};

// GET: Fetch project network status
const fetchTenantProjectNetworkStatus = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantSilentApi("GET", `/admin/projects/${encodedId}/network/status`);
  if (!res) {
    throw new Error(`Failed to fetch network status for project ${id}`);
  }
  return res;
};

// POST: Enable internet access for project
const enableTenantInternetAccess = async (id: string) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/network/enable-internet`);
  if (!res) {
    throw new Error(`Failed to enable internet access for project ${id}`);
  }
  return res;
};

// Hook to fetch all tenant projects
export const useFetchTenantProjects = (params: any = {}, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["tenant-projects", params],
    queryFn: () => fetchTenantProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchTenantProjectById = (id: string, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["tenant-project", id],
    queryFn: () => fetchTenantProjectById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project status
export const useTenantProjectStatus = (id: string, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["tenant-project-status", id],
    queryFn: () => fetchTenantProjectStatus(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a project
export const useCreateTenantProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      console.error("Error creating project:", error);
    },
  });
};

// Hook to update a project
export const useUpdateTenantProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantProject,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-project", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating project:", error);
    },
  });
};

// Hook to delete a project
export const useDeleteTenantProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
    },
  });
};

// Hook to archive a project
export const useArchiveTenantProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveTenantProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      console.error("Error archiving project:", error);
    },
  });
};

// Hook to activate a project
export const useActivateTenantProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateTenantProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      console.error("Error activating project:", error);
    },
  });
};

// Hook to enable VPC
export const useEnableTenantVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableTenantVpc,
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-project", projectId] });
    },
    onError: (error) => {
      console.error("Error enabling VPC:", error);
    },
  });
};

// Hook to fetch project network status
export const useTenantProjectNetworkStatus = (
  id: string,
  options: Record<string, unknown> & { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: ["tenant-project-network-status", id],
    queryFn: () => fetchTenantProjectNetworkStatus(id),
    enabled: !!id && options.enabled !== false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to enable internet access
export const useTenantEnableInternetAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableTenantInternetAccess,
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-project-network-status", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tenant-project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tenant-project-status", projectId] });
    },
    onError: (error) => {
      console.error("Error enabling internet access:", error);
    },
  });
};

// POST: Setup infrastructure
const setupInfrastructure = async ({
  id,
  blueprint,
}: {
  id: string;
  blueprint: Record<string, unknown>;
}) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/setup`, { blueprint });
  if (!res.data) {
    throw new Error(`Failed to setup infrastructure for project ${id}`);
  }
  return res.data;
};

// Hook to setup infrastructure
export const useSetupInfrastructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setupInfrastructure,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-project-status", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      console.error("Error setting up infrastructure:", error);
    },
  });
};
