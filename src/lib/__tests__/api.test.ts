import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mirror the mocking style of utils/__tests__/authRedirect.test.ts — stub the
// toast + logger sinks and the auth store so we can drive handleAuthError in
// isolation and assert on the redirect / stash side effects.
vi.mock("../../utils/toastUtil", () => ({
  default: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../utils/logger", () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const setTwoFactorRequired = vi.fn();
const clearSession = vi.fn();
vi.mock("../../stores/authStore", () => ({
  default: { getState: () => ({ setTwoFactorRequired, clearSession }) },
}));

import { handleAuthError, consumeTwoFactorReturnTo } from "../api";
import useAuthStore from "../../stores/authStore";

const RETURN_TO_KEY = "twofactor:return_to";

const jsonResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const setLocation = (pathname: string, search = "") => {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: { pathname, search, assign: vi.fn(), href: "" },
  });
};

describe("handleAuthError — 2FA routing takes priority over prevent-redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setLocation("/admin-dashboard/cube-instances/details", "?identifier=abc");
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("routes an enrollment-required 403 (scope=admin) to /admin-2fa-enroll and stashes returnTo — even with the prevent-redirect header set", () => {
    const res = jsonResponse(
      403,
      { two_factor_enrollment_required: true, scope: "admin" },
      { "X-Prevent-Login-Redirect": "true" }
    );

    const handled = handleAuthError(res, { two_factor_enrollment_required: true, scope: "admin" }, "admin");

    expect(handled).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/admin-2fa-enroll");
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBe(
      "/admin-dashboard/cube-instances/details?identifier=abc"
    );
    // Enrollment must NOT clear the session.
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("routes scope=tenant to /tenant-2fa-enroll", () => {
    const body = { two_factor_enrollment_required: true, scope: "tenant" };
    const handled = handleAuthError(
      jsonResponse(403, body, { "X-Prevent-Login-Redirect": "true" }),
      body,
      "tenant"
    );
    expect(handled).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/tenant-2fa-enroll");
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBe(
      "/admin-dashboard/cube-instances/details?identifier=abc"
    );
  });

  it("routes scope=client to /client-2fa-enroll", () => {
    const body = { two_factor_enrollment_required: true, scope: "client" };
    const handled = handleAuthError(
      jsonResponse(403, body, { "X-Prevent-Login-Redirect": "true" }),
      body,
      "client"
    );
    expect(handled).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/client-2fa-enroll");
  });

  it("routes a two_factor_required 403 to /verify-admin-mail for the admin role and flips the store flag — despite the prevent-redirect header", () => {
    const body = { two_factor_required: true };
    const handled = handleAuthError(
      jsonResponse(403, body, { "X-Prevent-Login-Redirect": "true" }),
      body,
      "admin"
    );
    expect(handled).toBe(true);
    expect(setTwoFactorRequired).toHaveBeenCalledWith(true);
    expect(window.location.assign).toHaveBeenCalledWith("/verify-admin-mail");
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBe(
      "/admin-dashboard/cube-instances/details?identifier=abc"
    );
    expect(useAuthStore.getState().clearSession).not.toHaveBeenCalled();
  });

  it("does NOT stash a return target when already on a 2FA page", () => {
    setLocation("/admin-2fa-enroll");
    const body = { two_factor_enrollment_required: true, scope: "admin" };
    handleAuthError(jsonResponse(403, body), body, "admin");
    // Already on target → assign is guarded out AND nothing stashed.
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull();
  });

  it("still honours prevent-redirect for a business-logic 403 with NO 2FA flags: returns false, no redirect, no session clear", () => {
    const body = { success: false, message: "You lack permission." };
    const handled = handleAuthError(
      jsonResponse(403, body, { "X-Prevent-Login-Redirect": "true" }),
      body,
      "admin"
    );
    expect(handled).toBe(false);
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
    expect(setTwoFactorRequired).not.toHaveBeenCalled();
  });
});

describe("consumeTwoFactorReturnTo — safe-path validation", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  const expectRejected = (stored: string) => {
    window.sessionStorage.setItem(RETURN_TO_KEY, stored);
    expect(consumeTwoFactorReturnTo()).toBeNull();
    // Always cleared, even on rejection, so a poisoned value can't linger.
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull();
  };

  it("rejects an absolute off-site URL", () => {
    expectRejected("https://evil.com");
  });

  it("rejects a protocol-relative URL", () => {
    expectRejected("//evil.com");
  });

  it("rejects a javascript: scheme", () => {
    expectRejected("javascript:alert(1)");
  });

  it("accepts a same-origin deep link with a query string and clears the key", () => {
    window.sessionStorage.setItem(
      RETURN_TO_KEY,
      "/admin-dashboard/cube-instances/details?identifier=X"
    );
    expect(consumeTwoFactorReturnTo()).toBe(
      "/admin-dashboard/cube-instances/details?identifier=X"
    );
    expect(window.sessionStorage.getItem(RETURN_TO_KEY)).toBeNull();
  });

  it("returns null when nothing is stashed", () => {
    expect(consumeTwoFactorReturnTo()).toBeNull();
  });
});
