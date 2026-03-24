import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import silentApi from "../index/silent";
import silentTenantApi from "../index/tenant/silentTenant";
import { useApiContext } from "./useApiContext";
import {
  normalizeRegionList,
  resolveRegionEndpoint,
  resolveRegionFallback,
} from "../shared/utils/regionApi";
import {
  type ApiResponse,
  type Country,
  type State,
  type City,
  type Industry,
  type ProductCharge,
  type ComputeInstance,
  type OsImage,
  type VolumeType,
  type Bandwidth,
  type CrossConnect,
  type FloatingIP,
  type Profile,
  type Workspace,
} from "../shared/types/resource";
import logger from "../utils/logger";
import { api } from "../lib/api";
import config from "../config";

// Basic API Response interface (moved to shared/types/resource.ts)

// **GET**: fetchCountries — uses public /api/v1 (not role-based URL)
const fetchCountries = async (): Promise<Country[]> => {
  const res = await api.get<ApiResponse<Country[]>>("/countries", {
    silent: true,
    baseUrl: config.baseURL,
  });
  return res.data ?? (Array.isArray(res) ? res : []);
};

// GET: Fetch state by country ID — uses public /api/v1
const fetchStatesById = async (id: string | number): Promise<State[]> => {
  const res = await api.get<ApiResponse<State[]>>(`/countries/${id}`, {
    silent: true,
    baseUrl: config.baseURL,
  });
  return res.data ?? (Array.isArray(res) ? res : []);
};

// GET: Fetch cities by state ID — uses public /api/v1
const fetchCitiesById = async (id: string | number): Promise<City[]> => {
  const res = await api.get<ApiResponse<City[]>>(`/states/${id}`, {
    silent: true,
    baseUrl: config.baseURL,
  });
  return res.data ?? (Array.isArray(res) ? res : []);
};

// **GET**: fetchProfile
const fetchProfile = async (): Promise<Profile> => {
  const res: ApiResponse<Profile> = await silentTenantApi("GET", "/admin/user-profile");
  return res.data as Profile;
};
// **GET**: fetchWorkspace
const fetchWorkspace = async (): Promise<Workspace[]> => {
  const res: ApiResponse<Workspace[]> = await silentTenantApi("GET", "/admin/workspaces");
  return res.data ?? [];
};
// **GET**: fetch industry
const fetchIndustries = async (): Promise<Industry[]> => {
  const res: { message: Industry[] } = await silentApi("GET", "/industries");
  return res.message;
};

// **GET**: fetch product pricing by ID
export const fetchProductPricingById = async (
  productId: string | number
): Promise<ProductCharge[]> => {
  const res: ApiResponse<ProductCharge[]> = await silentApi(
    "GET",
    `/business/products/${productId}/charges`
  );
  return res.data ?? [];
};

const fetchGeneralRegions = async (
  apiBaseUrl: string,
  endpoint: string,
  authHeaders: Record<string, string>,
  fallback?: { baseUrl: string; endpoint: string }
) => {
  const fetchFrom = async (baseUrl: string, path: string) => {
    const { data } = await axios.get(`${baseUrl}${path}`, {
      headers: authHeaders,
      withCredentials: true,
    });
    return normalizeRegionList(data);
  };

  let regions = [];
  let usedFallback = false;

  try {
    regions = await fetchFrom(apiBaseUrl, endpoint);
  } catch (error) {
    if (!fallback) {
      throw error;
    }
    usedFallback = true;
    regions = await fetchFrom(fallback.baseUrl, fallback.endpoint);
  }

  if (!regions.length && fallback && !usedFallback) {
    try {
      const fallbackRegions = await fetchFrom(fallback.baseUrl, fallback.endpoint);
      if (fallbackRegions.length) {
        return fallbackRegions;
      }
    } catch (fallbackError) {
      logger.warn("Fallback region fetch failed:", fallbackError);
      // Keep the original (empty) result if fallback fails.
    }
  }

  return regions;
};
// **GET**: fetch product charge
const fetchProductCharges = async (
  region: string,
  productable_type: string,
  countryCode: string = "",
  tenantId: string | number = "",
  perPage: string | number = "",
  provider: string = "",
  availabilityZone: string = ""
): Promise<ProductCharge[]> => {
  const params = new URLSearchParams();
  params.append("region", region || "");
  if (productable_type) {
    params.append("productable_type", productable_type);
  }
  if (countryCode) {
    params.append("country_code", countryCode.toUpperCase());
  }
  if (tenantId) {
    params.append("tenant_id", String(tenantId));
  }
  if (perPage) {
    const pageSize = Number(perPage);
    if (Number.isFinite(pageSize) && pageSize > 0) {
      params.append("per_page", String(Math.min(100, pageSize)));
    }
  }
  if (provider) {
    params.append("provider", provider);
  }
  if (availabilityZone) {
    params.append("availability_zone", availabilityZone);
  }
  const res: ApiResponse<any> = await silentApi("GET", `/product-pricing?${params.toString()}`);
  return res.data;
};
// **GET**: fetch computer instances
const fetchComputerInstances = async (
  currency: string = "USD",
  region?: string
): Promise<ComputeInstance[]> => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res: ApiResponse<ComputeInstance[]> = await silentApi(
    "GET",
    `/product-compute-instance?${params}`
  );
  return res.data ?? [];
};
// **GET**: fetch OS images
const fetchOsImages = async (currency: string = "USD", region?: string): Promise<OsImage[]> => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res: ApiResponse<OsImage[]> = await silentApi("GET", `/product-os-image?${params}`);
  return res.data ?? [];
};
// **GET**: fetch ebs volumes
const fetchEbsVolumes = async (
  currency: string = "USD",
  region?: string
): Promise<VolumeType[]> => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res: ApiResponse<VolumeType[]> = await silentApi("GET", `/product-volume-type?${params}`);
  return res.data ?? [];
};
// **GET**: fetch bandwidth
const fetchBandwidths = async (currency: string = "USD", region?: string): Promise<Bandwidth[]> => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res: ApiResponse<Bandwidth[]> = await silentApi("GET", `/product-bandwidth?${params}`);
  return res.data ?? [];
};
// **GET**: fetch cross connects
const fetchCrossConnects = async (
  currency: string = "USD",
  region?: string
): Promise<CrossConnect[]> => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res: ApiResponse<CrossConnect[]> = await silentApi(
    "GET",
    `/product-cross-connect?${params}`
  );
  return res.data ?? [];
};
// **GET**: fetch floating ips
const fetchFloatingIPs = async (
  currency: string = "USD",
  region?: string
): Promise<FloatingIP[]> => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res: ApiResponse<FloatingIP[]> = await silentApi("GET", `/product-floating-ip?${params}`);
  return res.data ?? [];
};

