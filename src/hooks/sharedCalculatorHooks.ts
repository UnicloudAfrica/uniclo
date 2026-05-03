import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import config from "../config";
import { resolveActivePersona } from "../stores/sessionUtils";
import ToastUtils from "../utils/toastUtil";
import silentApi from "../index/silent";
import silentAdminApi from "../index/admin/silent";
import logger from "../utils/logger";

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

// ─── Sanctum CSRF helpers ─────────────────────────────────────────────
// The shared calculator endpoints sit behind Laravel Sanctum's stateful
// SPA guard, so every state-changing request needs to send the
// `X-XSRF-TOKEN` header that mirrors the `XSRF-TOKEN` cookie. Without
// this, Laravel returns 419 "CSRF token mismatch". The rest of the app
// uses `createApiClient.ts` which already does this — `sharedApiCall`
// was the odd one out, and that's why "Calculate Pricing" was failing.

const readXsrfToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="));
  if (!match) return null;
  try {
    return decodeURIComponent(match.substring("XSRF-TOKEN=".length));
  } catch {
    return null;
  }
};

let csrfPrimed = false;

const ensureCsrfCookie = async (baseURL: string): Promise<void> => {
  if (csrfPrimed) return;
  try {
    const root = baseURL.replace(/\/api\/v\d+(?:\/admin)?\/?$/, "").replace(/\/+$/, "");
    const res = await fetch(`${root}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (res.ok) csrfPrimed = true;
  } catch (err) {
    logger.warn("Could not prime Sanctum CSRF cookie:", err);
  }
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

  const isStateChanging = method !== "GET" && method !== "HEAD";

  // Prime + attach the CSRF token on POST/PUT/PATCH/DELETE so Sanctum's
  // VerifyCsrfToken middleware accepts the request.
  let mergedHeaders: Record<string, string> = { ...headers };
  if (isStateChanging) {
    if (!readXsrfToken()) {
      await ensureCsrfCookie(baseURL);
    }
    const token = readXsrfToken();
    if (token) mergedHeaders["X-XSRF-TOKEN"] = token;
  }

  const options: RequestInit = {
    method,
    headers: mergedHeaders,
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  };

  try {
    let response = await fetch(url, options);

    // Sanctum returns 419 when the XSRF cookie has rotated out from
    // under us (idle session, server restart). Re-prime once and retry
    // the same request before surfacing the error.
    if (response.status === 419 && isStateChanging) {
      csrfPrimed = false;
      await ensureCsrfCookie(baseURL);
      const retryToken = readXsrfToken();
      if (retryToken) {
        mergedHeaders = { ...mergedHeaders, "X-XSRF-TOKEN": retryToken };
        response = await fetch(url, { ...options, headers: mergedHeaders });
      }
    }

    // Check if response is ok before trying to parse JSON
    if (!response.ok && response.status !== 201) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = (await response.json()) as unknown;
        errorMessage = getErrorMessage(errorData, errorMessage);
      } catch (jsonError) {
        // Response might not be JSON, use status text
        logger.warn("Could not parse error response as JSON:", jsonError);
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
      logger.error("Failed to parse successful response as JSON:", jsonError);
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
    logger.log("Calculating pricing with payload:", pricingData);
    const res = await sharedApiCall<SharedApiResponse<unknown>, JsonRecord>(
      "POST",
      "/calculator/pricing",
      pricingData
    );
    logger.log("Pricing calculation response:", res);

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
    logger.error("Error in calculatePricing:", error);
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
      logger.error("Error calculating pricing:", error);
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
      logger.error("Error creating multi-quotes:", error);
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
      logger.error("Error previewing multi-quotes:", error);
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
