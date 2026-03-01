import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type QueryOptions = Record<string, unknown>;
type QueryOptionsWithEnabled = QueryOptions & { enabled?: boolean };
export type ProjectStatusResponse = ApiResponse & { project?: Record<string, unknown> };
type ProjectRecord = Record<string, unknown> & {
  id?: Id;
  identifier?: Id;
  name?: string;
  status?: string;
  _isOptimistic?: boolean;
};
type ProjectsListResponse = ApiResponse<ProjectRecord[]> & { meta?: { total?: number } };
type ProjectCreateFields = {
  name?: string;
  description?: string;
  type?: string;
  region?: string;
  tenant_id?: Id;
  client_id?: Id | null;
  assignment_scope?: string | null;
  member_user_ids?: Id[];
};
type ProjectCreateInput = ProjectCreateFields & Record<string, unknown>;
type SyncProjectUserInput = {
  projectId: Id;
  userId: Id;
  data?: ApiPayload;
};
type ProjectUserPolicyInput = {
  projectId: Id;
  userId: Id;
  policyId: Id;
};
type ProjectNetworkInput = {
  projectId: Id;
  data: ApiPayload;
};
export type SetupInfrastructureInput = {
  id: Id;
  blueprint: ApiPayload;
};

const buildQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) {
    return "";
  }
  const stringParams = entries.reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
  return new URLSearchParams(stringParams).toString();
};

// GET: Fetch all projects (supports pagination)
const fetchProjects = async (params: QueryParams = {}) => {
  // Default to 10 items per page if not provided
  const defaultParams = {
    per_page: 10,
  };

  const queryParams = { ...defaultParams, ...params };

  // Build query string from parameters
  const queryString = buildQueryString(queryParams);

  const uri = `/projects${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi<ApiResponse>("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch projects");
  }
  // Return the full response to include pagination metadata (meta)
  return res;
};

// GET: Fetch project status (provisioning + VPC checklist)
const fetchProjectStatus = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentApi<ProjectStatusResponse>("GET", `/projects/${encodedId}/status`);
  if (!res.project) {
    throw new Error(`Failed to fetch project status for ${id}`);
  }
  return res;
};

// GET: Fetch project by ID
const fetchProjectById = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentApi<ApiResponse>("GET", `/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to fetch project with ID ${id}`);
  }
  // Return full response - component will access res.data
  return res;
};

const fetchProjectMembershipSuggestions = async (params: QueryParams = {}) => {
  const queryString = buildQueryString({
    scope: params["scope"],
    tenant_id: params["tenant_id"],
    client_id: params["client_id"],
  });

  const uri = `/project-memberships/suggestions${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi<ApiResponse>("GET", uri);
  if (!res?.data) {
    throw new Error("Failed to fetch project membership suggestions");
  }

  return res.data;
};

// POST: Create a new project
const createProject = async (projectData: ProjectCreateInput) => {
  const res = await api<ApiResponse<ProjectRecord>>("POST", "/projects", projectData);
  if (!res.data) {
    throw new Error("Failed to create project");
  }
  return res.data;
};

// PATCH: Update a project
const updateProject = async ({ id, projectData }: { id: Id; projectData: ApiPayload }) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse<ProjectRecord>>("PATCH", `/projects/${encodedId}`, projectData);
  if (!res.data) {
    throw new Error(`Failed to update project with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a project
const deleteProject = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse>("DELETE", `/projects/${encodedId}`);
  if (!res.data) {
    throw new Error(`Failed to delete project with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all projects (supports pagination)
export const useFetchProjects = (params: QueryParams = {}, options: QueryOptions = {}) => {
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
export const useFetchProjectById = (id: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-project", id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useProjectMembershipSuggestions = (
  params: QueryParams = {},
  options: QueryOptionsWithEnabled = {}
) => {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["admin-project-memberships", params],
    queryFn: () => fetchProjectMembershipSuggestions(params),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch project status
export const useProjectStatus = (id: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-project-status", id],
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
    onMutate: async (newProject: ProjectCreateInput) => {
      const projectRecord = newProject;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-projects"] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<ProjectsListResponse>(["admin-projects"]);

      // Create optimistic project data
      const optimisticProject = {
        id: Date.now(), // temporary ID
        identifier: `temp_${Date.now()}`, // temporary identifier
        name: projectRecord.name,
        description: projectRecord.description,
        type: projectRecord.type,
        region: projectRecord.region,
        status: "created", // Initial status is now created
        provisioning_status: "created",
        provisioning_progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        instances: [],
        tenant_id: projectRecord.tenant_id,
        client_id: projectRecord.client_id ?? null,
        assignment_scope: projectRecord.assignment_scope ?? null,
        member_user_ids: projectRecord.member_user_ids ?? [],
        _isOptimistic: true, // Flag to identify optimistic updates
      };

      // Optimistically update the projects list
      if (previousProjects?.data) {
        queryClient.setQueryData<ProjectsListResponse>(
          ["admin-projects"],
          (old: ProjectsListResponse | undefined) => {
            if (!old?.data) return old;
            const nextTotal = (old.meta?.total ?? old.data.length) + 1;
            return {
              ...old,
              data: [optimisticProject, ...old.data], // Add to beginning of list
              meta: {
                ...old.meta,
                total: nextTotal,
              },
            };
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onSuccess: (data: { status: any }, variables: { name: any }) => {
      // Replace the optimistic project with real data
      queryClient.setQueryData<ProjectsListResponse>(
        ["admin-projects"],
        (old: ProjectsListResponse | undefined) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((project) =>
              project._isOptimistic && project.name === variables.name
                ? { ...data, status: data.status || "provisioning" } // Use real project data
                : project
            ),
          };
        }
      );

      // Also invalidate to ensure we get the latest data from server
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (
      error: unknown,
      _variables: { name: any },
      context: { previousProjects: unknown }
    ) => {
      void _variables;
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(["admin-projects"], context.previousProjects);
      }
      console.error("Error creating project:", error);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });
};

// Hook to update a project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (_data: unknown, variables: { id: string }) => {
      void _data;
      // Invalidate both admin-projects list and specific project query
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", variables.id] });
    },
    onError: (error: unknown) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: unknown) => {
      console.error("Error deleting project:", error);
    },
  });
};

// POST: Provision project infrastructure
const provisionProject = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/provision`);
  if (!res.data) {
    throw new Error(`Failed to provision project ${id}`);
  }
  return res.data;
};

// POST: Simulate provision
const simulateProvision = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/provision-simulated`);
  if (!res.data) {
    throw new Error(`Failed to simulate provision for project ${id}`);
  }
  return res.data;
};

