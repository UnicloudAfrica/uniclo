import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

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
  const res = await silentApi("GET", "/business/profile");
  return res.data; // Extract only the data array
};
// **GET**: fetch industry
const fetchIndustries = async () => {
  const res = await silentApi("GET", "/industries");
  return res.data; // Extract only the data array
};
// **GET**: fetch computer instances
const fetchComputerInstances = async () => {
  const res = await silentApi("GET", "/product-compute-instance");
  return res.data; // Extract only the data array
};
// **GET**: fetch computer instances
const fetchOsImages = async () => {
  const res = await silentApi("GET", "/product-os-image");
  return res.data; // Extract only the data array
};
// **GET**: fetch ebs volumes
const fetchEbsVolumes = async () => {
  const res = await silentApi("GET", "/product-ebs-volume");
  return res.data; // Extract only the data array
};
// **GET**: fetch bandwith
const fetchBandwidths = async () => {
  const res = await silentApi("GET", "/product-bandwidth");
  return res.data; // Extract only the data array
};

// Hook to fetch countries
export const useFetchCountries = (options = {}) => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch Industries
export const useFetchIndustries = (options = {}) => {
  return useQuery({
    queryKey: ["industries"],
    queryFn: fetchIndustries,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch computer instances
export const useFetchComputerInstances = (options = {}) => {
  return useQuery({
    queryKey: ["computer-instances"],
    queryFn: fetchComputerInstances,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch OS images
export const useFetchOsImages = (options = {}) => {
  return useQuery({
    queryKey: ["os-images"],
    queryFn: fetchOsImages,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch ebs volumes
export const useFetchEbsVolumes = (options = {}) => {
  return useQuery({
    queryKey: ["ebs-volumes"],
    queryFn: fetchEbsVolumes,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch bandwidths
export const useFetchBandwidths = (options = {}) => {
  return useQuery({
    queryKey: ["bandwidths"],
    queryFn: fetchBandwidths,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
