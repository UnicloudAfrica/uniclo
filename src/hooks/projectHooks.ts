import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";
import { Project, ProjectStatus } from "../types/project";
import logger from "../utils/logger";

const buildQueryString = (params: Record<string, any> = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.append(key, value.toString());
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

// GET: Fetch project status (provisioning + infrastructure checklist)
const fetchProjectStatus = async (id: string | number): Promise<ProjectStatus> => {
  const encodedId = encodeURIComponent(id.toString());
  const res = await silentTenantApi("GET", `/admin/projects/${encodedId}/status`);
  if (!res?.project && !res?.data) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res as unknown as ProjectStatus;
};

// GET: Fetch all projects (supports pagination & filters)
const fetchProjects = async (params: Record<string, any> = {}): Promise<any> => {
  const queryString = buildQueryString(params);
  const res = await silentTenantApi("GET", `/admin/projects${queryString}`);
  if (!res?.data) {
    throw new Error("Failed to fetch projects");
  }
  return res;
};

// GET: Fetch project by ID
const fetchProjectById = async (id: string | number): Promise<Project> => {
  const encodedId = encodeURIComponent(id.toString());
  const res = await silentTenantApi("GET", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res.data as Project;
};

const fetchTenantProjectMembershipSuggestions = async (
  params: Record<string, any> = {}
): Promise<any> => {
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

  const uri = `/admin/project-memberships/suggestions${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await silentTenantApi("GET", uri);
  if (!res?.data) {
    throw new Error("Failed to fetch project membership suggestions");
  }
  return res.data;
};

// POST: Create a new project
const createProject = async (projectData: any) => {
  const res = await tenantApi("POST", "/admin/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateProject = async ({ id, projectData }: { id: string | number; projectData: any }) => {
  const encodedId = encodeURIComponent(id.toString());
  const res = await tenantApi("PATCH", `/admin/projects/${encodedId}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteProject = async (id: string | number) => {
  const encodedId = encodeURIComponent(id.toString());
  const res = await tenantApi("DELETE", `/admin/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all projects
export const useFetchProjects = (
  params: Record<string, any> = {},
  options: Record<string, unknown> = {}
): UseQueryResult<any, Error> => {
  return useQuery<any, Error>({
    queryKey: ["tenant-projects", params],
    queryFn: () => fetchProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project status
export const useTenantProjectStatus = (
  id: string | number,
  options: Record<string, unknown> = {}
): UseQueryResult<ProjectStatus, Error> => {
  return useQuery<ProjectStatus, Error>({
    queryKey: ["tenant-project-status", id],
    queryFn: () => fetchProjectStatus(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchProjectById = (
  id: string | number,
  options: Record<string, unknown> = {}
): UseQueryResult<Project, Error> => {
  return useQuery<Project, Error>({
    queryKey: ["project", id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useTenantProjectMembershipSuggestions = (
  params: Record<string, any> = {},
  options: Record<string, unknown> & { enabled?: boolean } = {}
): UseQueryResult<any, Error> => {
  const enabled = options.enabled ?? true;
  return useQuery<any, Error>({
    queryKey: ["tenant-project-memberships", params],
    queryFn: () => fetchTenantProjectMembershipSuggestions(params),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a project
export const useCreateProject = (): UseMutationResult<any, Error, any> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      logger.error("Error creating project:", error);
    },
  });
};

// Hook to update a project
export const useUpdateProject = (): UseMutationResult<
  any,
  Error,
  { id: string | number; projectData: any }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data, variables) => {
      // Invalidate both projects list and specific project query
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    },
    onError: (error) => {
      logger.error("Error updating project:", error);
    },
  });
};

// Hook to delete a project
export const useDeleteProject = (): UseMutationResult<any, Error, string | number> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["tenant-projects"] });
    },
    onError: (error) => {
      logger.error("Error deleting project:", error);
    },
  });
};