// GET: Verify Zadara connection
const verifyZadara = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await silentApi<ApiResponse>("GET", `/projects/${encodedId}/verify-zadara`);
  return res;
};

// POST: Enable VPC for project
const enableVpc = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/enable-vpc`);
  return res;
};

// POST: Sync project user
const syncProjectUser = async ({ projectId, userId, data = {} }: SyncProjectUserInput) => {
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedUserId = encodeURIComponent(userId);
  const res = await api<ApiResponse>(
    "POST",
    `/projects/${encodedProjectId}/users/${encodedUserId}/sync`,
    data
  );
  if (!res.data) {
    throw new Error(`Failed to sync user ${userId} for project ${projectId}`);
  }
  return res.data;
};

// DELETE: Revoke a specific policy from a user
const revokeProjectUserPolicy = async ({ projectId, userId, policyId }: ProjectUserPolicyInput) => {
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedUserId = encodeURIComponent(userId);
  const encodedPolicyId = encodeURIComponent(policyId);
  const res = await silentApi<ApiResponse>(
    "DELETE",
    `/projects/${encodedProjectId}/users/${encodedUserId}/policies/${encodedPolicyId}`
  );
  if (!res.data) {
    throw new Error(`Failed to revoke policy ${policyId} for user ${userId}`);
  }
  return res;
};

// POST: Assign a specific policy to a user
const assignProjectUserPolicy = async ({ projectId, userId, policyId }: ProjectUserPolicyInput) => {
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedUserId = encodeURIComponent(userId);
  const res = await silentApi<ApiResponse>(
    "POST",
    `/projects/${encodedProjectId}/users/${encodedUserId}/policies`,
    {
      policy_id: policyId,
    }
  );
  if (!res.data) {
    throw new Error(`Failed to assign policy ${policyId} for user ${userId}`);
  }
  return res;
};

// Hook to provision project
export const useProvisionProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: provisionProject,
    onSuccess: (_data: any, projectId: any) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error provisioning project:", error);
    },
  });
};

// Hook to simulate provision
export const useSimulateProvision = () => {
  return useMutation({
    mutationFn: simulateProvision,
    onError: (error: unknown) => {
      console.error("Error simulating provision:", error);
    },
  });
};

// Hook to verify Zadara
export const useVerifyZadara = (id: Id, options: QueryOptionsWithEnabled = {}) => {
  return useQuery({
    queryKey: ["admin-project-zadara-verify", id],
    queryFn: () => verifyZadara(id),
    enabled: !!id && options.enabled !== false,
    staleTime: 1000 * 60 * 1,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to enable VPC
export const useEnableVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableVpc,
    onSuccess: (_data: any, projectId: any) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error enabling VPC:", error);
    },
  });
};

// Hook to sync project user
export const useSyncProjectUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncProjectUser,
    onSuccess: (_data: any, variables: { projectId: any }) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admin-project", variables.projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error syncing project user:", error);
    },
  });
};

// Hook to revoke project user policy
export const useRevokeProjectUserPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeProjectUserPolicy,
    onSuccess: (_data: any, variables: { projectId: any }) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admin-project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project-status", variables.projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error revoking project user policy:", error);
    },
  });
};

// Hook to assign a specific policy to a user
export const useAssignProjectUserPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignProjectUserPolicy,
    onSuccess: (_data: any, variables: { projectId: any }) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admin-project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project-status", variables.projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error assigning project user policy:", error);
    },
  });
};

// ============================================
// NETWORK EXPANSION HOOKS (Zadara Sync)
// ============================================

// GET: Fetch network status for a project
const fetchNetworkStatus = async (projectId: Id) => {
  const encodedId = encodeURIComponent(projectId);
  const res = await silentApi<ApiResponse>("GET", `/projects/${encodedId}/network/status`);
  return res;
};

// POST: Enable internet access (creates IGW + assigns edge network)
const enableInternetAccess = async (projectId: Id) => {
  const encodedId = encodeURIComponent(projectId);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/network/enable-internet`);
  return res;
};

