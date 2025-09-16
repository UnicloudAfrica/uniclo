import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchColocationSettings = async (region) => {
  const res = await silentApi("GET", `/colocation-settings?region=${region}`);
  if (!res.data) {
    throw new Error("Failed to fetch colocation settings");
  }
  return res.data;
};

const createColocationSettings = async (settingsData) => {
  const res = await api("POST", "/colocation-settings", settingsData);
  if (!res.data) {
    throw new Error("Failed to create colocation settings");
  }
  return res.data;
};

export const useFetchColocationSettings = (region, options = {}) => {
  return useQuery({
    queryKey: ["colocationSettings", region],
    queryFn: () => fetchColocationSettings(region),
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
      queryClient.invalidateQueries(["colocationSettings"]);
    },
    onError: (error) => {
      console.error("Error creating colocation settings:", error);
    },
  });
};
