import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

// GET: Fetch all tenant projects
const fetchTenantProjects = async (params = {}) => {
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
const fetchTenantProjectById = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantSilentApi("GET", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res;
};

// GET: Fetch project status
const fetchTenantProjectStatus = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantSilentApi("GET", `/admin/projects/${encodedId}/status`);
  if (!res.project) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// POST: Create a new project
const createTenantProject = async (projectData) => {
  const res = await tenantApi("POST", "/admin/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateTenantProject = async ({ id, projectData }) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("PATCH", `/admin/projects/${encodedId}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteTenantProject = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("DELETE", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// POST: Archive a project
const archiveTenantProject = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/archive`);
  if (!res.success && !res.data) {
    throw new Error(`Failed to archive project with ID ${id}`);
  }
  return res.data || res;
};

// POST: Activate a project
const activateTenantProject = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/activate`);
  if (!res.success && !res.data) {
    throw new Error(`Failed to activate project with ID ${id}`);
  }
  return res.data || res;
};

// POST: Enable VPC for project
const enableTenantVpc = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("POST", `/admin/projects/${encodedId}/enable-vpc`);
  if (!res.data) {
    throw new Error(`Failed to enable VPC for project ${id}`);
  }
  return res.data;
};

// Hook to fetch all tenant projects
export const useFetchTenantProjects = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tenant-projects", params],
    queryFn: () => fetchTenantProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchTenantProjectById = (id, options = {}) => {
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
export const useTenantProjectStatus = (id, options = {}) => {
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
      queryClient.invalidateQueries(["tenant-projects"]);
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
      queryClient.invalidateQueries(["tenant-projects"]);
      queryClient.invalidateQueries(["tenant-project", variables.id]);
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
      queryClient.invalidateQueries(["tenant-projects"]);
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
      queryClient.invalidateQueries(["tenant-projects"]);
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
      queryClient.invalidateQueries(["tenant-projects"]);
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
      queryClient.invalidateQueries(["tenant-projects"]);
      queryClient.invalidateQueries(["tenant-project", projectId]);
    },
    onError: (error) => {
      console.error("Error enabling VPC:", error);
    },
  });
};

// POST: Setup infrastructure
const setupInfrastructure = async ({ id, blueprint }) => {
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
      queryClient.invalidateQueries(["tenant-project", variables.id]);
      queryClient.invalidateQueries(["tenant-project-status", variables.id]);
      queryClient.invalidateQueries(["tenant-projects"]);
    },
    onError: (error) => {
      console.error("Error setting up infrastructure:", error);
    },
  });
};
