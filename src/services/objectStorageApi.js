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
      const message =
        data?.message ||
        data?.error ||
        "Failed to fetch object storage accounts.";
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
};

export default objectStorageApi;
