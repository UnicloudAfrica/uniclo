import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

// GET: Fetch all projects
const fetchClientProjects = async () => {
  const res = await clientSilentApi("GET", "/business/projects");
  if (!res.data) {
    throw new Error("Failed to fetch projects");
  }
  return res.data;
};

// GET: Fetch project by ID
const fetchClientProjectById = async (id) => {
  const res = await clientSilentApi("GET", `/business/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res.data;
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
export const useFetchClientProjects = (options = {}) => {
  return useQuery({
    queryKey: ["clientProjects"],
    queryFn: fetchClientProjects,
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
