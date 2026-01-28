import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { detectApiContext } from "./settingsHooks";
import ToastUtils from "../utils/toastUtil";

export const useContextAwareSettings = () => {
  const queryClient = useQueryClient();
  const { api, type } = detectApiContext();

  // Helper to get endpoint prefix if needed
  // Assuming standard /settings/profile for now, but can be customized per 'type'
  const getEndpoint = (path: string) => {
    return path;
  };

  const fetchProfileSettings = async () => {
    const endpoint = getEndpoint("/settings/profile");
    // For admin, settingsHooks.js used silentAdminSettingsApi for fetch
    // For now we use the main detected api.
    // If specific silent instances are needed, we might need to enhance detectApiContext
    // or just use the main one with error handling suppression if the API client supports it.
    const res = await api("GET", endpoint);
    if (!res.data) throw new Error("Failed to fetch profile settings");
    return res.data;
  };

  const updateProfileSettings = async (data: any) => {
    const endpoint = getEndpoint("/settings/profile");
    const res = await api("PUT", endpoint, data);
    if (!res.data) throw new Error("Failed to update profile settings");
    return res.data;
  };

  const uploadAvatar = async (formData: FormData) => {
    const endpoint = getEndpoint("/settings/profile/avatar");
    // Note: API client usually handles Content-Type automatically or we might need to specify it
    // Check existing API client implementation if it handles FormData correctly
    const res = await api("POST", endpoint, formData);
    if (!res.data) throw new Error("Failed to upload avatar");
    return res.data;
  };

  const resetProfileSettings = async (data: any = {}) => {
    const endpoint = getEndpoint("/settings/profile/reset");
    const res = await api("POST", endpoint, data);
    if (!res.data) throw new Error("Failed to reset profile settings");
    return res.data;
  };

  const exportProfileSettings = async () => {
    const endpoint = getEndpoint("/settings/profile/export");
    const res = await api("GET", endpoint);
    if (!res.data) throw new Error("Failed to export profile settings");
    return res.data;
  };

  const importProfileSettings = async (payload: any) => {
    const endpoint = getEndpoint("/settings/profile/import");
    const res = await api("POST", endpoint, payload);
    if (!res.data) throw new Error("Failed to import profile settings");
    return res.data;
  };

  const useFetchSettings = () => {
    return useQuery({
      queryKey: ["context-profile-settings", type],
      queryFn: fetchProfileSettings,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });
  };

  const useUpdateSettings = () => {
    return useMutation({
      mutationFn: updateProfileSettings,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["context-profile-settings", type] });
        ToastUtils.success("Settings updated successfully");
      },
      onError: (error: any) => {
        console.error("Error updating settings:", error);
        ToastUtils.error(error.message || "Failed to update settings");
      },
    });
  };

  const useResetSettings = () => {
    return useMutation({
      mutationFn: resetProfileSettings,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["context-profile-settings", type] });
        ToastUtils.success("Settings reset successfully");
      },
      onError: (error: any) => {
        console.error("Error resetting settings:", error);
        ToastUtils.error(error.message || "Failed to reset settings");
      },
    });
  };

  const useExportSettings = () => {
    return useMutation({
      mutationFn: exportProfileSettings,
      onSuccess: () => {
        ToastUtils.success("Settings exported successfully");
      },
      onError: (error: any) => {
        console.error("Error exporting settings:", error);
        ToastUtils.error(error.message || "Failed to export settings");
      },
    });
  };

  const useImportSettings = () => {
    return useMutation({
      mutationFn: importProfileSettings,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["context-profile-settings", type] });
        ToastUtils.success("Settings imported successfully");
      },
      onError: (error: any) => {
        console.error("Error importing settings:", error);
        ToastUtils.error(error.message || "Failed to import settings");
      },
    });
  };

  const updatePassword = async (data: any) => {
    // Both Admin and Business APIs have /profile/password for password updates
    // Admin: PUT /admin/profile/password
    // Business: PUT /api/v1/business/profile/password
    const endpoint = "profile/password";
    const res = await api("PUT", endpoint, data);
    return res.data;
  };

  const useUpdatePassword = () => {
    return useMutation({
      mutationFn: updatePassword,
      onSuccess: () => {
        ToastUtils.success("Password updated successfully");
      },
      onError: (error: any) => {
        console.error("Error updating password:", error);
        ToastUtils.error(error.message || "Failed to update password");
      },
    });
  };

  return {
    type,
    useFetchSettings,
    useUpdateSettings,
    useResetSettings,
    useExportSettings,
    useImportSettings,
    useUpdatePassword, // Export the new hook
    uploadAvatar,
  };
};
