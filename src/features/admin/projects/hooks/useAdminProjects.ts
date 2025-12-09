/**
 * Admin Projects Hooks
 * React Query hooks for admin-level project operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProjectApi } from "../api/projectApi";
import { queryKeys } from "@/shared/api/queryClient";
import type {
  ProjectFormData,
  ProjectUpdateData,
} from "@/shared/domains/projects/types/project.types";

/**
 * Fetch all projects (admin sees all)
 */
export const useAdminProjects = () => {
  return useQuery({
    queryKey: queryKeys.admin.projects.all(),
    queryFn: () => adminProjectApi.fetchAll(),
  });
};

/**
 * Fetch project by ID
 */
export const useAdminProject = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.admin.projects.detail(projectId),
    queryFn: () => adminProjectApi.fetchById(projectId),
    enabled: options?.enabled ?? Boolean(projectId),
  });
};

/**
 * Get project status
 */
export const useAdminProjectStatus = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.admin.projects.status(projectId),
    queryFn: () => adminProjectApi.getStatus(projectId),
    enabled: options?.enabled ?? Boolean(projectId),
  });
};

/**
 * Create project mutation
 */
export const useCreateAdminProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: ProjectFormData) => adminProjectApi.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};

/**
 * Update project mutation
 */
export const useUpdateAdminProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: ProjectUpdateData }) =>
      adminProjectApi.update(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.projects.detail(variables.projectId),
      });
    },
  });
};

/**
 * Delete project mutation
 */
export const useDeleteAdminProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => adminProjectApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};

/**
 * Archive project mutation
 */
export const useArchiveAdminProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => adminProjectApi.archive(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};

/**
 * Activate project mutation
 */
export const useActivateAdminProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => adminProjectApi.activate(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};

/**
 * Enable VPC mutation
 */
export const useEnableProjectVpc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => adminProjectApi.enableVpc(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.detail(projectId) });
    },
  });
};

/**
 * Update project members mutation
 */
export const useUpdateProjectMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userIds }: { projectId: string; userIds: number[] }) =>
      adminProjectApi.updateMembers(projectId, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.projects.detail(variables.projectId),
      });
    },
  });
};

/**
 * Bulk operations
 */
export const useBulkArchiveProjects = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectIds: string[]) => adminProjectApi.bulkArchive(projectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};

export const useBulkActivateProjects = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectIds: string[]) => adminProjectApi.bulkActivate(projectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};

export const useBulkDeleteProjects = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectIds: string[]) => adminProjectApi.bulkDelete(projectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects.all() });
    },
  });
};