// POST: Add subnet to project
const addSubnet = async ({ projectId, data }: ProjectNetworkInput) => {
  const encodedId = encodeURIComponent(projectId);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/network/subnets`, data);
  return res;
};

// POST: Add security group to project
const addSecurityGroup = async ({ projectId, data }: ProjectNetworkInput) => {
  const encodedId = encodeURIComponent(projectId);
  const res = await api<ApiResponse>(
    "POST",
    `/projects/${encodedId}/network/security-groups`,
    data
  );
  return res;
};

// Hook to fetch network status
export const useProjectNetworkStatus = (projectId: Id, options: QueryOptionsWithEnabled = {}) => {
  return useQuery({
    queryKey: ["admin-project-network-status", projectId],
    queryFn: () => fetchNetworkStatus(projectId),
    enabled: !!projectId && options.enabled !== false,
    staleTime: 0, // Always fetch fresh to avoid stale '0' counts
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to enable internet access
export const useEnableInternetAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableInternetAccess,
    onSuccess: (_data: any, projectId: any) => {
      void _data;
      // Invalidate network status and project queries
      queryClient.invalidateQueries({ queryKey: ["admin-project-network-status", projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project-status", projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error enabling internet access:", error);
    },
  });
};

// Hook to add subnet
export const useAddSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addSubnet,
    onSuccess: (_data: any, variables: { projectId: any }) => {
      void _data;
      queryClient.invalidateQueries({
        queryKey: ["admin-project-network-status", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-subnets"] });
    },
    onError: (error: unknown) => {
      console.error("Error adding subnet:", error);
    },
  });
};

// Hook to add security group
export const useAddSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addSecurityGroup,
    onSuccess: (_data: any, variables: { projectId: any }) => {
      void _data;
      queryClient.invalidateQueries({
        queryKey: ["admin-project-network-status", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-security-groups"] });
    },
    onError: (error: unknown) => {
      console.error("Error adding security group:", error);
    },
  });
};

// POST: Setup infrastructure (Infra Studio)
const setupInfrastructure = async ({ id, blueprint }: SetupInfrastructureInput) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/setup`, { blueprint });
  /*
    Expect response:
    {
       success: true,
       data: { blueprint: '...', status: 'provisioning' }
    }
  */
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
    onSuccess: (_data: any, variables: { id: any }) => {
      void _data;
      // Invalidate project to reflect 'provisioning' status
      queryClient.invalidateQueries({ queryKey: ["admin-project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-project-status", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: unknown) => {
      console.error("Error setting up infrastructure:", error);
    },
  });
};

// ============================================
// PROJECT STATUS SYNC HOOKS
// ============================================

// POST: Sync project status based on provisioning progress
const syncProjectStatus = async (id: Id) => {
  const encodedId = encodeURIComponent(id);
  const res = await api<ApiResponse>("POST", `/projects/${encodedId}/sync-status`);
  return res;
};

// POST: Bulk sync project statuses
const bulkSyncProjectStatus = async (identifiers: Id[] = []) => {
  const res = await api<ApiResponse>("POST", `/projects/bulk-sync-status`, { identifiers });
  return res;
};

// Hook to sync individual project status
export const useSyncProjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncProjectStatus,
    onSuccess: (_data: any, projectId: any) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-project-status", projectId] });
    },
    onError: (error: unknown) => {
      console.error("Error syncing project status:", error);
    },
  });
};

// Hook to bulk sync project statuses
export const useBulkSyncProjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkSyncProjectStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: unknown) => {
      console.error("Error bulk syncing project statuses:", error);
    },
  });
};
