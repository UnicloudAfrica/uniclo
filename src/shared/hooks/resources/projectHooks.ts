/**
 * Project Hooks — Context-aware hooks for projects.
 *
 * Replaces duplicated project hooks across admin/tenant/client.
 * Uses `useApiContext()` to route requests to the correct API client.
 *
 * Exports:
 *   - Basic CRUD hooks (via createResourceHooks factory)
 *   - Extended hooks shared across 2+ roles (status, network, infra setup, etc.)
 *   - Admin-only hooks (provision, zadara, user policies, sync, etc.)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import logger from "@/utils/logger";

type AnyRecord = Record<string, unknown>;

// ─── Basic CRUD via factory ──────────────────────────────────────

const projectHooks = createResourceHooks({
  resourcePath: "projects",
  queryKeyBase: "projects",
  dataKey: null, // Return full response (with .data and .meta) for backward compat
});

export const {
  useFetchList: useFetchProjects,
  useFetchById: useFetchProjectById,
  useCreate: useCreateProject,
  useUpdate: useUpdateProject,
  useDelete: useDeleteProject,
  useSync: useSyncProjects,
  queryKeys: projectKeys,
} = projectHooks;

// ─── Project Members ─────────────────────────────────────────────

/** Update project members (add/remove users) — all roles */
export const useUpdateProjectMembers = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ identifier, user_ids }: { identifier: string; user_ids: number[] }) => {
      const encodedId = encodeURIComponent(identifier);
      return entry.toastApi.put<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/members`, {
        user_ids,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, variables.identifier),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error updating project members:", error);
    },
  });
};

/** Invite a user to a project by email — all roles */
export const useInviteProjectMember = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      name,
      email,
    }: {
      identifier: string;
      name: string;
      email: string;
    }) => {
      const encodedId = encodeURIComponent(identifier);
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/invite`, {
        name,
        email,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, variables.identifier),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error inviting project member:", error);
    },
  });
};

// ─── Extended Query Keys ─────────────────────────────────────────

export const projectExtendedKeys = {
  ...createQueryKeys("projects"),
  status: (context: string, id: string | number) => ["project-status", context, id] as const,
  networkStatus: (context: string, id: string | number) =>
    ["project-network-status", context, id] as const,
  membershipSuggestions: (context: string, params: AnyRecord) =>
    ["project-memberships", context, params] as const,
};

// ─── Shared Hooks (all roles) ────────────────────────────────────

/** Fetch project status (provisioning + infrastructure checklist) — all roles */
export const useProjectStatus = (id: string | number, options: AnyRecord = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: projectExtendedKeys.status(context, id),
    queryFn: async () => {
      const encodedId = encodeURIComponent(String(id));
      const res = await entry.silentApi.get<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/status`
      );
      return res;
    },
    enabled: !!id && options.enabled !== false,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** Fetch project network status — all roles */
export const useProjectNetworkStatus = (id: string | number, options: AnyRecord = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: projectExtendedKeys.networkStatus(context, id),
    queryFn: async () => {
      const encodedId = encodeURIComponent(String(id));
      return entry.silentApi.get<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/network/status`
      );
    },
    enabled: !!id && options.enabled !== false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** Enable internet access for a project — all roles */
export const useEnableInternetAccess = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/network/enable-internet`
      );
    },
    onSuccess: (_data: unknown, id: string | number) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.networkStatus(context, id),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, id),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error enabling internet access:", error);
    },
  });
};

/** Setup project infrastructure (Infra Studio) — all roles */
export const useSetupProjectInfrastructure = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, blueprint }: { id: string | number; blueprint: unknown }) => {
      const encodedId = encodeURIComponent(String(id));
      const res = await entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/setup`,
        { blueprint }
      );
      return res;
    },
    onSuccess: (_data: unknown, variables: { id: string | number }) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error setting up infrastructure:", error);
    },
  });
};

/** Fetch project membership suggestions — admin + client roles */
export const useProjectMembershipSuggestions = (
  params: AnyRecord = {},
  options: AnyRecord = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const query = new URLSearchParams();
  if (params.scope) query.append("scope", params.scope);
  if (params.tenant_id) query.append("tenant_id", params.tenant_id);
  if (params.client_id) query.append("client_id", params.client_id);

  const qs = query.toString();
  const url = `${entry.urlPrefix}/project-memberships/suggestions${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: projectExtendedKeys.membershipSuggestions(context, params),
    queryFn: async () => {
      const res = await entry.silentApi.get<AnyRecord>(url);
      return res?.data ?? res;
    },
    enabled: options.enabled !== false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** Enable VPC for project — admin + tenant roles */
export const useEnableProjectVpc = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/enable-vpc`);
    },
    onSuccess: (_data: unknown, _id: string | number) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error enabling VPC:", error);
    },
  });
};

