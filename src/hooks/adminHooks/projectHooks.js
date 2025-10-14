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

// GET: Fetch project status (provisioning + VPC checklist)
const fetchProjectStatus = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentApi('GET', `/projects/${encodedId}/status`);
  if (!res.project) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// GET: Fetch project by ID
const fetchProjectById = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentApi("GET", `/projects/${encodedId}`);
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
  const encodedId = encodeURIComponent(id);
  const res = await api("PATCH", `/projects/${encodedId}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteProject = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await api("DELETE", `/projects/${encodedId}`);
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

// Hook to fetch project status
export const useProjectStatus = (id, options = {}) => {
  return useQuery({
    queryKey: ['admin-project-status', id],
    queryFn: () => fetchProjectStatus(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["admin-projects"]);

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(["admin-projects"]);

      // Create optimistic project data
      const optimisticProject = {
        id: Date.now(), // temporary ID
        identifier: `temp_${Date.now()}`, // temporary identifier
        name: newProject.name,
        description: newProject.description,
        type: newProject.type,
        default_region: newProject.default_region,
        status: "processing", // Show as processing until Zadara confirms
        provisioning_status: "processing",
        provisioning_progress: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        instances: [],
        tenant_id: newProject.tenant_id,
        client_ids: newProject.client_ids || [],
        _isOptimistic: true // Flag to identify optimistic updates
      };

      // Optimistically update the projects list
      if (previousProjects?.data) {
        queryClient.setQueryData(["admin-projects"], (old) => ({
          ...old,
          data: [optimisticProject, ...old.data], // Add to beginning of list
          meta: {
            ...old.meta,
            total: old.meta.total + 1
          }
        }));
      }

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic project with real data
      queryClient.setQueryData(["admin-projects"], (old) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map(project => 
            project._isOptimistic && project.name === variables.name
              ? { ...data, status: data.status || "provisioning" } // Use real project data
              : project
          )
        };
      });

      // Also invalidate to ensure we get the latest data from server
      queryClient.invalidateQueries(["admin-projects"]);
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(["admin-projects"], context.previousProjects);
      }
      console.error("Error creating project:", error);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries(["admin-projects"]);
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
