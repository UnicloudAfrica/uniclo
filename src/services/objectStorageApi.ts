import config from "../config";
import { resolveActivePersona } from "../stores/sessionUtils";

/**
 * Object Storage API helper
 *
 * Personas:
 * - Admin → admin-dashboard → `${config.adminURL}`
 * - Tenant → dashboard → `${config.tenantURL}/admin`
 * - Client → client-dashboard → `${config.baseURL}`
 */
const BUSINESS_OBJECT_STORAGE_BASE = `${config.baseURL}/business/object-storage`;

const roleBasePath = {
  admin: `${config.adminURL}/object-storage`,
  tenant: `${config.tenantURL}/admin/object-storage`,
  client: BUSINESS_OBJECT_STORAGE_BASE,
};

type Id = string | number;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type JsonRecord = Record<string, unknown>;

const resolveBasePath = (role: string | null | undefined) => {
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole === "admin") return roleBasePath.admin;
  if (normalizedRole === "tenant") return roleBasePath.tenant;
  if (normalizedRole === "client") return roleBasePath.client;
  return roleBasePath.client;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const extractMessage = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (isRecord(value) && typeof value.message === "string" && value.message.trim() !== "") {
    return value.message;
  }
  return undefined;
};

const getErrorMessage = (payload: unknown, fallback: string): string => {
  const record = asRecord(payload);
  return (
    extractMessage(record.message) ||
    (typeof record.error === "string" ? record.error : undefined) ||
    fallback
  );
};

const toQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    return true;
  });
  if (entries.length === 0) return "";
  return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
};

