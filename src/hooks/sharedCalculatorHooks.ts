import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import config from "../config";
import { resolveActivePersona } from "../stores/sessionUtils";
import ToastUtils from "../utils/toastUtil";
import silentApi from "../index/silent";
import silentAdminApi from "../index/admin/silent";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type SharedMode = "admin" | "tenant" | "client";
type JsonRecord = Record<string, unknown>;

interface SharedApiResponse<TData = unknown> {
  data?: TData;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

interface AuthConfig {
  baseURL: string;
  headers: Record<string, string>;
}

interface CalculatorOptionsParams {
  tenant_id?: string | number;
  region?: string;
}

interface SharedCalculatorOptionsInput {
  tenantId?: string | number;
  region?: string;
}

interface ClientRecord extends JsonRecord {
  tenant_id?: string | number;
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  if (isRecord(error)) {
    const nestedData = isRecord(error.data) ? error.data : null;

    if (typeof nestedData?.error === "string" && nestedData.error.trim() !== "") {
      return nestedData.error;
    }

    if (typeof error.error === "string" && error.error.trim() !== "") {
      return error.error;
    }

    if (typeof error.message === "string" && error.message.trim() !== "") {
      return error.message;
    }
  }

  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }

  return fallback;
};

// Determine user context for base URL and headers (cookie auth)
const getAuthConfig = (): AuthConfig => {
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
const sharedApiCall = async <
  TResponse = SharedApiResponse,
  TBody extends JsonRecord | null = JsonRecord | null,
>(
  method: HttpMethod,
  uri: string,
  body: TBody = null as TBody
): Promise<TResponse | null> => {
  const { baseURL, headers } = getAuthConfig();
  const url = baseURL + uri;

  const options: RequestInit = {
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
        const errorData = (await response.json()) as unknown;
        errorMessage = getErrorMessage(errorData, errorMessage);
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
      return (await response.json()) as TResponse;
    } catch (jsonError) {
      console.error("Failed to parse successful response as JSON:", jsonError);
      throw new Error("Server returned invalid JSON response");
    }
  } catch (error) {
    // Handle network errors and other fetch failures
    if (error instanceof Error && error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Network error: Unable to connect to the server. Please check your internet connection."
      );
    }

    throw error;
  }
};

// ================================
// SHARED CALCULATOR HOOKS
// ================================

// Calculator Options (shared endpoint)
const fetchCalculatorOptions = async ({
  tenant_id,
  region,
}: CalculatorOptionsParams = {}): Promise<unknown> => {
  const params = new URLSearchParams();

  if (tenant_id) {
    params.append("tenant_id", String(tenant_id));
  }

  if (region) {
    params.append("region", region);
  }

  const queryString = params.toString();
  const res = await sharedApiCall<SharedApiResponse<unknown>>(
    "GET",
    `/calculator-options${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch calculator options");
  }

  return res.data;
};

export const useSharedCalculatorOptions = (
  { tenantId, region }: SharedCalculatorOptionsInput = {},
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["shared-calculator-options", { tenantId, region }],
    queryFn: () => fetchCalculatorOptions({ tenant_id: tenantId, region }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Calculator Pricing (shared endpoint)
const calculatePricing = async (pricingData: JsonRecord): Promise<unknown> => {
  try {
    console.log("Calculating pricing with payload:", pricingData);
    const res = await sharedApiCall<SharedApiResponse<unknown>, JsonRecord>(
      "POST",
      "/calculator/pricing",
      pricingData
    );
    console.log("Pricing calculation response:", res);

    // Handle different response structures
    if (res?.data) {
      return res.data;
    }

    if (res && typeof res === "object") {
      // Response might be the data itself
      return res;
    }

    throw new Error("Invalid pricing calculation response format");
  } catch (error) {
    console.error("Error in calculatePricing:", error);
    // Re-throw with more descriptive error message
    throw new Error(
      getErrorMessage(
        error,
        "Failed to calculate pricing. Please check your configuration and try again."
      )
    );
  }
};

export const useSharedCalculatorPricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: calculatePricing,
    onSuccess: () => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ["pricing-calculations"] });
    },
    onError: (error) => {
      console.error("Error calculating pricing:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to calculate pricing"));
    },
  });
};

// Multi-Quotes (shared endpoint)
const createMultiQuotes = async (quoteData: JsonRecord): Promise<unknown> => {
  const res = await sharedApiCall<SharedApiResponse<unknown>, JsonRecord>(
    "POST",
    "/multi-quotes",
    quoteData
  );

  if (!res) {
    throw new Error("Failed to create multi-quotes");
  }

  return res;
};

export const useSharedMultiQuotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMultiQuotes,
    onSuccess: () => {
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
const previewMultiQuotes = async (quoteData: JsonRecord): Promise<unknown> => {
  const res = await sharedApiCall<SharedApiResponse<unknown>, JsonRecord>(
    "POST",
    "/quote-previews",
    quoteData
  );

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
const fetchClients = async (): Promise<ClientRecord[]> => {
  const { baseURL } = getAuthConfig();

  // Use appropriate endpoint based on user type
  const endpoint = baseURL.includes("/admin") ? "/clients" : "/clients";
  const res = await sharedApiCall<SharedApiResponse<unknown[]>>("GET", endpoint);

  if (!res?.data) {
    throw new Error("Failed to fetch clients");
  }

  return Array.isArray(res.data) ? (res.data as ClientRecord[]) : [];
};

// Shared Regions Hook
const fetchRegions = async (mode: SharedMode): Promise<unknown[]> => {
  if (mode === "admin") {
    const res = await silentAdminApi<{ data?: unknown[] }>("GET", "/regions");
    if (!res?.data) throw new Error("Failed to fetch regions");
    return Array.isArray(res.data) ? res.data : [];
  }

  // Use public regions endpoint for tenants/clients
  const res = await silentApi<{ data?: unknown[] }>("GET", "/regions");
  if (!res?.data) throw new Error("Failed to fetch regions");
  return Array.isArray(res.data) ? res.data : [];
};

export const useSharedFetchRegions = (
  mode: SharedMode = "client",
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["shared-regions", mode],
    queryFn: () => fetchRegions(mode),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useSharedClients = (
  tenantId: string | null = null,
  options: Omit<UseQueryOptions<ClientRecord[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["shared-clients", { tenantId }],
    queryFn: fetchClients,
    select: (data) => {
      // Filter clients based on tenantId for admin users
      if (tenantId && Array.isArray(data)) {
        const tenantNumericId = Number(tenantId);

        return data.filter((client) => {
          if (client.tenant_id === undefined || client.tenant_id === null) {
            return false;
          }

          return client.tenant_id === tenantId || Number(client.tenant_id) === tenantNumericId;
        });
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
