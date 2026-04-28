import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type {
  ApiEnvelope,
  AdminResourceRecord,
  QueryHookOptions,
} from "@/shared/types/admin";

const fetchColocationSettings = async (region: string) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/colocation-settings?region=${region}`
  );
  if (!res.data) {
    throw new Error("Failed to fetch colocation settings");
  }
  return res.data;
};

const createColocationSettings = async (settingsData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/colocation-settings",
    settingsData
  );
  if (!res.data) {
    throw new Error("Failed to create colocation settings");
  }
  return res.data;
};

export const useFetchColocationSettings = (
  region: string | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: ["colocationSettings", region],
    queryFn: () => fetchColocationSettings(region as string),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useCreateColocationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createColocationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colocationSettings"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating colocation settings:", error);
    },
  });
};
