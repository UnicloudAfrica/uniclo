import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

// ---------- Types ----------

interface DiscoveredImageRegions {
  [region: string]: "active" | "available";
}

interface DiscoveredImageEntry {
  image: {
    distro: string;
    version: string;
    arch: string;
    disk_format: string;
    download_url: string;
    license_model: string;
    file_size_bytes: number | null;
  };
  regions: DiscoveredImageRegions;
}

interface AggregatedRequest {
  distro: string;
  version: string;
  arch: string;
  region: string;
  total_requests: number;
  unique_tenants: number;
  status: string;
  latest_request: string;
}

interface ImportPayload {
  distro: string;
  version: string;
  arch?: string;
  region: string;
}

// ---------- Admin: Discovery ----------

const fetchDiscoveredImages = async (distro?: string): Promise<DiscoveredImageEntry[]> => {
  const params = distro ? `?distro=${distro}` : "";
  const res = await silentApi("GET", `/inventory/image-discovery${params}`);
  return (res as any)?.data ?? [];
};

export const useDiscoveredImages = (distro?: string, options: any = {}) => {
  return useQuery<DiscoveredImageEntry[]>({
    queryKey: ["discoveredImages", distro],
    queryFn: () => fetchDiscoveredImages(distro),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useImportUpstreamImage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, ImportPayload>({
    mutationFn: (payload) => api("POST", "/inventory/image-discovery/import", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discoveredImages"] });
      queryClient.invalidateQueries({ queryKey: ["osImages"] });
    },
    onError: (error: Error) => {
      logger.error("Error importing upstream image:", error);
    },
  });
};

const fetchDiscoverySources = async () => {
  const res = await silentApi("GET", "/inventory/image-discovery/sources");
  return (res as any)?.data ?? [];
};

export const useDiscoverySources = (options: any = {}) => {
  return useQuery({
    queryKey: ["discoverySources"],
    queryFn: fetchDiscoverySources,
    staleTime: 1000 * 60 * 30,
    ...options,
  });
};

// ---------- Admin: Image Requests ----------

const fetchImageRequests = async (): Promise<AggregatedRequest[]> => {
  const res = await silentApi("GET", "/inventory/image-requests");
  return (res as any)?.data ?? [];
};

export const useImageRequests = (options: any = {}) => {
  return useQuery<AggregatedRequest[]>({
    queryKey: ["adminImageRequests"],
    queryFn: fetchImageRequests,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useApproveImageRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (identifier) => api("POST", `/inventory/image-requests/${identifier}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminImageRequests"] });
      queryClient.invalidateQueries({ queryKey: ["discoveredImages"] });
    },
    onError: (error: Error) => {
      logger.error("Error approving image request:", error);
    },
  });
};

export const useBulkApproveImageRequests = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string[]>({
    mutationFn: (identifiers) =>
      api("POST", "/inventory/image-requests/bulk-approve", { identifiers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminImageRequests"] });
    },
    onError: (error: Error) => {
      logger.error("Error bulk approving image requests:", error);
    },
  });
};

export const useRejectImageRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { identifier: string; reason?: string }>({
    mutationFn: ({ identifier, reason }) =>
      api("POST", `/inventory/image-requests/${identifier}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminImageRequests"] });
    },
    onError: (error: Error) => {
      logger.error("Error rejecting image request:", error);
    },
  });
};
