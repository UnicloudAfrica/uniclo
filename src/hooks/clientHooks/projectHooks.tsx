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
} from "@/shared/hooks/resources/projectHooks";

// ── Types kept for backward compat ────────────────────────────
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

// ── Re-export CRUD hooks with client-prefixed names ───────────
/** @deprecated Use useFetchProjects from shared/hooks/resources/projectHooks */
export const useFetchClientProjects = (params: any = {}, options: any = {}) =>
  _useFetchProjects({ extra: params }, options);

/** @deprecated Use useFetchProjectById from shared/hooks/resources/projectHooks */
export const useFetchClientProjectById = (id: string | number, options: any = {}) =>
  _useFetchProjectById(id, options);

/** @deprecated Use useProjectMembershipSuggestions from shared/hooks/resources/projectHooks */
export const useClientProjectMembershipSuggestions = useProjectMembershipSuggestions;

/** @deprecated Use useProjectStatus from shared/hooks/resources/projectHooks */
export const useClientProjectStatus = useProjectStatus;

/** @deprecated Use useProjectNetworkStatus from shared/hooks/resources/projectHooks */
export const useClientProjectNetworkStatus = useProjectNetworkStatus;

/** @deprecated Use useCreateProject from shared/hooks/resources/projectHooks */
export const useCreateClientProject = _useCreateProject;

/** @deprecated Use useEnableInternetAccess from shared/hooks/resources/projectHooks */
export const useClientEnableInternetAccess = useEnableInternetAccess;

/** @deprecated Use useUpdateProject from shared/hooks/resources/projectHooks */
export const useUpdateClientProject = _useUpdateProject;

/** @deprecated Use useDeleteProject from shared/hooks/resources/projectHooks */
export const useDeleteClientProject = () => {
  const mutation = _useDeleteProject();
  return {
    ...mutation,
    mutate: (id: any, options?: any) => mutation.mutate({ id }, options),
    mutateAsync: (id: any, options?: any) => mutation.mutateAsync({ id }, options),
  };
};

/** @deprecated Use useSetupProjectInfrastructure from shared/hooks/resources/projectHooks */
export const useSetupInfrastructure = useSetupProjectInfrastructure;
