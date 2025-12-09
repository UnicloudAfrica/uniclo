/**
 * Admin Regions API
 */

import { apiClient } from "@/shared/api/client";
import type {
  Region,
  RegionListResponse,
  RegionDetailResponse,
  RegionFormData,
} from "@/shared/domains/regions/types/region.types";

export const adminRegionApi = {
  fetchAll: async (): Promise<RegionListResponse> => {
    const { data } = await apiClient.get<RegionListResponse>("/admin/regions");
    return data;
  },

  fetchById: async (regionId: number): Promise<RegionDetailResponse> => {
    const { data } = await apiClient.get<RegionDetailResponse>(`/admin/regions/${regionId}`);
    return data;
  },

  create: async (regionData: RegionFormData): Promise<Region> => {
    const { data } = await apiClient.post<Region>("/admin/regions", regionData);
    return data;
  },

  update: async (regionId: number, regionData: Partial<RegionFormData>): Promise<Region> => {
    const { data } = await apiClient.put<Region>(`/admin/regions/${regionId}`, regionData);
    return data;
  },

  delete: async (regionId: number): Promise<void> => {
    await apiClient.delete(`/admin/regions/${regionId}`);
  },

  enable: async (regionId: number): Promise<Region> => {
    const { data } = await apiClient.post<Region>(`/admin/regions/${regionId}/enable`);
    return data;
  },

  disable: async (regionId: number): Promise<Region> => {
    const { data } = await apiClient.post<Region>(`/admin/regions/${regionId}/disable`);
    return data;
  },

  setDefault: async (regionId: number): Promise<Region> => {
    const { data } = await apiClient.post<Region>(`/admin/regions/${regionId}/set-default`);
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get("/admin/regions/stats");
    return data;
  },
};

export default adminRegionApi;