// Hook to fetch countries
export const useFetchCountries = (options: any = {}) => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch states  by country ID
export const useFetchStatesById = (id: string | number, options: any = {}) => {
  return useQuery({
    queryKey: ["states", id],
    queryFn: () => fetchStatesById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch city  by state ID
export const useFetchCitiesById = (id: string | number, options: any = {}) => {
  return useQuery({
    queryKey: ["states", id],
    queryFn: () => fetchCitiesById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch Profile
export const useFetchProfile = (options: any = {}) => {
  const queryClient = useQueryClient();
  const profileQueryState = queryClient.getQueryState(["tenant-profile"]);

  const shouldEnable = !profileQueryState || profileQueryState.status !== "error";

  return useQuery({
    queryKey: ["tenant-profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: shouldEnable,
    ...options,
  });
};
// Hook to fetch workspaces
export const useFetchWorkSpaces = (options: any = {}) => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspace,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch Industries
export const useFetchIndustries = (options: any = {}) => {
  return useQuery({
    queryKey: ["industries"],
    queryFn: fetchIndustries,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch product charges (general)
export const useFetchChargeOptions = (options: any = {}) => {
  return useQuery({
    queryKey: ["prouct-charges-slug"],
    queryFn: () => fetchProductCharges("", ""), // Provide defaults for general fetch
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch computer instances
export const useFetchComputerInstances = (
  currency: string = "USD",
  region?: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["computer-instances", currency, region],
    queryFn: () => fetchComputerInstances(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch OS images
export const useFetchOsImages = (
  currency: string = "USD",
  region?: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["os-images", currency, region],
    queryFn: () => fetchOsImages(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch ebs volumes
export const useFetchEbsVolumes = (
  currency: string = "USD",
  region?: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["ebs-volumes", currency, region],
    queryFn: () => fetchEbsVolumes(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch bandwidths
export const useFetchBandwidths = (
  currency: string = "USD",
  region?: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["bandwidths", currency, region],
    queryFn: () => fetchBandwidths(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch cross connects
export const useFetchCrossConnect = (
  currency: string = "USD",
  region?: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["cross-connects", currency, region],
    queryFn: () => fetchCrossConnects(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch Floating IP
export const useFetchFloatingIPs = (
  currency: string = "USD",
  region?: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["floating-ips", currency, region],
    queryFn: () => fetchFloatingIPs(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetchregions
export const useFetchGeneralRegions = (options: any = {}) => {
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const endpoint = resolveRegionEndpoint(context);
  const fallback = resolveRegionFallback(context);
  return useQuery({
    queryKey: ["general-regions", context],
    queryFn: () =>
      fetchGeneralRegions(
        apiBaseUrl,
        endpoint,
        authHeaders as Record<string, string>,
        fallback as { baseUrl: string; endpoint: string }
      ),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductPricing = (
  region: string,
  productable_type: string,
  options: any = {}
) => {
  const {
    countryCode = "",
    tenantId = "",
    perPage = "",
    provider = "",
    availabilityZone = "",
    ...queryOptions
  } = options;
  const pageSize = Number(perPage);
  const resolvedPerPage = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(100, pageSize) : "";

  return useQuery({
    queryKey: [
      "product-pricing",
      region,
      productable_type,
      countryCode ? (countryCode as string).toUpperCase() : "",
      tenantId || "",
      resolvedPerPage || "",
      provider || "",
      availabilityZone || "",
    ],
    queryFn: () =>
      fetchProductCharges(
        region,
        productable_type,
        countryCode as string,
        tenantId as string | number,
        resolvedPerPage,
        provider as string,
        availabilityZone as string
      ),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};
