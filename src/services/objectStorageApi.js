import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import useClientAuthStore from "../stores/clientAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";
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

const storageFallbackKeys = [
  { key: "unicloud_admin_auth", role: "admin" },
  { key: "unicloud_client_auth", role: "client" },
  { key: "unicloud_tenant_auth", role: "tenant" },
];

const readPersistedAuth = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return { token: null, role: null };
  }

  for (const entry of storageFallbackKeys) {
    try {
      const raw = window.localStorage.getItem(entry.key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const state = parsed?.state ?? parsed;
      const token = state?.token;
      if (!token) continue;
      const role = entry.role ?? state?.role ?? null;
      return {
        token,
        role,
        isCentralDomain: state?.isCentralDomain,
        currentTenant: state?.currentTenant ?? null,
      };
    } catch (error) {
      console.warn(`Unable to parse auth store ${entry.key}`, error);
    }
  }

  return { token: null, role: null };
};

const resolveAuthSnapshot = () => {
  const { key, snapshot } = resolveActivePersona();
  if (snapshot?.token) {
    return {
      token: snapshot.token,
      role: snapshot.role ?? key,
      isCentralDomain: snapshot.isCentralDomain,
      currentTenant: snapshot.currentTenant ?? snapshot.tenant ?? null,
      tenant: snapshot.tenant ?? snapshot.currentTenant ?? null,
      domain: snapshot.domain ?? null,
    };
  }

  return readPersistedAuth();
};

const resolveBasePath = (snapshot) => {
  const role = (snapshot?.role || "").toLowerCase();
  if (role === "admin") return roleBasePath.admin;
  if (role === "tenant") return roleBasePath.tenant;
  if (role === "client") return roleBasePath.client;
  return roleBasePath.client;
};

const resolveRequestContext = () => {
  const snapshot = resolveAuthSnapshot();
  const { token } = snapshot;
  if (!token) {
    throw new Error("Missing authentication token. Please sign in again.");
  }

  const basePath = resolveBasePath(snapshot);
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const tenantSlug =
    snapshot?.currentTenant?.slug ||
    snapshot?.tenant?.slug ||
    snapshot?.domain?.slug ||
    snapshot?.tenant?.domain?.slug ||
    snapshot?.domain?.name ||
    null;

  if (basePath === roleBasePath.tenant && tenantSlug) {
    headers["X-Tenant-Slug"] = tenantSlug;
  }

  return { basePath, headers };
};

