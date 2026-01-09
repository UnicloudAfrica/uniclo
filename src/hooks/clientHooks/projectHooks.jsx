import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

// GET: Fetch all projects (supports pagination/filtering)
const fetchClientProjects = async (params = {}) => {
  const queryParams = { ...params };

  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  const uri = `/business/projects${queryString ? `?${queryString}` : ""}`;

  const res = await clientSilentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch projects");
  }
  return res;
};

// GET: Fetch project by ID
const fetchClientProjectById = async (id) => {
  const res = await clientSilentApi("GET", `/business/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res.data;
};

const fetchClientProjectMembershipSuggestions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.scope) {
    query.append("scope", params.scope);
  }
  if (params.tenant_id) {
    query.append("tenant_id", params.tenant_id);
  }
  if (params.client_id) {
    query.append("client_id", params.client_id);
  }

  const uri = `/business/project-memberships/suggestions${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await clientSilentApi("GET", uri);
  if (!res?.data) {
    throw new Error("Failed to fetch project membership suggestions");
  }
  return res.data;
};

// GET: Fetch project status (provisioning + infrastructure checklist)
const fetchClientProjectStatus = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await clientSilentApi("GET", `/business/projects/${encodedId}/status`);
  if (!res?.project && !res?.data) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// POST: Create a new project
const createClientProject = async (projectData) => {
  const res = await clientApi("POST", "/business/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateClientProject = async ({ id, projectData }) => {
  const res = await clientApi("PATCH", `/business/projects/${id}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteClientProject = async (id) => {
  const res = await clientApi("DELETE", `/business/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all projects
export const useFetchClientProjects = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["clientProjects", params],
    queryFn: () => fetchClientProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchClientProjectById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientProject", id],
    queryFn: () => fetchClientProjectById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useClientProjectMembershipSuggestions = (params = {}, options = {}) => {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ["client-project-memberships", params],
    queryFn: () => fetchClientProjectMembershipSuggestions(params),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project status details
export const useClientProjectStatus = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientProjectStatus", id],
    queryFn: () => fetchClientProjectStatus(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes?.("404") || error?.message?.includes?.("403")) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

// Hook to create a project
export const useCreateClientProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientProject,
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["clientProjects"] });
    },
    onError: (error) => {
      console.error("Error creating project:", error);
    },
  });
};

// Hook to update a project
export const useUpdateClientProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientProject,
    onSuccess: (data, variables) => {
      // Invalidate both projects list and specific project query
      queryClient.invalidateQueries({ queryKey: ["clientProjects"] });
      queryClient.invalidateQueries({
        queryKey: ["clientProject", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating project:", error);
    },
  });
};

// Hook to delete a project
export const useDeleteClientProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientProject,
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["clientProjects"] });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
    },
  });
};

// POST: Setup infrastructure
const setupInfrastructure = async ({ id, blueprint }) => {
  const encodedId = encodeURIComponent(id);
  const res = await clientApi("POST", `/business/projects/${encodedId}/setup`, { blueprint });
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
      queryClient.invalidateQueries({ queryKey: ["clientProject", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["clientProjectStatus", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["clientProjects"] });
    },
    onError: (error) => {
      console.error("Error setting up infrastructure:", error);
    },
  });
};
