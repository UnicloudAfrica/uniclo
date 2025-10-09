import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all projects (supports pagination)
const fetchProjects = async (params = {}) => {
  // Default to 10 items per page if not provided
  const defaultParams = {
    per_page: 10,
  };

  const queryParams = { ...defaultParams, ...params };

  // Build query string from parameters
  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  const uri = `/projects${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch projects");
  }
  // Return the full response to include pagination metadata (meta)
  return res;
};

// GET: Fetch project by ID
const fetchProjectById = async (id) => {
  const res = await silentApi("GET", `/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new project
const createProject = async (projectData) => {
  const res = await api("POST", "/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateProject = async ({ id, projectData }) => {
  const res = await api("PATCH", `/projects/${id}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteProject = async (id) => {
  const res = await api("DELETE", `/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all projects (supports pagination)
export const useFetchProjects = (params = {}, options = {}) => {
  return useQuery({
    // Include params in the key so different pages/page sizes cache separately
    queryKey: ["admin-projects", params],
    queryFn: () => fetchProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchProjectById = (id, options = {}) => {
  return useQuery({
    queryKey: ["admin-project", id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries(["admin-projects"]);
    },
    onError: (error) => {
      console.error("Error creating project:", error);
    },
  });
};

// Hook to update a project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data, variables) => {
      // Invalidate both admin-projects list and specific project query
      queryClient.invalidateQueries(["admin-projects"]);
      queryClient.invalidateQueries(["admin-project", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating project:", error);
    },
  });
};

// Hook to delete a project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries(["admin-projects"]);
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
    },
  });
};
