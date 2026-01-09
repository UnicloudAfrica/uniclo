import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import config from "../config";
import { resolveActivePersona } from "../stores/sessionUtils";
import ToastUtils from "../utils/toastUtil.ts";
import silentApi from "../index/silent";
import silentAdminApi from "../index/admin/silent";

// Determine user context for base URL and headers (cookie auth)
const getAuthConfig = () => {
  const { key, snapshot } = resolveActivePersona();
  const role = (snapshot?.role || key || "").toLowerCase();

  if (role === "admin") {
    return {
      baseURL: config.adminURL,
      headers: snapshot?.getAuthHeaders?.() || {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
  }

  if (role === "tenant") {
    return {
      baseURL: `${config.tenantURL}/admin`,
      headers: snapshot?.getAuthHeaders?.() || {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
  }

  if (role === "client") {
    return {
      baseURL: config.baseURL,
      headers: snapshot?.getAuthHeaders?.() || {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
  }

  return {
    baseURL: config.baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};

// Shared API call function
const sharedApiCall = async (method, uri, body = null) => {
  const { baseURL, headers } = getAuthConfig();
  const url = baseURL + uri;

  const options = {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);

    // Check if response is ok before trying to parse JSON
    if (!response.ok && response.status !== 201) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage =
          errorData?.data?.error || errorData?.error || errorData?.message || errorMessage;
      } catch (jsonError) {
        // Response might not be JSON, use status text
        console.warn("Could not parse error response as JSON:", jsonError);
      }

      if (response.status === 401) {
        ToastUtils.error("Session expired. Please login again.");
        // Let individual auth stores handle redirect logic
        return null;
      }

      throw new Error(errorMessage);
    }

    // Try to parse successful response
    try {
      const res = await response.json();
      return res;
    } catch (jsonError) {
      console.error("Failed to parse successful response as JSON:", jsonError);
      throw new Error("Server returned invalid JSON response");
    }
  } catch (err) {
    // Handle network errors and other fetch failures
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(
        "Network error: Unable to connect to the server. Please check your internet connection."
      );
    }
    throw err;
  }
};

// ================================
// SHARED CALCULATOR HOOKS
// ================================

// Calculator Options (shared endpoint)
const fetchCalculatorOptions = async ({ tenant_id, region } = {}) => {
  const params = new URLSearchParams();
  if (tenant_id) {
    params.append("tenant_id", tenant_id);
  }
  if (region) {
    params.append("region", region);
  }

  const queryString = params.toString();
  const res = await sharedApiCall(
    "GET",
    `/calculator-options${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch calculator options");
  }
  return res.data;
};

export const useSharedCalculatorOptions = ({ tenantId, region } = {}, options = {}) => {
  return useQuery({
    queryKey: ["shared-calculator-options", { tenantId, region }],
    queryFn: () => fetchCalculatorOptions({ tenant_id: tenantId, region }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Calculator Pricing (shared endpoint)
const calculatePricing = async (pricingData) => {
  try {
    console.log("Calculating pricing with payload:", pricingData);
    const res = await sharedApiCall("POST", "/calculator/pricing", pricingData);
    console.log("Pricing calculation response:", res);

    // Handle different response structures
    if (res?.data) {
      return res.data;
    } else if (res && typeof res === "object") {
      // Response might be the data itself
      return res;
    } else {
      throw new Error("Invalid pricing calculation response format");
    }
  } catch (error) {
    console.error("Error in calculatePricing:", error);
    // Re-throw with more descriptive error message
    throw new Error(
      error.message || "Failed to calculate pricing. Please check your configuration and try again."
    );
  }
};

export const useSharedCalculatorPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calculatePricing,
    onSuccess: (data) => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ["pricing-calculations"] });
    },
    onError: (error) => {
      console.error("Error calculating pricing:", error);
      ToastUtils.error(error.message || "Failed to calculate pricing");
    },
  });
};

// Multi-Quotes (shared endpoint)
const createMultiQuotes = async (quoteData) => {
  const res = await sharedApiCall("POST", "/multi-quotes", quoteData);
  if (!res) {
    throw new Error("Failed to create multi-quotes");
  }
  return res;
};

export const useSharedMultiQuotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultiQuotes,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      // Don't show automatic success toast here as components handle their own success messages
    },
    onError: (error) => {
      console.error("Error creating multi-quotes:", error);
      // Don't show automatic error toast here as components handle their own error messages
    },
  });
};

// Multi-Quote Preview (shared endpoint)
const previewMultiQuotes = async (quoteData) => {
  const res = await sharedApiCall("POST", "/quote-previews", quoteData);
  if (!res) {
    throw new Error("Failed to preview multi-quotes");
  }
  return res;
};

export const useSharedMultiQuotePreviews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: previewMultiQuotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-previews"] });
    },
    onError: (error) => {
      console.error("Error previewing multi-quotes:", error);
    },
  });
};

// Shared Client Fetching Hook
const fetchClients = async () => {
  const { baseURL } = getAuthConfig();

  // Use appropriate endpoint based on user type
  const endpoint = baseURL.includes("/admin") ? "/clients" : "/clients";
  const res = await sharedApiCall("GET", endpoint);

  if (!res?.data) {
    throw new Error("Failed to fetch clients");
  }
  return res.data;
};

// Shared Regions Hook
const fetchRegions = async (mode) => {
  if (mode === "admin") {
    const res = await silentAdminApi("GET", "/regions");
    if (!res?.data) throw new Error("Failed to fetch regions");
    return res.data;
  } else {
    // Use public regions endpoint for tenants/clients
    const res = await silentApi("GET", "/regions");
    if (!res?.data) throw new Error("Failed to fetch regions");
    return res.data;
  }
};

export const useSharedFetchRegions = (mode = "client", options = {}) => {
  return useQuery({
    queryKey: ["shared-regions", mode],
    queryFn: () => fetchRegions(mode),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useSharedClients = (tenantId = null, options = {}) => {
  return useQuery({
    queryKey: ["shared-clients", { tenantId }],
    queryFn: fetchClients,
    select: (data) => {
      // Filter clients based on tenantId for admin users
      if (tenantId && Array.isArray(data)) {
        return data.filter(
          (client) => client.tenant_id === parseInt(tenantId) || client.tenant_id === tenantId
        );
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
