import { useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import clientSilentApi from "../../index/client/silent";
import silentTenantApi from "../../index/tenant/silentTenant";

export type DashboardType = "admin" | "tenant" | "client";

export interface UserProfile {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  role?: string;
}

type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;

interface NormalizedProfile {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  avatar?: string | undefined;
}

/**
 * Fetch profile based on dashboard type
 * NOTE: Each dashboard type uses its OWN API context:
 * - Admin → /admin/v1/profile (adminApi)
 * - Tenant → /tenant/v1/admin/user-profile (silentTenantApi)
 * - Client → /api/v1/business/profile (clientSilentApi)
 */
const fetchProfile = async (dashboardType: DashboardType): Promise<UserProfile> => {
  switch (dashboardType) {
    case "admin": {
      // adminApi is function-based: adminApi(method, uri)
      const res = await adminApi<ApiResponse<UserProfile>>("GET", "/profile");
      return res.data || (res as unknown as UserProfile);
    }
    case "tenant": {
      const res = await silentTenantApi<ApiResponse<UserProfile>>("GET", "/admin/user-profile");
      return res.data || ({} as UserProfile);
    }
    case "client": {
      const res = await clientSilentApi<ApiResponse<UserProfile>>("GET", "/business/profile");
      return res.data || ({} as UserProfile);
    }
    default:
      throw new Error(`Unknown dashboard type: ${dashboardType}`);
  }
};

/**
 * Normalize profile data to a consistent format
 */
const normalizeProfile = (data: UserProfile | undefined): NormalizedProfile => {
  if (!data) {
    return {
      email: "",
      firstName: "",
      lastName: "",
      fullName: "",
      initials: "--",
      avatar: undefined,
    };
  }

  const firstName = data.first_name || data.name?.split(" ")[0] || "";
  const lastName = data.last_name || data.name?.split(" ").slice(1).join(" ") || "";
  const fullName = `${firstName} ${lastName}`.trim() || data.name || "";
  const initials =
    (firstName?.[0]?.toUpperCase() || "") + (lastName?.[0]?.toUpperCase() || "") || "--";

  return {
    email: data.email || "",
    firstName,
    lastName,
    fullName,
    initials,
    avatar: data.avatar,
  };
};

/**
 * Unified hook to fetch user profile for any dashboard type
 */
export type DashboardProfileOptions = Omit<
  UseQueryOptions<UserProfile, Error>,
  "queryKey" | "queryFn"
>;

export const useDashboardProfile = (
  dashboardType: DashboardType,
  options: DashboardProfileOptions = {}
) => {
  const queryClient = useQueryClient();
  const queryKey = ["profile", dashboardType];
  const profileQueryState = queryClient.getQueryState(queryKey);

  const shouldEnable = profileQueryState?.status !== "error";

  const query = useQuery({
    queryKey,
    queryFn: () => fetchProfile(dashboardType),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: shouldEnable,
    ...options,
  });

  return {
    ...query,
    profile: normalizeProfile(query.data),
    rawProfile: query.data,
  };
};

export default useDashboardProfile;
