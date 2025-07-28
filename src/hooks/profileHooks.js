import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchTenantProfile = async () => {
  const res = await silentTenantApi("GET", "/admin/profile");
  if (!res) {
    throw new Error("Failed to fetch profile");
  }
  return res;
};
const fetchTenantDashboard = async () => {
  const res = await silentTenantApi("GET", "/admin/dashboard");
  if (!res) {
    throw new Error("Failed to fetch dashboard");
  }
  return res.data;
};

const createProfile = async (profileData) => {
  const res = await tenantApi("POST", "/admin/profile", profileData);
  if (!res.data) {
    throw new Error("Failed to create profile");
  }
  return res.data;
};

const updateProfile = async (profileData) => {
  const res = await tenantApi("PATCH", "/admin/profile", profileData);
  if (!res.data) {
    throw new Error("Failed to update profile");
  }
  return res.data;
};
const updateUserProfile = async (profileData) => {
  const res = await tenantApi("PATCH", "/admin/user-profile", profileData);
  if (!res.data) {
    throw new Error("Failed to update profile");
  }
  return res.data;
};

export const useFetchTenantProfile = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-profile"],
    queryFn: fetchTenantProfile,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

export const useFetchTenantDashboard = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-dashboard"],
    queryFn: fetchTenantDashboard,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(["tenant-profile"]);
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(["tenant-profile"]);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });
};

export const useUserUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });
};
