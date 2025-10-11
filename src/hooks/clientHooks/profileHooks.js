import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

// **GET**: Fetch user profile
const fetchProfile = async () => {
  const res = await clientSilentApi("GET", "/business/profile");
  if (!res.data) {
    throw new Error(res.message || "Failed to fetch profile");
  }
  return res.data;
};

// **PUT**: Update user profile
const updateUserProfile = async (profileData) => {
  const res = await clientApi("PUT", "/business/profile", profileData);
  if (!res.data) {
    throw new Error(res.message || "Failed to update profile");
  }
  return res.data;
};

// **POST**: Enable 2FA
const enableTwoFactorAuth = async (payload) => {
  const res = await clientApi("POST", "/business/2fa-enable", payload);
  if (!res.data) {
    throw new Error(res.message || "Failed to enable 2FA");
  }
  return res.data;
};

// **POST**: Disable 2FA
const disableTwoFactorAuth = async (payload) => {
  const res = await clientApi("POST", "/business/2fa-disable", payload);
  if (!res.data) {
    throw new Error(res.message || "Failed to disable 2FA");
  }
  return res.data;
};

// Hook to fetch user profile
export const useFetchClientProfile = (options = {}) => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

// Hook to update user profile
export const useUserUpdateClientProfile = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    ...options,
  });
};

// Hook to enable 2FA
export const useEnableTwoFactorAuth = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableTwoFactorAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    ...options,
  });
};

// Hook to disable 2FA
export const useDisableTwoFactorAuth = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableTwoFactorAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    ...options,
  });
};