const resolveRequestContext = () => {
  const { key, snapshot } = resolveActivePersona();
  if (!snapshot?.isAuthenticated) {
    throw new Error("Missing authentication session. Please sign in again.");
  }

  const role = snapshot.role ?? key;
  const basePath = resolveBasePath(role);
  const headers =
    typeof snapshot.getAuthHeaders === "function"
      ? snapshot.getAuthHeaders()
      : {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

  return { basePath, headers };
};

const objectStorageApi = {
  async fetchAccount(accountId: Id) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/accounts/${accountId}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to fetch account details."));
    }

    const record = asRecord(data);
    return record.data ?? record;
  },
  async fetchAccounts(params: QueryParams = {}) {
    const { basePath, headers } = resolveRequestContext();
    const query = toQueryString(params);
    const url = `${basePath}/accounts${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to fetch Silo Storage accounts."));
    }

    const unwrapPayload = (payload: unknown) => {
      if (!payload) {
        return {
          items: [],
          meta: null,
          links: null,
        };
      }

      if (Array.isArray(payload)) {
        return { items: payload, meta: null, links: null };
      }

      const payloadRecord = asRecord(payload);

      if (Array.isArray(payloadRecord.data)) {
        return {
          items: payloadRecord.data,
          meta: payloadRecord.meta ?? payloadRecord.pagination ?? null,
          links: payloadRecord.links ?? null,
        };
      }

      const nestedData = asRecord(payloadRecord.data);

      if (Array.isArray(nestedData.data)) {
        return {
          items: nestedData.data,
          meta:
            nestedData.meta ??
            payloadRecord.meta ??
            nestedData.pagination ??
            payloadRecord.pagination ??
            null,
          links: nestedData.links ?? payloadRecord.links ?? null,
        };
      }

      if (Array.isArray(payloadRecord.items)) {
        return {
          items: payloadRecord.items,
          meta: payloadRecord.meta ?? payloadRecord.pagination ?? null,
          links: payloadRecord.links ?? null,
        };
      }

      return {
        items: [],
        meta: payloadRecord.meta ?? payloadRecord.pagination ?? null,
        links: payloadRecord.links ?? null,
      };
    };

    const record = asRecord(data);
    const payload = unwrapPayload(record.data ?? record);
    return {
      items: payload.items ?? [],
      meta: payload.meta ?? record.meta ?? record.pagination ?? null,
      links: payload.links ?? record.links ?? null,
    };
  },
  async createOrder(payload: JsonRecord) {
    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/orders`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    const record = asRecord(data);
    if (!response.ok || record.success === false) {
      throw new Error(getErrorMessage(data, "Failed to create Silo Storage order."));
    }

    return data;
  },
  async fetchBuckets(accountId: Id, params: QueryParams = {}) {
    if (!accountId) {
      throw new Error("Account ID is required to load silos.");
    }
    const { basePath, headers } = resolveRequestContext();
    const query = toQueryString(params);
    const url = `${basePath}/accounts/${accountId}/buckets${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to fetch silos."));
    }

    const record = asRecord(data);
    return record.data ?? [];
  },
  async createBucket(accountId: Id, payload: JsonRecord) {
    if (!accountId) {
      throw new Error("Account ID is required to create a silo.");
    }
    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/accounts/${accountId}/buckets`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    const record = asRecord(data);
    if (!response.ok || record.success === false) {
      throw new Error(getErrorMessage(data, "Failed to create silo."));
    }

    return data;
  },
  async deleteBucket(accountId: Id, bucketId: Id) {
    if (!accountId || !bucketId) {
      throw new Error("Account and silo identifiers are required.");
    }

    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/accounts/${accountId}/buckets/${bucketId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, "Failed to delete silo."));
    }

    return true;
  },

  // File browser operations
  async listObjects(accountId: Id, bucketName: string, prefix: string = "") {
    if (!accountId || !bucketName) {
      throw new Error("Account and silo identifiers are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const params = new URLSearchParams();
    if (prefix) params.set("prefix", prefix);
    const query = params.toString();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/objects${query ? `?${query}` : ""}`;

    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to list objects."));
    }
    const record = asRecord(data);
    return record.data ?? record;
  },

  async getObjectUrl(accountId: Id, bucketName: string, objectKey: string) {
    if (!accountId || !bucketName || !objectKey) {
      throw new Error("Account, silo, and object key are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/objects/url`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ key: objectKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to get object URL."));
    }
    const record = asRecord(data);
    return record.url ?? record;
  },

  async deleteObject(accountId: Id, bucketName: string, objectKey: string) {
    if (!accountId || !bucketName || !objectKey) {
      throw new Error("Account, silo, and object key are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/objects`;

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
      body: JSON.stringify({ key: objectKey }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, "Failed to delete object."));
    }
    return true;
  },

  async getUploadUrl(accountId: Id, bucketName: string, objectKey: string, contentType?: string) {
    if (!accountId || !bucketName || !objectKey) {
      throw new Error("Account, silo, and object key are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/upload-url`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ key: objectKey, content_type: contentType }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to get upload URL."));
    }
    return data;
  },

  /**
   * Upload file directly through the backend (bypasses CORS issues)
   */
  async uploadFile(accountId: Id, bucketName: string, objectKey: string, file: File | Blob) {
    if (!accountId || !bucketName || !objectKey || !file) {
      throw new Error("Account, silo, object key, and file are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/upload`;

    // Use FormData for file upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", objectKey);

    // Remove Content-Type header so browser sets it with boundary for multipart
    const uploadHeaders = { ...headers };
    delete uploadHeaders["Content-Type"];

    const response = await fetch(url, {
      method: "POST",
      headers: uploadHeaders,
      credentials: "include",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to upload file."));
    }
    return data;
  },

  /**
   * Check if secret key can be revealed (one-time only)
   */
  async checkSecretStatus(accountId: Id, accessKeyId: Id) {
    if (!accountId || !accessKeyId) {
      throw new Error("Account ID and Access Key ID are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/keys/${accessKeyId}/secret-status`;

    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to check secret status."));
    }
    return data;
  },

  /**
   * Reveal secret key (one-time only - can never be shown again after this)
   */
  async revealSecretKey(accountId: Id, accessKeyId: Id) {
    if (!accountId || !accessKeyId) {
      throw new Error("Account ID and Access Key ID are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/keys/${accessKeyId}/reveal-secret`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to reveal secret key."));
    }
    return data;
  },

  /**
   * Create a new access key (rotation).
   */
  async createAccessKey(accountId: Id, payload: JsonRecord = {}) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/keys`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to create access key."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Revoke an access key.
   */
  async revokeAccessKey(accountId: Id, accessKeyId: Id) {
    if (!accountId || !accessKeyId) {
      throw new Error("Account ID and Access Key ID are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/keys/${accessKeyId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, "Failed to revoke access key."));
    }

    return true;
  },

  /**
   * Get usage analytics for an account (trends, forecasts)
   */
  async getAnalytics(accountId: Id) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/analytics`;

    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to get analytics."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Get extension pricing options for an account
   */
  async getExtensionPricing(accountId: Id) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/extension-pricing`;

    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to get extension pricing."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Extend storage quota (initiates payment)
   */
  async extendStorage(
    accountId: Id,
    additionalGb: number,
    months: number = 1,
    fastTrack: boolean = false
  ) {
    if (!accountId || !additionalGb) {
      throw new Error("Account ID and additional GB are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/extend`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        additional_gb: additionalGb,
        months,
        fast_track: fastTrack,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to extend storage."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  // ─── Subscription Management ─────────────────────────────────────

  /**
   * Get subscription details for an account
   */
  async getSubscription(accountId: Id) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/subscription`;

    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to fetch subscription."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Update subscription settings (e.g., toggle auto-renew)
   */
  async updateSubscription(accountId: Id, settings: JsonRecord) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/subscription`;

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(settings),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to update subscription."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Renew subscription
   */
  async renewSubscription(accountId: Id, months: number = 1) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/renew`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ months }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to renew subscription."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(accountId: Id, reason: string | null = null) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/cancel`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ reason }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to cancel subscription."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(accountId: Id) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/reactivate`;

    const response = await fetch(url, { method: "POST", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to reactivate subscription."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  /**
   * Get all transactions for an account
   */
  async getTransactions(accountId: Id) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/transactions`;

    const response = await fetch(url, { method: "GET", headers, credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Failed to fetch transactions."));
    }
    const record = asRecord(data);
    return record.data || record;
  },

  // Delete an Silo Storage account (admin only)
  async deleteAccount(accountId: Id) {
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}`;
    const response = await fetch(url, { method: "DELETE", headers, credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, "Failed to delete account."));
    }
    return true;
  },
};

export default objectStorageApi;