const objectStorageApi = {
  async fetchAccount(accountId) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/accounts/${accountId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to fetch account details.";
      throw new Error(message);
    }

    return data?.data ?? data;
  },
  async fetchAccounts(params = {}) {
    const { basePath, headers } = resolveRequestContext();
    const query = new URLSearchParams(params).toString();
    const url = `${basePath}/accounts${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to fetch object storage accounts.";
      throw new Error(message);
    }

    const unwrapPayload = (payload) => {
      if (!payload) {
        return {
          items: [],
          meta: null,
          links: null,
        };
      }

      if (Array.isArray(payload)) {
        return { items: payload, meta: payload.meta ?? null, links: payload.links ?? null };
      }

      if (Array.isArray(payload?.data)) {
        return {
          items: payload.data,
          meta: payload.meta ?? payload.pagination ?? null,
          links: payload.links ?? null,
        };
      }

      if (payload?.data?.data && Array.isArray(payload.data.data)) {
        return {
          items: payload.data.data,
          meta:
            payload.data.meta ??
            payload.meta ??
            payload.data.pagination ??
            payload.pagination ??
            null,
          links: payload.data.links ?? payload.links ?? null,
        };
      }

      if (Array.isArray(payload?.items)) {
        return {
          items: payload.items,
          meta: payload.meta ?? payload.pagination ?? null,
          links: payload.links ?? null,
        };
      }

      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      return {
        items,
        meta: payload.meta ?? payload.pagination ?? null,
        links: payload.links ?? null,
      };
    };

    const payload = unwrapPayload(data?.data ?? data);
    return {
      items: payload.items ?? [],
      meta: payload.meta ?? data?.meta ?? data?.pagination ?? null,
      links: payload.links ?? data?.links ?? null,
    };
  },
  async createOrder(payload) {
    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      const message = data?.message || data?.error || "Failed to create object storage order.";
      throw new Error(message);
    }

    return data;
  },
  async fetchBuckets(accountId, params = {}) {
    if (!accountId) {
      throw new Error("Account ID is required to load buckets.");
    }
    const { basePath, headers } = resolveRequestContext();
    const query = new URLSearchParams(params).toString();
    const url = `${basePath}/accounts/${accountId}/buckets${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to fetch buckets.";
      throw new Error(message);
    }

    return data?.data ?? [];
  },
  async createBucket(accountId, payload) {
    if (!accountId) {
      throw new Error("Account ID is required to create a bucket.");
    }
    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/accounts/${accountId}/buckets`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      const message = data?.message || data?.error || "Failed to create bucket.";
      throw new Error(message);
    }

    return data;
  },
  async deleteBucket(accountId, bucketId) {
    if (!accountId || !bucketId) {
      throw new Error("Account and bucket identifiers are required.");
    }

    const { basePath, headers } = resolveRequestContext();
    const response = await fetch(`${basePath}/accounts/${accountId}/buckets/${bucketId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || data?.error || "Failed to delete bucket.";
      throw new Error(message);
    }

    return true;
  },

  // File browser operations
  async listObjects(accountId, bucketName, prefix = "") {
    if (!accountId || !bucketName) {
      throw new Error("Account and bucket identifiers are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const params = new URLSearchParams();
    if (prefix) params.set("prefix", prefix);
    const query = params.toString();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/objects${query ? `?${query}` : ""}`;

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to list objects.";
      throw new Error(message);
    }
    return data?.data ?? data;
  },

  async getObjectUrl(accountId, bucketName, objectKey) {
    if (!accountId || !bucketName || !objectKey) {
      throw new Error("Account, bucket, and object key are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/objects/url`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ key: objectKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to get object URL.";
      throw new Error(message);
    }
    return data?.url ?? data;
  },

  async deleteObject(accountId, bucketName, objectKey) {
    if (!accountId || !bucketName || !objectKey) {
      throw new Error("Account, bucket, and object key are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/objects`;

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ key: objectKey }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || data?.error || "Failed to delete object.";
      throw new Error(message);
    }
    return true;
  },

  async getUploadUrl(accountId, bucketName, objectKey, contentType) {
    if (!accountId || !bucketName || !objectKey) {
      throw new Error("Account, bucket, and object key are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/buckets/${bucketName}/upload-url`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ key: objectKey, content_type: contentType }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to get upload URL.";
      throw new Error(message);
    }
    return data;
  },

  /**
   * Upload file directly through the backend (bypasses CORS issues)
   */
  async uploadFile(accountId, bucketName, objectKey, file) {
    if (!accountId || !bucketName || !objectKey || !file) {
      throw new Error("Account, bucket, object key, and file are required.");
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
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to upload file.";
      throw new Error(message);
    }
    return data;
  },

  /**
   * Check if secret key can be revealed (one-time only)
   */
  async checkSecretStatus(accountId, accessKeyId) {
    if (!accountId || !accessKeyId) {
      throw new Error("Account ID and Access Key ID are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/keys/${accessKeyId}/secret-status`;

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to check secret status.";
      throw new Error(message);
    }
    return data;
  },

  /**
   * Reveal secret key (one-time only - can never be shown again after this)
   */
  async revealSecretKey(accountId, accessKeyId) {
    if (!accountId || !accessKeyId) {
      throw new Error("Account ID and Access Key ID are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/keys/${accessKeyId}/reveal-secret`;

    const response = await fetch(url, {
      method: "POST",
      headers,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to reveal secret key.";
      throw new Error(message);
    }
    return data;
  },

  /**
   * Get usage analytics for an account (trends, forecasts)
   */
  async getAnalytics(accountId) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/analytics`;

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to get analytics.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Get extension pricing options for an account
   */
  async getExtensionPricing(accountId) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/extension-pricing`;

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to get extension pricing.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Extend storage quota (initiates payment)
   */
  async extendStorage(accountId, additionalGb, months = 1, fastTrack = false) {
    if (!accountId || !additionalGb) {
      throw new Error("Account ID and additional GB are required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/extend`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        additional_gb: additionalGb,
        months,
        fast_track: fastTrack,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to extend storage.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  // ─── Subscription Management ─────────────────────────────────────

  /**
   * Get subscription details for an account
   */
  async getSubscription(accountId) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/subscription`;

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to fetch subscription.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Update subscription settings (e.g., toggle auto-renew)
   */
  async updateSubscription(accountId, settings) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/subscription`;

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(settings),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to update subscription.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Renew subscription
   */
  async renewSubscription(accountId, months = 1) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/renew`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ months }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to renew subscription.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(accountId, reason = null) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/cancel`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to cancel subscription.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(accountId) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/reactivate`;

    const response = await fetch(url, { method: "POST", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to reactivate subscription.";
      throw new Error(message);
    }
    return data?.data || data;
  },

  /**
   * Get all transactions for an account
   */
  async getTransactions(accountId) {
    if (!accountId) {
      throw new Error("Account ID is required.");
    }
    const { basePath, headers } = resolveRequestContext();
    const url = `${basePath}/accounts/${accountId}/transactions`;

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || "Failed to fetch transactions.";
      throw new Error(message);
    }
    return data?.data || data;
  },
};

export default objectStorageApi;
