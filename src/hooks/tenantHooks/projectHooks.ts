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
  useEnableProjectVpc,
  useArchiveProject,
  useActivateProject,
} from "@/shared/hooks/resources/projectHooks";

// ── Re-export CRUD hooks with tenant-prefixed names ───────────
/** @deprecated Use useFetchProjects from shared/hooks/resources/projectHooks */
export const useFetchTenantProjects = (params: any = {}, options: any = {}) =>
  _useFetchProjects({ extra: params }, options);

/** @deprecated Use useFetchProjectById from shared/hooks/resources/projectHooks */
export const useFetchTenantProjectById = (id: string, options: any = {}) =>
  _useFetchProjectById(id, options);

/** @deprecated Use useProjectStatus from shared/hooks/resources/projectHooks */
export const useTenantProjectStatus = useProjectStatus;

/** @deprecated Use useCreateProject from shared/hooks/resources/projectHooks */
export const useCreateTenantProject = _useCreateProject;

/** @deprecated Use useUpdateProject from shared/hooks/resources/projectHooks */
export const useUpdateTenantProject = _useUpdateProject;

/** @deprecated Use useDeleteProject from shared/hooks/resources/projectHooks */
export const useDeleteTenantProject = () => {
  const mutation = _useDeleteProject();
  return {
    ...mutation,
    mutate: (id: any, options?: any) => mutation.mutate({ id }, options),
    mutateAsync: (id: any, options?: any) => mutation.mutateAsync({ id }, options),
  };
};

/** @deprecated Use useArchiveProject from shared/hooks/resources/projectHooks */
export const useArchiveTenantProject = useArchiveProject;

/** @deprecated Use useActivateProject from shared/hooks/resources/projectHooks */
export const useActivateTenantProject = useActivateProject;

/** @deprecated Use useEnableProjectVpc from shared/hooks/resources/projectHooks */
export const useEnableTenantVpc = useEnableProjectVpc;

/** @deprecated Use useProjectNetworkStatus from shared/hooks/resources/projectHooks */
export const useTenantProjectNetworkStatus = useProjectNetworkStatus;

/** @deprecated Use useEnableInternetAccess from shared/hooks/resources/projectHooks */
export const useTenantEnableInternetAccess = useEnableInternetAccess;

/** @deprecated Use useSetupProjectInfrastructure from shared/hooks/resources/projectHooks */
export const useSetupInfrastructure = useSetupProjectInfrastructure;
