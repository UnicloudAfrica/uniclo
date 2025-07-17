import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all colocation settings
const fetchColocationSettings = async () => {
  const res = await silentApi("GET", "/colocation-settings");
  if (!res.data) {
    throw new Error("Failed to fetch colocation settings");
  }
  return res.data;
};

const createColocationSettings = async (settingsDate) => {
  const res = await api("POST", "/colocation-settings", settingsDate);
  if (!res.data) {
    throw new Error("Failed to create colocation settings");
  }
  return res.data;
};

// Hook to fetch all colocation settings
export const useFetchColocationSettings = (options = {}) => {
  return useQuery({
    queryKey: ["colocationSettings"],
    queryFn: fetchColocationSettings,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to update a colocation setting

export const useCreateColocationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createColocationSettings,
    onSuccess: () => {
      // Invalidate bandwidthProducts query to refresh the list
      queryClient.invalidateQueries(["colocationSettings"]);
    },
    onError: (error) => {
      console.error("Error updating colocation setting", error);
    },
  });
};
