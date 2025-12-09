/**
 * Admin Projects API
 * API functions for admin-level project operations
 */

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Project,
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectStatusResponse,
  ProjectFormData,
} from "@/shared/domains/projects/types/project.types";

export const adminProjectApi = {
  /**
   * Fetch all projects (admin has access to all)
   */
  fetchAll: async (): Promise<ProjectListResponse> => {
    const { data } = await apiClient.get<ProjectListResponse>(API_ENDPOINTS.ADMIN.PROJECTS);
    return data;
  },

  /**
   * Fetch project by ID
   */
  fetchById: async (projectId: string): Promise<ProjectDetailResponse> => {
    const { data } = await apiClient.get<ProjectDetailResponse>(
      API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId)
    );
    return data;
  },

  /**
   * Get project status
   */
  getStatus: async (projectId: string): Promise<ProjectStatusResponse> => {
    const { data } = await apiClient.get<ProjectStatusResponse>(
      API_ENDPOINTS.ADMIN.PROJECT_STATUS(projectId)
    );
    return data;
  },

  /**
   * Create new project
   */
  create: async (projectData: ProjectFormData): Promise<Project> => {
    const { data } = await apiClient.post<Project>(API_ENDPOINTS.ADMIN.PROJECTS, projectData);
    return data;
  },

  /**
   * Update project
   */
  update: async (projectId: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
    const { data } = await apiClient.put<Project>(
      API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId),
      projectData
    );
    return data;
  },

  /**
   * Delete project
   */
  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId));
  },

  /**
   * Provision project
   */
  provision: async (projectId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.ADMIN.PROJECT_PROVISION(projectId));
  },

  /**
   * Enable VPC for project
   */
  enableVpc: async (projectId: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId)}/enable-vpc`);
  },

  /**
   * Archive project
   */
  archive: async (projectId: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId)}/archive`);
  },

  /**
   * Activate project
   */
  activate: async (projectId: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId)}/activate`);
  },

  /**
   * Bulk archive projects
   */
  bulkArchive: async (projectIds: string[]): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.PROJECTS}/bulk-archive`, {
      project_ids: projectIds,
    });
  },

  /**
   * Bulk activate projects
   */
  bulkActivate: async (projectIds: string[]): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.PROJECTS}/bulk-activate`, {
      project_ids: projectIds,
    });
  },

  /**
   * Bulk delete projects
   */
  bulkDelete: async (projectIds: string[]): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.PROJECTS}/bulk-delete`, {
      project_ids: projectIds,
    });
  },

  /**
   * Bulk export projects
   */
  bulkExport: async (projectIds: string[]): Promise<Blob> => {
    const { data } = await apiClient.post(
      `${API_ENDPOINTS.ADMIN.PROJECTS}/bulk-export`,
      { project_ids: projectIds },
      { responseType: "blob" }
    );
    return data;
  },

  /**
   * Update project members
   */
  updateMembers: async (projectId: string, userIds: number[]): Promise<void> => {
    await apiClient.put(`${API_ENDPOINTS.ADMIN.PROJECT_BY_ID(projectId)}`, {
      user_ids: userIds,
    });
  },

  /**
   * Get project infrastructure status
   */
  getInfrastructureStatus: async (projectId: string) => {
    const { data } = await apiClient.get(`/admin/project-infrastructure/${projectId}`);
    return data;
  },
};

export default adminProjectApi;
