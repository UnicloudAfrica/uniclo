import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import logger from "@/utils/logger";

// ---------- Types ----------

interface AvailableImage {
  distro: string;
  version: string;
  arch: string;
  already_available: boolean;
  request_status: string | null;
}

interface ImageRequestRecord {
  id: number;
  identifier: string;
  distro: string;
  version: string;
  arch: string;
  region: string;
  status: string;
  created_at: string;
}

interface SubmitRequestPayload {
  distro: string;
  version: string;
  arch?: string;
  region: string;
}

// ---------- Customer: Available Images for Request ----------

const fetchAvailableImages = async (region: string): Promise<AvailableImage[]> => {
  const res = await api.get<{ data: AvailableImage[] }>(
    `/image-requests/available?region=${region}`,
    { silent: true }
  );
  return res?.data ?? [];
};

export const useAvailableImages = (region: string, options: Record<string, unknown> = src/hooks/imageRequestHooks.ts) => {
  return useQuery<AvailableImage[]>({
    queryKey: ["availableImages", region],
    queryFn: () => fetchAvailableImages(region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

// ---------- Customer: Submit Image Request ----------

export const useSubmitImageRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, SubmitRequestPayload>({
    mutationFn: (payload) => api.post("/image-requests", payload as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableImages"] });
      queryClient.invalidateQueries({ queryKey: ["myImageRequests"] });
    },
    onError: (error: Error) => {
      logger.error("Error submitting image request:", error);
    },
  });
};

// ---------- Customer: My Image Requests ----------

const fetchMyImageRequests = async (): Promise<ImageRequestRecord[]> => {
  const res = await api.get<{ data: ImageRequestRecord[] }>("/image-requests", { silent: true });
  return res?.data ?? [];
};

export const useMyImageRequests = (options: Record<string, unknown> = src/hooks/imageRequestHooks.ts) => {
  return useQuery<ImageRequestRecord[]>({
    queryKey: ["myImageRequests"],
    queryFn: fetchMyImageRequests,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};
