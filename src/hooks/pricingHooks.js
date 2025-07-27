import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantApi from "../index/tenant/tenantApi";
import silentTenantApi from "../index/tenant/silentTenant";

const fetchPricing = async () => {
  const res = await silentTenantApi("GET", "/admin/pricing");
  if (!res) {
    throw new Error("Failed to fetch pricing data");
  }
  return res.data;
};

const createPricing = async (pricingData) => {
  const res = await tenantApi("POST", "/admin/pricing", pricingData);
  if (!res.data) {
    throw new Error("Failed to create pricing data");
  }
  return res.data;
};

const updatePricing = async (pricingData) => {
  const res = await tenantApi("PATCH", "/admin/pricing", pricingData);
  if (!res.data) {
    throw new Error("Failed to update pricing data");
  }
  return res.data;
};

export const useFetchPricing = (options = {}) => {
  return useQuery({
    queryKey: ["admin-pricing"],
    queryFn: fetchPricing,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// GET: Fetch product charge data
const fetchProductCharge = async () => {
  const res = await tenantApi("GET", "/admin/product-charge");
  if (!res) {
    throw new Error("Failed to fetch product charge data");
  }
  return res.data;
};

// POST: Create new product charge data
const createProductCharge = async (productChargeData) => {
  const res = await tenantApi(
    "POST",
    "/admin/product-charge",
    productChargeData
  );
  if (!res.data) {
    throw new Error("Failed to create product charge data");
  }
  return res.data;
};

// PATCH: Update existing product charge data
const updateProductCharge = async (productChargeData) => {
  const res = await tenantApi(
    "PATCH",
    "/admin/product-charge",
    productChargeData
  );
  if (!res.data) {
    throw new Error("Failed to update product charge data");
  }
  return res.data;
};

export const useCreatePricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pricing"]);
    },
    onError: (error) => {
      console.error("Error creating pricing data:", error);
    },
  });
};

export const useUpdatePricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pricing"]);
    },
    onError: (error) => {
      console.error("Error updating pricing data:", error);
    },
  });
};

// Hook to fetch product charge data
export const useFetchProductCharge = (options = {}) => {
  return useQuery({
    queryKey: ["admin-product-charge"],
    queryFn: fetchProductCharge,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create product charge data
export const useCreateProductCharge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductCharge,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-product-charge"]);
    },
    onError: (error) => {
      console.error("Error creating product charge data:", error);
    },
  });
};

// Hook to update product charge data
export const useUpdateProductCharge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductCharge,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-product-charge"]);
    },
    onError: (error) => {
      console.error("Error updating product charge data:", error);
    },
  });
};
