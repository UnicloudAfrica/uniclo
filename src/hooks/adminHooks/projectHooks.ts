/**
 * @deprecated Import from "shared/hooks/resources/projectHooks" instead.
 * This file is a backward-compatibility shim.
 */
import {
  useFetchProjects as _useFetchProjects,
  useFetchProjectById as _useFetchProjectById,
  useCreateProject as _useCreateProject,
  useUpdateProject as _useUpdateProject,
  useDeleteProject as _useDeleteProject,
  useProjectStatus,
  useProjectNetworkStatus,
  useEnableInternetAccess,
  useSetupProjectInfrastructure,
  useProjectMembershipSuggestions,
  useEnableProjectVpc,
  useProvisionProject,
  useSimulateProvision,
  useVerifyZadara,
  useSyncProjectUser,
  useRevokeProjectUserPolicy,
  useAssignProjectUserPolicy,
  useAddProjectSubnet,
  useAddProjectSecurityGroup,
  useSyncProjectStatus,
  useBulkSyncProjectStatus,
  useUpdateProjectMembers,
  useInviteProjectMember,
  projectExtendedKeys,
} from "@/shared/hooks/resources/projectHooks";
import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

// ── Types kept for backward compat ────────────────────────────
export type ProjectStatusResponse = Record<string, unknown> & { project?: Record<string, unknown> };
export type SetupInfrastructureInput = { id: string | number; blueprint: unknown };

// ── Re-export CRUD hooks (signatures match) ───────────────────
/** @deprecated Use useFetchProjects from shared/hooks/resources/projectHooks */
export const useFetchProjects = (
  params: Record<string, string | number | boolean> = {},
  options: Omit<UseQueryOptions<any, any, any, any>, "queryKey" | "queryFn"> = {}
) => _useFetchProjects({ extra: params }, options);

/** @deprecated Use useFetchProjectById from shared/hooks/resources/projectHooks */
export const useFetchProjectById = _useFetchProjectById;

/** @deprecated Use useCreateProject from shared/hooks/resources/projectHooks */
export const useCreateProject = _useCreateProject;

/** @deprecated Use useUpdateProject from shared/hooks/resources/projectHooks */
export const useUpdateProject = _useUpdateProject;

/** @deprecated Use useDeleteProject from shared/hooks/resources/projectHooks */
export const useDeleteProject = () => {
  const mutation = _useDeleteProject();
  return {
    ...mutation,
    mutate: (id: string | number, options?: UseMutationOptions<any, any, any, any>) =>
      mutation.mutate({ id }, options),
    mutateAsync: (id: string | number, options?: UseMutationOptions<any, any, any, any>) =>
      mutation.mutateAsync({ id }, options),
  };
};

// ── Re-export extended hooks ──────────────────────────────────
export {
  useProjectStatus,
  useProjectNetworkStatus,
  useEnableInternetAccess,
  useProjectMembershipSuggestions,
  useProvisionProject,
  useSimulateProvision,
  useVerifyZadara,
  useSyncProjectUser,
  useRevokeProjectUserPolicy,
  useAssignProjectUserPolicy,
  useSyncProjectStatus,
  useBulkSyncProjectStatus,
  useUpdateProjectMembers,
  useInviteProjectMember,
  projectExtendedKeys,
};

/** @deprecated Use useEnableProjectVpc from shared/hooks/resources/projectHooks */
export const useEnableVpc = useEnableProjectVpc;

/** @deprecated Use useSetupProjectInfrastructure from shared/hooks/resources/projectHooks */
export const useSetupInfrastructure = useSetupProjectInfrastructure;

/** @deprecated Use useAddProjectSubnet from shared/hooks/resources/projectHooks */
export const useAddSubnet = useAddProjectSubnet;

/** @deprecated Use useAddProjectSecurityGroup from shared/hooks/resources/projectHooks */
export const useAddSecurityGroup = useAddProjectSecurityGroup;
