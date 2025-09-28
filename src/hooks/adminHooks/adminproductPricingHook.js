import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

import multipartApi from "../../index/admin/multipartApi";
const fetchProductPricing = async (country_code, provider) => {
  const params = [];
  if (country_code)
    params.push(`country_code=${encodeURIComponent(country_code)}`);
  if (provider) params.push(`provider=${encodeURIComponent(provider)}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  const res = await silentApi("GET", `/product-pricing${queryString}`);
  if (!res.data) {
    throw new Error("Failed to fetch product pricing");
  }
  return res.data;
};

const createProductPricing = async (pricingData) => {
  const res = await api("POST", "/product-pricing", pricingData);
  if (!res) {
    throw new Error("Failed to create product pricing");
  }
  return res;
};

const uploadProductPricingFile = async ({ file, dry_run }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (dry_run) {
    formData.append("dry_run", ""); // Append 'dry_run' key if it's a dry run
  }

  const res = await multipartApi("POST", "/product-pricing/import", formData);
  return res;
};

export const useFetchProductPricing = (
  country_code = "",
  provider = "",
  options = {}
) => {
  return useQuery({
    queryKey: ["productPricing", country_code || "none", provider || "none"],
    queryFn: () => fetchProductPricing(country_code, provider),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["productPricing"]);
    },
    onError: (error) => {
      console.error("Error creating product pricing:", error);
    },
  });
};

export const useUploadProductPricingFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductPricingFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPricing"] });
    },
    onError: (error) => {
      console.error("Error uploading product pricing file:", error);
    },
  });
};
