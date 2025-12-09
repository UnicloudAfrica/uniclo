import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import all context-specific APIs
import silentApi from "../index/silent";
import api from "../index/api";
import { adminSilentApi } from "../index/admin/api";
import adminApi from "../index/admin/api";
import tenantApi from "../index/tenant/tenantApi";
import clientApi from "../index/client/api";
import clientSilentApi from "../index/client/silent";
import config from "../config";
import useTenantAuthStore from "../stores/tenantAuthStore";

// Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  category: "billing" | "instance" | "support" | "system" | "marketing";
  priority: "low" | "normal" | "high" | "urgent";
  action_url: string | null;
  icon: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreference {
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
}

// Context type for API selection
export type ApiContext = "admin" | "tenant" | "client";

// Silent tenant API (no toast notifications)
const silentTenantApi = async (method: string, uri: string, body: any = null) => {
  const url = config.tenantURL + uri;
  const { token } = useTenantAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };

  const response = await fetch(url, options);
  const res = await response.json();

  if (!response.ok && response.status !== 201) {
    throw new Error(res?.message || "An error occurred");
  }

  return res;
};

// Helper to get the correct API based on context
const getApiForContext = (context: ApiContext, silent: boolean = false) => {
  switch (context) {
    case "admin":
      return silent ? adminSilentApi : adminApi;
    case "tenant":
      return silent ? silentTenantApi : tenantApi;
    case "client":
      return silent ? clientSilentApi : clientApi;
    default:
      return silent ? silentApi : api;
  }
};

// Detect context from URL path
export const detectApiContext = (): ApiContext => {
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.startsWith("/admin-dashboard")) return "admin";
    if (path.startsWith("/dashboard") || path.startsWith("/tenant-dashboard")) return "tenant";
  }
  return "client";
};

// Query keys
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

// Fetch notifications - auto-detects context
export function useNotifications(filters?: {
  unread_only?: boolean;
  category?: string;
  page?: number;
  per_page?: number;
}) {
  const context = detectApiContext();
  const apiClient = getApiForContext(context, true);

  return useQuery({
    queryKey: [...notificationKeys.list(filters || {}), context],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.unread_only) params.append("unread_only", "1");
        if (filters?.category) params.append("category", filters.category);
        if (filters?.page) params.append("page", String(filters.page));
        if (filters?.per_page) params.append("per_page", String(filters.per_page));

        const queryString = params.toString();
        const url = `/settings/notifications${queryString ? `?${queryString}` : ""}`;

        const response = await apiClient("GET", url);
        return response as {
          data: Notification[];
          meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
          };
        };
      } catch (error) {
        // Return empty data on error to prevent infinite re-renders
        return { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } };
      }
    },
    retry: false,
    staleTime: 10000,
  });
}

// Fetch unread count - auto-detects context, polls every 30 seconds
export function useUnreadCount(enabled = true) {
  const context = detectApiContext();
  const apiClient = getApiForContext(context, true);

  return useQuery({
    queryKey: [...notificationKeys.unreadCount(), context],
    queryFn: async () => {
      try {
        const response = await apiClient("GET", "/settings/notifications/unread-count");
        return response as { data: { unread_count: number } };
      } catch (error) {
        return { data: { unread_count: 0 } };
      }
    },
    enabled,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 10000,
  });
}

// Mark notification as read - auto-detects context
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const context = detectApiContext();
  const apiClient = getApiForContext(context, false);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiClient("POST", `/settings/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Mark all notifications as read - auto-detects context
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const context = detectApiContext();
  const apiClient = getApiForContext(context, false);

  return useMutation({
    mutationFn: async () => {
      return await apiClient("POST", "/settings/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Delete notification - auto-detects context
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const context = detectApiContext();
  const apiClient = getApiForContext(context, false);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiClient("DELETE", `/settings/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Clear all notifications - auto-detects context
export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  const context = detectApiContext();
  const apiClient = getApiForContext(context, false);

  return useMutation({
    mutationFn: async () => {
      return await apiClient("DELETE", "/settings/notifications/clear-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Fetch notification preferences from ProfileSettings - auto-detects context
// Uses /settings/profile?category=notifications (existing UserSettingsService)
export function useNotificationPreferences() {
  const context = detectApiContext();
  const apiClient = getApiForContext(context, true);

  return useQuery({
    queryKey: [...notificationKeys.preferences(), context],
    queryFn: async () => {
      try {
        const response = await apiClient("GET", "/settings/profile?category=notifications");
        // Transform from { notifications: { key: value } } to preference array format
        const settings = response?.data?.settings || {};
        const preferences = [
          {
            category: "billing",
            key: "billing_alerts",
            email_enabled: settings.billing_alerts ?? true,
            in_app_enabled: true,
          },
          {
            category: "instance",
            key: "instance_alerts",
            email_enabled: settings.instance_alerts ?? true,
            in_app_enabled: true,
          },
          {
            category: "security",
            key: "security_alerts",
            email_enabled: settings.security_alerts ?? true,
            in_app_enabled: true,
          },
          {
            category: "marketing",
            key: "marketing_emails",
            email_enabled: settings.marketing_emails ?? false,
            in_app_enabled: true,
          },
          {
            category: "system",
            key: "email_notifications",
            email_enabled: settings.email_notifications ?? true,
            in_app_enabled: true,
          },
        ];
        return { data: preferences, raw: settings };
      } catch (error) {
        return { data: [], raw: {} };
      }
    },
    retry: false,
    staleTime: 10000,
  });
}

// Update notification preferences via ProfileSettings - auto-detects context
// Uses PUT /settings/profile/batch (existing UserSettingsService)
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const context = detectApiContext();
  const apiClient = getApiForContext(context, false);

  return useMutation({
    mutationFn: async (settings: Record<string, boolean>) => {
      // Convert to batch update format expected by ProfileSettingsController
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        category: "notifications",
        key,
        value,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (apiClient as any)("PUT", "/settings/profile/batch", {
        settings: settingsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

// Utility functions
export const getCategoryIcon = (category: Notification["category"]): string => {
  const icons: Record<Notification["category"], string> = {
    billing: "credit-card",
    instance: "server",
    support: "headphones",
    system: "settings",
    marketing: "megaphone",
  };
  return icons[category] || "bell";
};

export const getCategoryColor = (category: Notification["category"]): string => {
  const colors: Record<Notification["category"], string> = {
    billing: "text-green-600 bg-green-100",
    instance: "text-blue-600 bg-blue-100",
    support: "text-purple-600 bg-purple-100",
    system: "text-gray-600 bg-gray-100",
    marketing: "text-orange-600 bg-orange-100",
  };
  return colors[category] || "text-gray-600 bg-gray-100";
};

export const getPriorityColor = (priority: Notification["priority"]): string => {
  const colors: Record<Notification["priority"], string> = {
    low: "text-gray-500",
    normal: "text-blue-500",
    high: "text-orange-500",
    urgent: "text-red-500",
  };
  return colors[priority] || "text-gray-500";
};

export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
