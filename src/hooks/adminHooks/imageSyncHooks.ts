import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

interface ImageSyncResult {
  images_synced: number;
  products_created: number;
  tenant_prices_created: number;
  stale_marked: number;
}

interface ImageSyncResponse {
  message: string;
  data: ImageSyncResult;
}

interface ImageSyncComparison {
  region: string;
  provider: string;
  total_local: number;
  active: number;
  inactive: number;
  missing_product: number;
}

interface ImageSyncComparisonResponse {
  data: ImageSyncComparison;
}

interface TriggerSyncPayload {
  region: string;
  provider?: string;
  project_name?: string | null;
  only_active?: boolean;
}

const triggerImageSync = async (payload: TriggerSyncPayload): Promise<ImageSyncResponse> => {
  const res = await api("POST", "/inventory/image-sync", payload);
  if (!res) {
    throw new Error("Failed to trigger image sync");
  }
  return res as ImageSyncResponse;
};

const fetchImageSyncComparison = async (
  region: string,
  provider = "zadara"
): Promise<ImageSyncComparison> => {
  const params = new URLSearchParams({ region, provider });
  const res = await silentApi("GET", `/inventory/image-sync/comparison?${params.toString()}`);
  if (!res) {
    throw new Error("Failed to fetch image sync comparison");
  }
  return (res as ImageSyncComparisonResponse).data;
};

export const useTriggerImageSync = () => {
  const queryClient = useQueryClient();
  return useMutation<ImageSyncResponse, Error, TriggerSyncPayload>({
    mutationFn: triggerImageSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["osImages"] });
      queryClient.invalidateQueries({ queryKey: ["imageSyncComparison"] });
    },
    onError: (error: Error) => {
      logger.error("Error triggering image sync:", error);
    },
  });
};

export const useImageSyncComparison = (
  region: string,
  provider = "zadara",
  options: any = {}
) => {
  return useQuery<ImageSyncComparison>({
    queryKey: ["imageSyncComparison", region, provider],
    queryFn: () => fetchImageSyncComparison(region, provider),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};
