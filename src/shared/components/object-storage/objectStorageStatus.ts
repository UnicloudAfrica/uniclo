/**
 * Derive object-storage account readiness from the API resource shape.
 *
 * `ObjectStorageAccountResource` exposes `status` and a singular
 * `default_access_key` (non-null once provisioning has minted an S3 key) — NOT
 * an `access_keys` array. Bucket creation is gated server-side on
 * `accessKeys()->exists()`, so "ready" mirrors that: a default access key
 * exists, or the account reached `active`. Legacy/other shapes that send an
 * access-key array are still honoured.
 *
 * Producer: api ObjectStorageAccountResource::toArray (default_access_key, status).
 */
export interface ObjectStorageReadiness {
  ready: boolean;
  failed: boolean;
}

export function resolveObjectStorageReadiness(account: unknown): ObjectStorageReadiness {
  const a =
    (account as {
      status?: string;
      default_access_key?: unknown;
      access_keys?: unknown[];
      accessKeys?: unknown[];
    } | null) ?? null;

  const ready =
    Boolean(a?.default_access_key) ||
    a?.status === "active" ||
    (Array.isArray(a?.access_keys) && a.access_keys.length > 0) ||
    (Array.isArray(a?.accessKeys) && a.accessKeys.length > 0);

  const failed = a?.status === "provision_failed";

  return { ready, failed };
}
