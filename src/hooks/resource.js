import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// **GET**: fetchCountries
const fetchCountries = async () => {
  const res = await silentApi("GET", "/countries");
  return res.data; // Extract only the data array
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
