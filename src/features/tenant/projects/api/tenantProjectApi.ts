/**
 * Tenant Projects API
 * API functions for tenant-level project operations
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

export const tenantProjectApi = {
  /**
   * Fetch all tenant's projects
   */
  fetchAll: async (): Promise<ProjectListResponse> => {
    const { data } = await apiClient.get<ProjectListResponse>(API_ENDPOINTS.TENANT.PROJECTS);
    return data;
  },

  /**
   * Fetch project by ID
   */
  fetchById: async (projectId: string): Promise<ProjectDetailResponse> => {
    const { data } = await apiClient.get<ProjectDetailResponse>(
      API_ENDPOINTS.TENANT.PROJECT_BY_ID(projectId)
    );
    return data;
  },

  /**
   * Get project status
   */
  getStatus: async (projectId: string): Promise<ProjectStatusResponse> => {
    const { data } = await apiClient.get<ProjectStatusResponse>(
      `${API_ENDPOINTS.TENANT.PROJECT_BY_ID(projectId)}/status`
    );
    return data;
  },

  /**
   * Create new project
   */
  create: async (projectData: ProjectFormData): Promise<Project> => {
    const { data } = await apiClient.post<Project>(API_ENDPOINTS.TENANT.PROJECTS, projectData);
    return data;
  },

  /**
   * Update project
   */
  update: async (projectId: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
    const { data } = await apiClient.put<Project>(
      API_ENDPOINTS.TENANT.PROJECT_BY_ID(projectId),
      projectData
    );
    return data;
  },

  /**
   * Delete project
   */
  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TENANT.PROJECT_BY_ID(projectId));
  },

  /**
   * Archive project
   */
  archive: async (projectId: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.TENANT.PROJECT_BY_ID(projectId)}/archive`);
  },

  /**
   * Activate project
   */
  activate: async (projectId: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.TENANT.PROJECT_BY_ID(projectId)}/activate`);
  },

  /**
   * Bulk export projects
   */
  bulkExport: async (projectIds: string[]): Promise<Blob> => {
    const { data } = await apiClient.post(
      `${API_ENDPOINTS.TENANT.PROJECTS}/bulk-export`,
      { project_ids: projectIds },
      { responseType: "blob" }
    );
    return data;
  },
};

export default tenantProjectApi;
