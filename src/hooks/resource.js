import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";
import silentTenantApi from "../index/tenant/silentTenant";

// **GET**: fetchCountries
const fetchCountries = async () => {
  const res = await silentApi("GET", "/countries");
  return res.data; // Extract only the data array
};

// GET: Fetch state by country ID
const fetchStatesById = async (id) => {
  const res = await silentApi("GET", `/countries/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch states with ID ${id}`);
  }
  return res.data;
};
// GET: Fetch cities by state ID
const fetchCitiesById = async (id) => {
  const res = await silentApi("GET", `/states/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch cities with ID ${id}`);
  }
  return res.data;
};

// **GET**: fetchProfile
const fetchProfile = async () => {
  const res = await silentTenantApi("GET", "/admin/user-profile");
  return res.data;
};
// **GET**: fetchWorkspace
const fetchWorkspace = async () => {
  const res = await silentTenantApi("GET", "/admin/workspaces");
  return res.data;
};
// **GET**: fetch industry
const fetchIndustries = async () => {
  const res = await silentApi("GET", "/industries");
  return res.message;
};
// **GET**: fetch product charge
const fetchProductCharges = async () => {
  const res = await silentApi("GET", "/product-charge");
  return res.data;
};
// **GET**: fetch product charge
const fetchGeneralRegions = async () => {
  const res = await silentApi("GET", "/business/cloud-regions");
  return res.data;
};
const fetchProductPricing = async (region, productable_type, countryCode = "") => {
  const params = new URLSearchParams();
  if (region) {
    params.append("region", region);
  }
  if (productable_type) {
    params.append("productable_type", productable_type);
  }
  if (countryCode) {
    params.append("country_code", countryCode.toUpperCase());
  }
  const res = await silentApi("GET", `/product-pricing?${params.toString()}`);
  return res.data;
};
// **GET**: fetch computer instances
const fetchComputerInstances = async (currency = "USD", region) => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res = await silentApi("GET", `/product-compute-instance?${params}`);
  return res.data;
};
// **GET**: fetch OS images
const fetchOsImages = async (currency = "USD", region) => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res = await silentApi("GET", `/product-os-image?${params}`);
  return res.data;
};
// **GET**: fetch ebs volumes
const fetchEbsVolumes = async (currency = "USD", region) => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res = await silentApi("GET", `/product-volume-type?${params}`);
  return res.data;
};
// **GET**: fetch bandwidth
const fetchBandwidths = async (currency = "USD", region) => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res = await silentApi("GET", `/product-bandwidth?${params}`);
  return res.data;
};
// **GET**: fetch cross connects
const fetchCrossConnects = async (currency = "USD", region) => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res = await silentApi("GET", `/product-cross-connect?${params}`);
  return res.data;
};
// **GET**: fetch floating ips
const fetchFloatingIPs = async (currency = "USD", region) => {
  const params = new URLSearchParams();
  params.append("country", currency);
  if (region) params.append("region", region);
  const res = await silentApi("GET", `/product-floating-ip?${params}`);
  return res.data;
};

// Hook to fetch countries
export const useFetchCountries = (options = {}) => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch states  by country ID
export const useFetchStatesById = (id, options = {}) => {
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
export const useFetchCitiesById = (id, options = {}) => {
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
export const useFetchProfile = (options = {}) => {
  const queryClient = useQueryClient();
  const profileQueryState = queryClient.getQueryState(["profile"]);

  const shouldEnable =
    !profileQueryState || profileQueryState.status !== "error";

  return useQuery({
    queryKey: ["profile"],
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
export const useFetchWorkSpaces = (options = {}) => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspace,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch Industries
export const useFetchIndustries = (options = {}) => {
  return useQuery({
    queryKey: ["industries"],
    queryFn: fetchIndustries,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch product charges
export const useFetchChargeOptions = (options = {}) => {
  return useQuery({
    queryKey: ["prouct-charges-slug"],
    queryFn: fetchProductCharges,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch computer instances
export const useFetchComputerInstances = (
  currency = "USD",
  region,
  options = {}
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
export const useFetchOsImages = (currency = "USD", region, options = {}) => {
  return useQuery({
    queryKey: ["os-images", currency, region],
    queryFn: () => fetchOsImages(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch ebs volumes
export const useFetchEbsVolumes = (currency = "USD", region, options = {}) => {
  return useQuery({
    queryKey: ["ebs-volumes", currency, region],
    queryFn: () => fetchEbsVolumes(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch bandwidths
export const useFetchBandwidths = (currency = "USD", region, options = {}) => {
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
  currency = "USD",
  region,
  options = {}
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
export const useFetchFloatingIPs = (currency = "USD", region, options = {}) => {
  return useQuery({
    queryKey: ["floating-ips", currency, region],
    queryFn: () => fetchFloatingIPs(currency, region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetchregions
export const useFetchGeneralRegions = (options = {}) => {
  return useQuery({
    queryKey: ["general-regions"],
    queryFn: fetchGeneralRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
export const useFetchProductPricing = (
  region,
  productable_type,
  options = {}
) => {
  const { countryCode = "", ...queryOptions } = options;

  return useQuery({
    queryKey: [
      "product-pricing",
      region,
      productable_type,
      countryCode ? countryCode.toUpperCase() : "",
    ],
    queryFn: () => fetchProductPricing(region, productable_type, countryCode),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};
