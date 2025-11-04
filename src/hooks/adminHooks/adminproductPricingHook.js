import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import fileApi from "../../index/admin/fileapi";
import multipartApi from "../../index/admin/multipartApi";

const buildQueryString = ({
  region,
  provider,
  page,
  perPage,
  search,
  productType,
}) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (provider) params.append("provider", provider);
  if (page) params.append("page", page);
  if (perPage) params.append("per_page", perPage);
  if (search) params.append("search", search);
  if (productType) params.append("productable_type", productType);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res) => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchProductPricing = async ({
  region,
  provider,
  page,
  perPage,
  search,
  productType,
}) => {
  const queryString = buildQueryString({
    region,
    provider,
    page,
    perPage,
    search,
    productType,
  });
  const res = await silentApi("GET", `/product-pricing${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch product pricing");
  }
  return payload;
};

const createProductPricing = async (pricingData) => {
  const res = await api("POST", "/product-pricing", pricingData);
  if (!res) {
    throw new Error("Failed to create product pricing");
  }
  return res;
};

const updateProductPricing = async ({ id, pricingData }) => {
  if (!id) {
    throw new Error("Pricing identifier is required");
  }
  const res = await api("PATCH", `/product-pricing/${id}`, pricingData);
  if (!res) {
    throw new Error(`Failed to update product pricing with ID ${id}`);
  }
  return res;
};

const deleteProductPricing = async (id) => {
  if (!id) {
    throw new Error("Pricing identifier is required");
  }
  const res = await api("DELETE", `/product-pricing/${id}`);
  if (!res) {
    throw new Error(`Failed to delete product pricing with ID ${id}`);
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

export const useFetchProductPricing = (
  {
    region = "",
    provider = "",
    page = 1,
    perPage = 10,
    search = "",
    productType = "",
  } = {},
  options = {}
) => {
  return useQuery({
    queryKey: [
      "product-pricing-admin",
      region,
      provider,
      page,
      perPage,
      search,
      productType,
    ],
    queryFn: () =>
      fetchProductPricing({
        region,
        provider,
        page,
        perPage,
        search,
        productType,
      }),
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

export const useUpdateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error) => {
      console.error("Error updating product pricing:", error);
    },
  });
};

export const useDeleteProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error) => {
      console.error("Error deleting product pricing:", error);
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
