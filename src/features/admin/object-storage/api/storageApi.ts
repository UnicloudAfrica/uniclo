/**
 * Admin Object Storage API
 * API functions for admin-level object storage operations
 */

import { apiClient } from "@/shared/api/client";
import type {
  Bucket,
  BucketListResponse,
  BucketDetailResponse,
  BucketFormData,
  BucketUpdateData,
  ObjectListResponse,
  PresignedUrlOptions,
} from "@/shared/domains/object-storage/types/storage.types";

export const adminStorageApi = {
  /**
   * Fetch all buckets (admin sees all)
   */
  fetchAll: async (): Promise<BucketListResponse> => {
    const { data } = await apiClient.get<BucketListResponse>("/admin/object-storage");
    return data;
  },

  /**
   * Fetch bucket by ID
   */
  fetchById: async (bucketId: string): Promise<BucketDetailResponse> => {
    const { data } = await apiClient.get<BucketDetailResponse>(`/admin/object-storage/${bucketId}`);
    return data;
  },

  /**
   * Create bucket
   */
  create: async (bucketData: BucketFormData): Promise<Bucket> => {
    const { data } = await apiClient.post<Bucket>("/admin/object-storage", bucketData);
    return data;
  },

  /**
   * Update bucket
   */
  update: async (bucketId: string, bucketData: BucketUpdateData): Promise<Bucket> => {
    const { data } = await apiClient.put<Bucket>(`/admin/object-storage/${bucketId}`, bucketData);
    return data;
  },

  /**
   * Delete bucket
   */
  delete: async (bucketId: string, force: boolean = false): Promise<void> => {
    await apiClient.delete(`/admin/object-storage/${bucketId}`, {
      params: { force },
    });
  },

  /**
   * List objects in bucket
   */
  listObjects: async (bucketId: string, prefix?: string): Promise<ObjectListResponse> => {
    const { data } = await apiClient.get<ObjectListResponse>(
      `/admin/object-storage/${bucketId}/objects`,
      { params: { prefix } }
    );
    return data;
  },

  /**
   * Get presigned URL for upload
   */
  getUploadUrl: async (
    bucketId: string,
    key: string,
    options?: PresignedUrlOptions
  ): Promise<string> => {
    const { data } = await apiClient.post(`/admin/object-storage/${bucketId}/presigned-upload`, {
      key,
      ...options,
    });
    return data.url;
  },

  /**
   * Get presigned URL for download
   */
  getDownloadUrl: async (
    bucketId: string,
    key: string,
    options?: PresignedUrlOptions
  ): Promise<string> => {
    const { data } = await apiClient.post(`/admin/object-storage/${bucketId}/presigned-download`, {
      key,
      ...options,
    });
    return data.url;
  },

  /**
   * Delete object from bucket
   */
  deleteObject: async (bucketId: string, key: string): Promise<void> => {
    await apiClient.delete(`/admin/object-storage/${bucketId}/objects`, {
      data: { key },
    });
  },

  /**
   * Get bucket usage statistics
   */
  getUsageStats: async (bucketId: string): Promise<any> => {
    const { data } = await apiClient.get(`/admin/object-storage/${bucketId}/stats`);
    return data;
  },
};

export default adminStorageApi;
