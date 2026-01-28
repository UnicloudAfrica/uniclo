import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";
import adminSettingsApi from "../index/admin/settingsApi";
import adminSilentSettingsApi from "../index/admin/silentSettingsApi";

// ═══════════════════════════════════════════════════════════════════
// TENANT BRANDING
// ═══════════════════════════════════════════════════════════════════

// Fetch current branding settings
export const useFetchBranding = (options = {}) => {
  return useQuery({
    queryKey: ["tenantBranding"],
    queryFn: async () => {
      const res = await silentApi("GET", `/tenant/v1/admin/branding`);
      return res.data?.data || res.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// Update branding settings
export const useUpdateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      // Handle file uploads with FormData
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const res = await api("PUT", `/tenant/v1/admin/branding`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantBranding"] });
      queryClient.invalidateQueries({ queryKey: ["brandingPreview"] });
    },
  });
};

// Preview branding changes
export const usePreviewBranding = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api("POST", `/tenant/v1/admin/branding/preview`, data);
      return res.data?.data || res.data;
    },
  });
};

// Verify custom domain
export const useVerifyDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (domain) => {
      const res = await api("POST", `/tenant/v1/admin/branding/verify-domain`, {
        domain,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantBranding"] });
    },
  });
};

// Reset branding to defaults
export const useResetBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api("DELETE", `/tenant/v1/admin/branding/reset`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantBranding"] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN BRANDING (GLOBAL)
// ═══════════════════════════════════════════════════════════════════

export const useFetchAdminBranding = (options = {}) => {
  return useQuery({
    queryKey: ["adminBranding"],
    queryFn: async () => {
      const res = await adminSilentSettingsApi("GET", "/settings/admin/branding");
      return res.data?.data || res.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useUpdateAdminBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const res = await adminSettingsApi("PUT", "/settings/admin/branding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBranding"] });
      queryClient.invalidateQueries({ queryKey: ["branding-theme", "admin"] });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth-branding:v1:admin|");
      }
    },
  });
};

export const useResetAdminBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await adminSettingsApi("DELETE", "/settings/admin/branding/reset");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBranding"] });
      queryClient.invalidateQueries({ queryKey: ["branding-theme", "admin"] });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth-branding:v1:admin|");
      }
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════════

// Generate color palette from primary color
export const generateColorPalette = (hex) => {
  if (!hex || !hex.match(/^#[0-9A-Fa-f]{6}$/)) {
    return null;
  }

  const hexToRgb = (h) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r, g, b) => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = Math.round(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
        .toUpperCase()
    );
  };

  const mixColor = (rgb, ratio, targetRgb) => {
    return {
      r: rgb.r + (targetRgb.r - rgb.r) * ratio,
      g: rgb.g + (targetRgb.g - rgb.g) * ratio,
      b: rgb.b + (targetRgb.b - rgb.b) * ratio,
    };
  };

  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: rgbToHex(...Object.values(mixColor(rgb, 0.95, white))),
    100: rgbToHex(...Object.values(mixColor(rgb, 0.9, white))),
    200: rgbToHex(...Object.values(mixColor(rgb, 0.8, white))),
    300: rgbToHex(...Object.values(mixColor(rgb, 0.6, white))),
    400: rgbToHex(...Object.values(mixColor(rgb, 0.3, white))),
    500: hex.toUpperCase(),
    600: rgbToHex(...Object.values(mixColor(rgb, 0.1, black))),
    700: rgbToHex(...Object.values(mixColor(rgb, 0.3, black))),
    800: rgbToHex(...Object.values(mixColor(rgb, 0.5, black))),
    900: rgbToHex(...Object.values(mixColor(rgb, 0.7, black))),
  };
};

// Check if color is light or dark
export const isLightColor = (hex) => {
  if (!hex) return true;

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return true;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};
