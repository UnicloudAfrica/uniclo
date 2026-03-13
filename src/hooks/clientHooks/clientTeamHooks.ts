/**
 * Client Team Hooks — Manage team members for the client dashboard.
 *
 * Provides React Query hooks for fetching, inviting, updating, deleting
 * team members, and setting per-member permissions.
 *
 * Uses the apiRegistry pattern (consistent with shared/hooks/resources/projectHooks)
 * rather than the legacy clientSilentApi import.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRegistry } from "@/shared/api/apiRegistry";
import logger from "@/utils/logger";
import type { ClientTeamMember, UserPermissionOverride } from "@/types/rbac";

// ── Types ────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>;

interface TeamListResponse {
  data: ClientTeamMember[];
  meta?: AnyRecord;
}

// ── Constants ────────────────────────────────────────────────────────

const CONTEXT = "client" as const;
const entry = apiRegistry[CONTEXT];
const BASE_PATH = `${entry.urlPrefix}/team`;

// ── Query Keys ───────────────────────────────────────────────────────

export const clientTeamKeys = {
  all: [CONTEXT, "team"] as const,
  list: () => [...clientTeamKeys.all, "list"] as const,
  detail: (id: number) => [...clientTeamKeys.all, "detail", id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────

/**
 * Fetch the full client team list.
 * GET /business/team
 */
export const useFetchClientTeam = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: clientTeamKeys.list(),
    queryFn: async (): Promise<TeamListResponse> => {
      const res = await entry.silentApi.get<TeamListResponse>(BASE_PATH);
      return res;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: options.enabled,
  });
};

/**
 * Invite a new member to the client team.
 * POST /business/team/invite
 */
export const useInviteClientTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      permissions?: string[];
    }) => {
      const body: AnyRecord = { name: payload.name, email: payload.email };
      if (payload.permissions) {
        body.permissions = payload.permissions;
      }
      return entry.toastApi.post<AnyRecord>(`${BASE_PATH}/invite`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientTeamKeys.all });
    },
    onError: (error: unknown) => {
      logger.error("Error inviting team member:", error);
    },
  });
};

/**
 * Update an existing client team member.
 * PATCH /business/team/{id}
 */
export const useUpdateClientTeamMember = (memberId: number) => {
  const queryClient = useQueryClient();
  const encodedId = encodeURIComponent(String(memberId));

  return useMutation({
    mutationFn: async (data: AnyRecord) => {
      return entry.toastApi.patch<AnyRecord>(`${BASE_PATH}/${encodedId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientTeamKeys.all });
      queryClient.invalidateQueries({ queryKey: clientTeamKeys.detail(memberId) });
    },
    onError: (error: unknown) => {
      logger.error("Error updating team member:", error);
    },
  });
};

/**
 * Delete a client team member.
 * DELETE /business/team/{id}
 */
export const useDeleteClientTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.delete<AnyRecord>(`${BASE_PATH}/${encodedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientTeamKeys.all });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting team member:", error);
    },
  });
};

/**
 * Set permissions for a client team member.
 * PUT /business/team/{id}/permissions
 */
export const useSetClientTeamPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      overrides,
    }: {
      id: number;
      overrides: UserPermissionOverride[];
    }) => {
      const encodedId = encodeURIComponent(String(id));
      return entry.toastApi.put<AnyRecord>(`${BASE_PATH}/${encodedId}/permissions`, {
        overrides,
      });
    },
    onSuccess: (_data: unknown, variables: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: clientTeamKeys.all });
      queryClient.invalidateQueries({ queryKey: clientTeamKeys.detail(variables.id) });
    },
    onError: (error: unknown) => {
      logger.error("Error setting team permissions:", error);
    },
  });
};
