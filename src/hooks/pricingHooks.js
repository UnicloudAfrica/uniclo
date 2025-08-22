import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchPricing = async () => {
  const res = await silentTenantApi("GET", "/admin/pricing");
  if (!res) {
    throw new Error("Failed to fetch pricing data");
  }
  return res;
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

const deletePricing = async (id) => {
  const res = await tenantApi("DELETE", `/admin/pricing/${id}`);
  if (!res.data) {
    throw new Error("Failed to delete pricing data");
  }
  return res.data;
};

// New function for resync-pricing
const resyncPricing = async () => {
  const res = await tenantApi("GET", "/admin/resync-pricing");
  if (!res) {
    throw new Error("Failed to resync pricing data");
  }
  return res;
};

// New function for sync-pricing
const syncPricing = async () => {
  const res = await tenantApi("GET", "/admin/sync-pricing");
  if (!res) {
    throw new Error("Failed to sync pricing data");
  }
  return res;
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

export const useDeletePricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pricing"]);
    },
    onError: (error) => {
      console.error("Error deleting pricing data:", error);
    },
  });
};

// New hook for resync-pricing
export const useResyncPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resyncPricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pricing"]);
    },
    onError: (error) => {
      console.error("Error resyncing pricing data:", error);
    },
  });
};

// New hook for sync-pricing
export const useSyncPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncPricing,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-pricing"]); // Invalidate pricing data after sync
    },
    onError: (error) => {
      console.error("Error syncing pricing data:", error);
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
