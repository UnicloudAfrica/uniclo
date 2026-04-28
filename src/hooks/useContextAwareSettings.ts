import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { detectApiContext } from "./settingsHooks";
import ToastUtils from "../utils/toastUtil";
import logger from "../utils/logger";

export const useContextAwareSettings = () => {
  const queryClient = useQueryClient();
  const { api, type } = detectApiContext();

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === "string" && error.trim()) {
      return error;
    }
    return fallback;
  };

  // Helper to get endpoint prefix if needed
  // Assuming standard /settings/profile for now, but can be customized per 'type'
  const getEndpoint = (path: string) => {
    return path;
  };

  type ApiEnvelope<T = unknown> = { data?: T };

  const fetchProfileSettings = async (): Promise<unknown> => {
    const endpoint = getEndpoint("/settings/profile");
    const res = await api<ApiEnvelope>("GET", endpoint);
    if (!res.data) throw new Error("Failed to fetch profile settings");
    return res.data;
  };

  const updateProfileSettings = async (data: Record<string, unknown>): Promise<unknown> => {
    const endpoint = getEndpoint("/settings/profile");
    const res = await api<ApiEnvelope>("PUT", endpoint, data);
    if (!res.data) throw new Error("Failed to update profile settings");
    return res.data;
  };

  const uploadAvatar = async (formData: FormData): Promise<unknown> => {
    const endpoint = getEndpoint("/settings/profile/avatar");
    const res = await api<ApiEnvelope>("POST", endpoint, formData);
    if (!res.data) throw new Error("Failed to upload avatar");
    return res.data;
  };

  const resetProfileSettings = async (
    data: Record<string, unknown> = {}
  ): Promise<unknown> => {
    const endpoint = getEndpoint("/settings/profile/reset");
    const res = await api<ApiEnvelope>("POST", endpoint, data);
    if (!res.data) throw new Error("Failed to reset profile settings");
    return res.data;
  };

  const exportProfileSettings = async (): Promise<unknown> => {
    const endpoint = getEndpoint("/settings/profile/export");
    const res = await api<ApiEnvelope>("GET", endpoint);
    if (!res.data) throw new Error("Failed to export profile settings");
    return res.data;
  };

  const importProfileSettings = async (payload: Record<string, unknown>): Promise<unknown> => {
    const endpoint = getEndpoint("/settings/profile/import");
    const res = await api<ApiEnvelope>("POST", endpoint, payload);
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
      onError: (error: unknown) => {
        logger.error("Error updating settings:", error);
        ToastUtils.error(getErrorMessage(error, "Failed to update settings"));
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
      onError: (error: unknown) => {
        logger.error("Error resetting settings:", error);
        ToastUtils.error(getErrorMessage(error, "Failed to reset settings"));
      },
    });
  };

  const useExportSettings = () => {
    return useMutation({
      mutationFn: exportProfileSettings,
      onSuccess: () => {
        ToastUtils.success("Settings exported successfully");
      },
      onError: (error: unknown) => {
        logger.error("Error exporting settings:", error);
        ToastUtils.error(getErrorMessage(error, "Failed to export settings"));
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
      onError: (error: unknown) => {
        logger.error("Error importing settings:", error);
        ToastUtils.error(getErrorMessage(error, "Failed to import settings"));
      },
    });
  };

  const updatePassword = async (data: Record<string, unknown>): Promise<unknown> => {
    // Both Admin and Business APIs have /profile/password for password updates
    // Admin: PUT /admin/profile/password
    // Business: PUT /api/v1/business/profile/password
    const endpoint = "profile/password";
    const res = await api<ApiEnvelope>("PUT", endpoint, data);
    return res.data;
  };

  const useUpdatePassword = () => {
    return useMutation({
      mutationFn: updatePassword,
      onSuccess: () => {
        ToastUtils.success("Password updated successfully");
      },
      onError: (error: unknown) => {
        logger.error("Error updating password:", error);
        ToastUtils.error(getErrorMessage(error, "Failed to update password"));
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
