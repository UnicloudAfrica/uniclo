/**
 * Admin Modules API
 */

import { apiClient } from "@/shared/api/client";
import type {
  Module,
  ModuleFormData,
  ModuleSubscription,
} from "@/shared/domains/modules/types/module.types";

export const adminModuleApi = {
  fetchAll: async () => {
    const { data } = await apiClient.get("/admin/modules");
    return data;
  },

  fetchById: async (moduleId: number): Promise<Module> => {
    const { data } = await apiClient.get<Module>(`/admin/modules/${moduleId}`);
    return data;
  },

  create: async (moduleData: ModuleFormData): Promise<Module> => {
    const { data } = await apiClient.post<Module>("/admin/modules", moduleData);
    return data;
  },

  update: async (moduleId: number, moduleData: Partial<ModuleFormData>): Promise<Module> => {
    const { data } = await apiClient.put<Module>(`/admin/modules/${moduleId}`, moduleData);
    return data;
  },

  delete: async (moduleId: number): Promise<void> => {
    await apiClient.delete(`/admin/modules/${moduleId}`);
  },

  enable: async (moduleId: number): Promise<Module> => {
    const { data } = await apiClient.post<Module>(`/admin/modules/${moduleId}/enable`);
    return data;
  },

  disable: async (moduleId: number): Promise<Module> => {
    const { data } = await apiClient.post<Module>(`/admin/modules/${moduleId}/disable`);
    return data;
  },

  fetchSubscriptions: async (moduleId?: number): Promise<ModuleSubscription[]> => {
    const { data } = await apiClient.get<ModuleSubscription[]>("/admin/module-subscriptions", {
      params: { module_id: moduleId },
    });
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get("/admin/modules/stats");
    return data;
  },
};

export default adminModuleApi;
