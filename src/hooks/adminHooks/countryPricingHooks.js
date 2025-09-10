import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchCountryPricings = async () => {
  const res = await silentApi("GET", "/country-pricing");
  if (!res.data) throw new Error("Failed to fetch country pricings");
  return res.data;
};

const fetchCountryPricingById = async (id) => {
  const res = await silentApi("GET", `/country-pricing/${id}`);
  if (!res.data)
    throw new Error(`Failed to fetch country pricing with ID ${id}`);
  return res.data;
};

const createCountryPricing = async (pricingData) => {
  const res = await api("POST", "/country-pricing", pricingData);
  if (!res.data) throw new Error("Failed to create country pricing");
  return res.data;
};

const updateCountryPricing = async ({ id, pricingData }) => {
  const res = await api("PATCH", `/country-pricing/${id}`, pricingData);
  if (!res.data)
    throw new Error(`Failed to update country pricing with ID ${id}`);
  return res.data;
};

const deleteCountryPricing = async (id) => {
  const res = await api("DELETE", `/country-pricing/${id}`);
  if (!res.data)
    throw new Error(`Failed to delete country pricing with ID ${id}`);
  return res.data;
};

export const useFetchCountryPricings = (options = {}) => {
  return useQuery({
    queryKey: ["countryPricings"],
    queryFn: fetchCountryPricings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchCountryPricingById = (id, options = {}) => {
  return useQuery({
    queryKey: ["countryPricing", id],
    queryFn: () => fetchCountryPricingById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateCountryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCountryPricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["countryPricings"]);
    },
    onError: (error) => {
      console.error("Error creating country pricing:", error);
    },
  });
};

export const useUpdateCountryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCountryPricing,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["countryPricings"]);
      queryClient.invalidateQueries(["countryPricing", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating country pricing:", error);
    },
  });
};

export const useDeleteCountryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCountryPricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["countryPricings"]);
    },
    onError: (error) => {
      console.error("Error deleting country pricing:", error);
    },
  });
};
