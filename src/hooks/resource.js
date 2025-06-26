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
