import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";

export interface Project {
  id: string | number;
  name: string;
  uuid?: string;
  status?: string;
  identifier?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ProjectsResponse {
  data: Project[];
  meta?: unknown;
  links?: unknown;
}

interface ProjectData {
  [key: string]: unknown;
}

// GET: Fetch all projects (supports pagination/filtering)
const fetchClientProjects = async (params: Record<string, unknown> = {}) => {
  const queryParams = { ...params };

  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(String(queryParams[key]))}`)
    .join("&");

  const uri = `/business/projects${queryString ? `?${queryString}` : ""}`;

  const res = await clientSilentApi<ProjectsResponse>("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch projects");
  }
  return res;
};

// GET: Fetch project by ID
const fetchClientProjectById = async (id: string | number) => {
  const res = await clientSilentApi<{ data: Project }>("GET", `/business/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  return res.data;
};

const fetchClientProjectMembershipSuggestions = async (params: Record<string, string> = {}) => {
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

  const res = await clientSilentApi<{ data: unknown[] }>("GET", uri);
  if (!res?.data) {
    throw new Error("Failed to fetch project membership suggestions");
  }
  return res.data;
};

export interface StatusResponse {
  data?: unknown;
  project?: unknown;
  summary?: unknown[];
  provisioning_progress?: unknown[];
  [key: string]: unknown;
}

export interface NetworkStatusResponse {
  data?: any;
  network?: any;
}

// GET: Fetch project status (provisioning + infrastructure checklist)
const fetchClientProjectStatus = async (id: string | number) => {
  const encodedId = encodeURIComponent(String(id));
  const res = await clientSilentApi<StatusResponse>(
    "GET",
    `/business/projects/${encodedId}/status`
  );
  if (!res?.project && !res?.data) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// GET: Fetch project network status
const fetchClientProjectNetworkStatus = async (id: string | number) => {
  const encodedId = encodeURIComponent(String(id));
  const res = await clientSilentApi<NetworkStatusResponse>(
    "GET",
    `/business/projects/${encodedId}/network/status`
  );
  if (!res) {
    throw new Error(`Failed to fetch network status for ${id}`);
  }
  return res;
};

// POST: Create a new project
const createClientProject = async (projectData: ProjectData) => {
  const res = await clientApi<{ data: Project }>("POST", "/business/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// POST: Enable internet access for project
const enableClientInternetAccess = async (id: string | number) => {
  const encodedId = encodeURIComponent(String(id));
  const res = await clientApi<{ data?: unknown }>(
    "POST",
    `/business/projects/${encodedId}/network/enable-internet`
  );
  if (!res) {
    throw new Error(`Failed to enable internet access for project ${id}`);
  }
  return res;
};

// PATCH: Update a project
const updateClientProject = async ({
  id,
  projectData,
}: {
  id: string | number;
  projectData: ProjectData;
}) => {
  const res = await clientApi<{ data: Project }>("PATCH", `/business/projects/${id}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteClientProject = async (id: string | number) => {
  const res = await clientApi<{ data: unknown }>("DELETE", `/business/projects/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all projects
export const useFetchClientProjects = (
  params: Record<string, unknown> = {},
  options: Omit<UseQueryOptions<ProjectsResponse, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientProjects", params],
    queryFn: () => fetchClientProjects(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project by ID
export const useFetchClientProjectById = (
  id: string | number,
  options: Omit<UseQueryOptions<Project, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientProject", id],
    queryFn: () => fetchClientProjectById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useClientProjectMembershipSuggestions = (
  params: Record<string, string> = {},
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  const { enabled, ...rest } = options;
  const isEnabled = enabled ?? true;
  return useQuery({
    queryKey: ["client-project-memberships", params],
    queryFn: () => fetchClientProjectMembershipSuggestions(params),
    enabled: isEnabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

// Hook to fetch project status details
export const useClientProjectStatus = (
  id: string | number,
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientProjectStatus", id],
    queryFn: () => fetchClientProjectStatus(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: unknown) => {
      const err = error as { message?: string };
      if (err?.message?.includes?.("404") || err?.message?.includes?.("403")) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

// Hook to fetch project network status
export const useClientProjectNetworkStatus = (
  id: string | number,
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["client-project-network-status", id],
    queryFn: () => fetchClientProjectNetworkStatus(id),
    enabled: !!id && options.enabled !== false,
    staleTime: 0,
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
    onError: () => {
      // Error handling
    },
  });
};

// Hook to enable internet access
export const useClientEnableInternetAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => enableClientInternetAccess(id),
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["client-project-network-status", projectId] });
      queryClient.invalidateQueries({ queryKey: ["clientProject", projectId] });
      queryClient.invalidateQueries({ queryKey: ["clientProjectStatus", projectId] });
    },
    onError: () => {
      // Error handling
    },
  });
};

// Hook to update a project
export const useUpdateClientProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientProject,
    onSuccess: (_data, variables) => {
      // Invalidate both projects list and specific project query
      queryClient.invalidateQueries({ queryKey: ["clientProjects"] });
      queryClient.invalidateQueries({
        queryKey: ["clientProject", variables.id],
      });
    },
    onError: () => {
      // Error handling
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
    onError: () => {
      // Error handling
    },
  });
};

// POST: Setup infrastructure
const setupInfrastructure = async ({
  id,
  blueprint,
}: {
  id: string | number;
  blueprint: unknown;
}) => {
  const encodedId = encodeURIComponent(String(id));
  const res = await clientApi<{ data: unknown }>("POST", `/business/projects/${encodedId}/setup`, {
    blueprint,
  });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientProject", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["clientProjectStatus", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["clientProjects"] });
    },
    onError: () => {
      // Error handling
    },
  });
};
