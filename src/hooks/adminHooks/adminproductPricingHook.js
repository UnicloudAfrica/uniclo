import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import fileApi from "../../index/admin/fileapi";
import multipartApi from "../../index/admin/multipartApi";

const fetchProductPricing = async (region) => {
  const params = [];
  if (region) params.push(`region=${encodeURIComponent(region)}`);
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

const exportProductPricingTemplate = async (region) => {
  const params = new URLSearchParams();
  if (region) {
    params.append("region", region);
  }
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await fileApi(
    "GET",
    `/product-pricing/export-template${queryString}`
  );
  if (!res) throw new Error("Failed to download template.");
  return res;
};

export const useFetchProductPricing = (region = "", options = {}) => {
  return useQuery({
    queryKey: ["product-pricing-admin", region],
    queryFn: () => fetchProductPricing(region),
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
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error) => {
      console.error("Error creating product pricing:", error);
    },
  });
};

export const useExportProductPricingTemplate = () => {
  return useMutation({
    mutationFn: exportProductPricingTemplate,
    onSuccess: (response, variables) => {
      const filename = `product-pricing-template-${variables || "all"}.csv`;
      const csvData = response;
      // Create a Blob from the response data
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      // Create a link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // Append the link to the DOM
      a.click(); // Programmatically click the link to trigger the download
      a.remove(); // Remove the link from the DOM
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error("Error downloading product pricing template:", error);
    },
  });
};

export const useUploadProductPricingFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductPricingFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error) => {
      console.error("Error uploading product pricing file:", error);
    },
  });
};