// ─── Admin-Only Hooks ────────────────────────────────────────────
// These use the admin API client directly because they only exist
// in the admin context and don't need context-awareness.

/** Provision project infrastructure — admin only */
export const useProvisionProject = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/provision`);
    },
    onSuccess: (_data: unknown, _id: string | number) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error provisioning project:", error);
    },
  });
};

/** Simulate provision — admin only */
export const useSimulateProvision = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/provision-simulated`
      );
    },
    onError: (error: unknown) => {
      logger.error("Error simulating provision:", error);
    },
  });
};

/** Verify Zadara connection — admin only */
export const useVerifyZadara = (id: string | number, options: AnyRecord = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["project-zadara-verify", context, id],
    queryFn: async () => {
      const encodedId = encodeURIComponent(String(id));
      return entry.silentApi.get<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/verify-zadara`
      );
    },
    enabled: !!id && options.enabled !== false,
    staleTime: 1000 * 60 * 1,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** Sync project user — admin only */
export const useSyncProjectUser = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      data = {},
    }: {
      projectId: string | number;
      userId: string | number;
      data?: AnyRecord;
    }) => {
      const ep = encodeURIComponent(String(projectId));
      const eu = encodeURIComponent(String(userId));
      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${ep}/users/${eu}/sync`,
        data
      );
    },
    onSuccess: (_data: unknown, _variables: { projectId: string | number }) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error syncing project user:", error);
    },
  });
};

/** Revoke a project user policy — admin only */
export const useRevokeProjectUserPolicy = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      policyId,
    }: {
      projectId: string | number;
      userId: string | number;
      policyId: string | number;
    }) => {
      const ep = encodeURIComponent(String(projectId));
      const eu = encodeURIComponent(String(userId));
      const epl = encodeURIComponent(String(policyId));
      return entry.silentApi.delete<AnyRecord>(
        `${entry.urlPrefix}/projects/${ep}/users/${eu}/policies/${epl}`
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error revoking project user policy:", error);
    },
  });
};

/** Assign a project user policy — admin only */
export const useAssignProjectUserPolicy = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      policyId,
    }: {
      projectId: string | number;
      userId: string | number;
      policyId: string | number;
    }) => {
      const ep = encodeURIComponent(String(projectId));
      const eu = encodeURIComponent(String(userId));
      return entry.silentApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${ep}/users/${eu}/policies`,
        { policy_id: policyId }
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error assigning project user policy:", error);
    },
  });
};

/** Add subnet to project network — admin only */
export const useAddProjectSubnet = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string | number; data: AnyRecord }) => {
      const encodedId = encodeURIComponent(String(projectId));
      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/network/subnets`,
        data
      );
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number }) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.networkStatus(context, variables.projectId),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error adding subnet:", error);
    },
  });
};

/** Add security group to project network — admin only */
export const useAddProjectSecurityGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string | number; data: AnyRecord }) => {
      const encodedId = encodeURIComponent(String(projectId));
      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${encodedId}/network/security-groups`,
        data
      );
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number }) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.networkStatus(context, variables.projectId),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error adding security group:", error);
    },
  });
};

/** Sync individual project status — admin only */
export const useSyncProjectStatus = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/sync-status`);
    },
    onSuccess: (_data: unknown, id: string | number) => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.status(context, id),
      });
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error syncing project status:", error);
    },
  });
};

/** Bulk sync project statuses — admin only */
export const useBulkSyncProjectStatus = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (identifiers: (string | number)[] = []) => {
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/bulk-sync-status`, {
        identifiers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error bulk syncing project statuses:", error);
    },
  });
};

// ─── Tenant-Only Hooks ───────────────────────────────────────────

/** Archive a project — tenant only */
export const useArchiveProject = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error archiving project:", error);
    },
  });
};

/** Activate a project — tenant only */
export const useActivateProject = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${encodedId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectExtendedKeys.all(context),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error activating project:", error);
    },
  });
};

export default projectHooks;
