import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.append(key, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

// GET: Fetch project status (provisioning + infrastructure checklist)
const fetchProjectStatus = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentTenantApi(
    "GET",
    `/admin/projects/${encodedId}/status`
  );
  if (!res?.project && !res?.data) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// GET: Fetch all projects (supports pagination & filters)
const fetchProjects = async (params = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentTenantApi("GET", `/admin/projects${queryString}`);
  if (!res?.data) {
    throw new Error("Failed to fetch projects");
  }
  return res;
};

// GET: Fetch project by ID
const fetchProjectById = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentTenantApi("GET", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new project
const createProject = async (projectData) => {
  const res = await tenantApi("POST", "/admin/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateProject = async ({ id, projectData }) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("PATCH", `/admin/projects/${encodedId}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteProject = async (id) => {
  const encodedId = encodeURIComponent(id);
  const res = await tenantApi("DELETE", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all projects
export const useFetchProjects = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tenant-projects", params],
    queryFn: () => fetchProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project status
export const useTenantProjectStatus = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant-project-status", id],
    queryFn: () => fetchProjectStatus(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchProjectById = (id, options = {}) => {
  return useQuery({
    queryKey: ["project", id],
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
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
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
      // Invalidate both projects list and specific project query
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
      queryClient.invalidateQueries(["project", variables.id]);
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
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
    },
  });
};
