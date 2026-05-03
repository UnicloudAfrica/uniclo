/**
 * Intended-URL stash for deep-linked auth flows.
 *
 * When a route guard bounces an unauthenticated user to a sign-in page,
 * the URL they were trying to reach is stashed here so the post-login
 * destination handler can restore it. Survives the multi-step admin
 * flow (`/admin-signin` → `/verify-admin-mail` → `/admin-dashboard/...`)
 * because we use sessionStorage instead of route state.
 *
 * Each role gets its own bucket so an admin and a tenant on the same
 * machine can't cross-contaminate each other's intended URLs.
 */

type AuthScope = "admin" | "tenant" | "client";

const KEY_PREFIX = "intended_path:";

const safeStorage = (() => {
  try {
    if (typeof globalThis.window === "undefined") return null;
    return globalThis.window.sessionStorage;
  } catch {
    return null;
  }
})();

const isSafePath = (path: string): boolean => {
  if (typeof path !== "string" || path === "") return false;
  // Allow only same-origin paths. Reject absolute URLs or protocol-relative
  // paths so we never redirect to an attacker-supplied off-site URL.
  if (path.startsWith("//")) return false;
  if (!path.startsWith("/")) return false;
  // Defang anything that looks like javascript: or data: schemes after
  // pathological URL parsing.
  if (/^\/?\s*(javascript|data):/i.test(path)) return false;
  // Don't loop back to a sign-in page.
  if (/\/(admin-)?(sign[-_]?in|signup|signout|verify[-_]?(admin[-_]?)?mail)\b/i.test(path)) {
    return false;
  }
  return true;
};

export const stashIntendedPath = (scope: AuthScope, path: string | null | undefined): void => {
  if (!safeStorage) return;
  if (!path || !isSafePath(path)) return;
  try {
    safeStorage.setItem(`${KEY_PREFIX}${scope}`, path);
  } catch {
    // Best-effort — full quotas / disabled storage shouldn't break login.
  }
};

export const popIntendedPath = (scope: AuthScope): string | null => {
  if (!safeStorage) return null;
  try {
    const value = safeStorage.getItem(`${KEY_PREFIX}${scope}`);
    if (value) safeStorage.removeItem(`${KEY_PREFIX}${scope}`);
    return value && isSafePath(value) ? value : null;
  } catch {
    return null;
  }
};

export const clearIntendedPath = (scope: AuthScope): void => {
  if (!safeStorage) return;
  try {
    safeStorage.removeItem(`${KEY_PREFIX}${scope}`);
  } catch {
    // ignore
  }
};
