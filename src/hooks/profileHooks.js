import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// GET: Fetch all Profile
const fetchProfile = async () => {
  const res = await silentApi("GET", "/user/profile");
  if (!res.data) {
    throw new Error("Failed to fetch profile");
  }
  return res.data;
};

// POST: Create a new profile
const createProfile = async (profileData) => {
  const res = await api("POST", "/user/profile", profileData);
  if (!res.data) {
    throw new Error("Failed to create profile");
  }
  return res.data;
};

// Hook to fetch all profile
export const useFetchProfile = (options = {}) => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a profile
export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      // Invalidate profiles query to refresh the list
      queryClient.invalidateQueries(["profiles"]);
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
    },
  });
};
