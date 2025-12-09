/**
 * Client Projects API
 * API functions for client-level project operations
 */

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Project,
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectFormData,
} from "@/shared/domains/projects/types/project.types";

export const clientProjectApi = {
  /**
   * Fetch all client's projects
   */
  fetchAll: async (): Promise<ProjectListResponse> => {
    const { data } = await apiClient.get<ProjectListResponse>(API_ENDPOINTS.CLIENT.PROJECTS);
    return data;
  },

  /**
   * Fetch project by ID
   */
  fetchById: async (projectId: string): Promise<ProjectDetailResponse> => {
    const { data } = await apiClient.get<ProjectDetailResponse>(
      API_ENDPOINTS.CLIENT.PROJECT_BY_ID(projectId)
    );
    return data;
  },

  /**
   * Create new project
   */
  create: async (projectData: ProjectFormData): Promise<Project> => {
    const { data } = await apiClient.post<Project>(API_ENDPOINTS.CLIENT.PROJECTS, projectData);
    return data;
  },

  /**
   * Update project
   */
  update: async (projectId: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
    const { data } = await apiClient.put<Project>(
      API_ENDPOINTS.CLIENT.PROJECT_BY_ID(projectId),
      projectData
    );
    return data;
  },

  /**
   * Delete project
   */
  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CLIENT.PROJECT_BY_ID(projectId));
  },

  /**
   * Bulk export projects
   */
  bulkExport: async (projectIds: string[]): Promise<Blob> => {
    const { data } = await apiClient.post(
      `${API_ENDPOINTS.CLIENT.PROJECTS}/bulk-export`,
      { project_ids: projectIds },
      { responseType: "blob" }
    );
    return data;
  },
};

export default clientProjectApi;
