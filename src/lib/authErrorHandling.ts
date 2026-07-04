/**
 * Shared 2FA / auth-error handling — the single source of truth consumed by
 * BOTH API clients (`lib/api.ts`'s unified client and `utils/createApiClient.ts`'s
 * axios-style factories).
 *
 * Why this module exists: the 2FA enrollment-routing and two-factor-required
 * flagging logic was duplicated across the two clients and drifted — a fix
 * applied to one regressed the other (the 2026-07-01 enrollment-blocker). This
 * module makes that class of bug structurally impossible: a future 2FA change
 * lands here and reaches both clients at once.
 *
 * Design: the two clients differ in HOW they resolve the acting role and HOW
 * they perform the terminal login-redirect. Those differences are parameterized
 * (role passed in; `onTwoFactorRequired` / `redirectToEnroll` are pure decisions
 * the caller acts on). The 2FA ROUTING itself — scope→page mapping, verify-page
 * mapping, return-to stashing, the routing-before-prevent-redirect-bail ordering
 * — is shared and identical for both.
 */
import type { AuthRole } from "../stores/authStore";

// ─── Return-to stashing ──────────────────────────────────────────────

// Session-storage key holding the in-app path to return the user to after
// they finish 2FA enrollment / verification. Written by routeTwoFactorRedirect
// (before it bounces the user to a 2FA page) and consumed by the enroll/verify
// pages via consumeTwoFactorReturnTo() on successful completion.
export const TWO_FACTOR_RETURN_TO_KEY = "twofactor:return_to";

// Paths that are themselves 2FA screens — we must never stash one of these as
// a return target, or the user would be sent back to a 2FA page after finishing.
const TWO_FACTOR_PATHS = new Set([
  "/admin-2fa-enroll",
  "/tenant-2fa-enroll",
  "/client-2fa-enroll",
  "/2fa-enroll",
  "/verify-admin-mail",
  "/verify-mail",
]);

/**
 * Stash the current location as the post-2FA return target, unless we're
 * already on a 2FA page (in which case there's nothing worth returning to and
 * we'd clobber a real target). `targetPath` is the 2FA page we're about to
 * send the user to. Wrapped in try/catch for Safari private mode.
 */
export const stashTwoFactorReturnTo = (targetPath: string): void => {
  if (typeof window === "undefined") return;
  const current = globalThis.window.location.pathname;
  if (current === targetPath || TWO_FACTOR_PATHS.has(current)) return;
  try {
    globalThis.window.sessionStorage.setItem(
      TWO_FACTOR_RETURN_TO_KEY,
      current + (globalThis.window.location.search || "")
    );
  } catch {
    // Best-effort — disabled/full storage shouldn't break the redirect.
  }
};

/**
 * Read and clear the post-2FA return target. Returns it only when it's a safe
 * in-app path: starts with "/", not protocol-relative ("//"), and carries no
 * scheme/host (no ":" before the first "/"). Otherwise returns null so the
 * caller keeps its default destination. Consumed by the enroll/verify pages.
 */
export const consumeTwoFactorReturnTo = (): string | null => {
  if (typeof window === "undefined") return null;
  let value: string | null = null;
  try {
    value = globalThis.window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY);
    if (value !== null) {
      globalThis.window.sessionStorage.removeItem(TWO_FACTOR_RETURN_TO_KEY);
    }
  } catch {
    return null;
  }
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  // Reject any scheme/host: no ":" allowed before the first "/".
  const colon = value.indexOf(":");
  if (colon !== -1 && colon < value.indexOf("/")) return null;
  return value;
};

// ─── 2FA detection ───────────────────────────────────────────────────

type ResponseLike = Pick<Response, "status" | "headers">;
type Record_ = Record<string, unknown>;

/**
 * True when this 403 demands 2FA *enrollment* (no secret yet, policy forces it).
 * Signalled by the `X-Auth-Status: two-factor-enrollment-required` header or a
 * `two_factor_enrollment_required` flag at the top level or under `data`.
 */
export const isTwoFactorEnrollmentRequired = (
  response: ResponseLike,
  resRecord: Record_,
  dataRecord: Record_
): boolean =>
  response.status === 403 &&
  (response.headers.get("X-Auth-Status") === "two-factor-enrollment-required" ||
    Boolean(resRecord["two_factor_enrollment_required"]) ||
    Boolean(dataRecord["two_factor_enrollment_required"]));

/**
 * True when this 403 demands 2FA *verification* (secret exists, token not yet
 * verified). Signalled by the `X-Auth-Status: two-factor-required` header or a
 * `two_factor_required` flag at the top level or under `data`.
 */
export const isTwoFactorRequired = (
  response: ResponseLike,
  resRecord: Record_,
  dataRecord: Record_
): boolean =>
  response.status === 403 &&
  (response.headers.get("X-Auth-Status") === "two-factor-required" ||
    Boolean(resRecord["two_factor_required"]) ||
    Boolean(dataRecord["two_factor_required"]));

// ─── 2FA routing ─────────────────────────────────────────────────────

const enrollPathForScope = (scope: string | null | undefined): string =>
  scope === "admin"
    ? "/admin-2fa-enroll"
    : scope === "tenant"
      ? "/tenant-2fa-enroll"
      : scope === "client"
        ? "/client-2fa-enroll"
        : "/2fa-enroll";

const verifyPathForRole = (role: string | null | undefined): string =>
  role === "admin" ? "/verify-admin-mail" : "/verify-mail";

/**
 * Navigate the browser to `targetPath`, stashing the current location first so
 * the enroll/verify page can send the user back on completion. No-op when
 * already on the target (guards a redirect loop) or outside a browser.
 */
const goToTwoFactorPage = (targetPath: string): void => {
  if (typeof window === "undefined") return;
  if (globalThis.window.location.pathname === targetPath) return;
  stashTwoFactorReturnTo(targetPath);
  globalThis.window.location.assign(targetPath);
};

export interface TwoFactorRoutingArgs {
  response: ResponseLike;
  resRecord: Record_;
  dataRecord: Record_;
  /** Acting role — used as the enrollment-scope fallback and the verify-page role. */
  role: AuthRole | string | null | undefined;
  /** Flip the auth store's twoFactorRequired flag (verify branch only). */
  onTwoFactorRequired?: (value: boolean) => void;
}

/**
 * Handle the two 2FA branches of a 401/403 response, in priority order:
 *
 *   1. enrollment-required → stash + redirect to the scope's enroll page
 *   2. verification-required → flip the store flag, stash + redirect to verify
 *
 * MUST be called BEFORE any prevent-redirect bail: the backend sets
 * `X-Prevent-Login-Redirect: true` on BOTH of its 2FA 403 responses, so routing
 * placed after that bail would be dead code. Returns true when it routed the
 * response (caller should stop and surface an error), false to fall through to
 * the caller's own login-redirect handling.
 */
export const routeTwoFactorRedirect = ({
  response,
  resRecord,
  dataRecord,
  role,
  onTwoFactorRequired,
}: TwoFactorRoutingArgs): boolean => {
  if (isTwoFactorEnrollmentRequired(response, resRecord, dataRecord)) {
    const scope =
      (resRecord["scope"] as string | undefined) ||
      (dataRecord["scope"] as string | undefined) ||
      role;
    goToTwoFactorPage(enrollPathForScope(scope));
    return true;
  }

  if (isTwoFactorRequired(response, resRecord, dataRecord)) {
    onTwoFactorRequired?.(true);
    goToTwoFactorPage(verifyPathForRole(role));
    return true;
  }

  return false;
};
