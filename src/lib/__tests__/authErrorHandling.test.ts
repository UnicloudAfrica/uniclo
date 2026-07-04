import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  routeTwoFactorRedirect,
  consumeTwoFactorReturnTo,
  isTwoFactorEnrollmentRequired,
  isTwoFactorRequired,
  TWO_FACTOR_RETURN_TO_KEY,
} from "../authErrorHandling";

const jsonResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const toRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const setLocation = (pathname: string, search = "") => {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: { pathname, search, assign: vi.fn(), href: "" },
  });
};

// Drive routeTwoFactorRedirect the way both clients do: body → resRecord/dataRecord.
const route = (
  response: Response,
  body: unknown,
  role: string | null | undefined,
  onTwoFactorRequired?: (v: boolean) => void
) => {
  const resRecord = toRecord(body);
  return routeTwoFactorRedirect({
    response,
    resRecord,
    dataRecord: toRecord(resRecord["data"]),
    role,
    onTwoFactorRequired,
  });
};

describe("routeTwoFactorRedirect — enrollment routing per scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setLocation("/admin-dashboard/instances", "?id=abc");
  });
  afterEach(() => window.sessionStorage.clear());

  it("routes scope=admin to /admin-2fa-enroll and stashes the return path", () => {
    const body = { two_factor_enrollment_required: true, scope: "admin" };
    const handled = route(jsonResponse(403, body), body, "admin");
    expect(handled).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/admin-2fa-enroll");
    expect(window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY)).toBe(
      "/admin-dashboard/instances?id=abc"
    );
  });

  it("routes scope=tenant to /tenant-2fa-enroll", () => {
    const body = { two_factor_enrollment_required: true, scope: "tenant" };
    expect(route(jsonResponse(403, body), body, "tenant")).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/tenant-2fa-enroll");
  });

  it("routes scope=client to /client-2fa-enroll", () => {
    const body = { two_factor_enrollment_required: true, scope: "client" };
    expect(route(jsonResponse(403, body), body, "client")).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/client-2fa-enroll");
  });

  it("falls back to the acting role when the body omits scope", () => {
    const res = jsonResponse(403, {}, { "X-Auth-Status": "two-factor-enrollment-required" });
    expect(route(res, {}, "tenant")).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/tenant-2fa-enroll");
  });

  it("falls back to /2fa-enroll when scope and role are both absent", () => {
    const body = { two_factor_enrollment_required: true };
    expect(route(jsonResponse(403, body), body, undefined)).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/2fa-enroll");
  });

  it("reads the enrollment flag nested under data", () => {
    const body = { data: { two_factor_enrollment_required: true, scope: "admin" } };
    expect(route(jsonResponse(403, body), body, "client")).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/admin-2fa-enroll");
  });
});

describe("routeTwoFactorRedirect — verification flagging path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setLocation("/dashboard/projects");
  });
  afterEach(() => window.sessionStorage.clear());

  it("flips the store flag and routes admin to /verify-admin-mail", () => {
    const setFlag = vi.fn();
    const body = { two_factor_required: true };
    expect(route(jsonResponse(403, body), body, "admin", setFlag)).toBe(true);
    expect(setFlag).toHaveBeenCalledWith(true);
    expect(window.location.assign).toHaveBeenCalledWith("/verify-admin-mail");
  });

  it("routes non-admin roles to /verify-mail via the header", () => {
    const setFlag = vi.fn();
    const res = jsonResponse(403, {}, { "X-Auth-Status": "two-factor-required" });
    expect(route(res, {}, "tenant", setFlag)).toBe(true);
    expect(setFlag).toHaveBeenCalledWith(true);
    expect(window.location.assign).toHaveBeenCalledWith("/verify-mail");
  });

  it("stashes the return path before the verify redirect too", () => {
    const body = { two_factor_required: true };
    route(jsonResponse(403, body), body, "tenant", vi.fn());
    expect(window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY)).toBe(
      "/dashboard/projects"
    );
  });
});

describe("routeTwoFactorRedirect — ordering: enrollment wins over verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setLocation("/admin-dashboard");
  });

  // If both flags were somehow present, enrollment must be evaluated first —
  // pins the branch order so a reorder is caught.
  it("prefers the enrollment route when both flags are set", () => {
    const setFlag = vi.fn();
    const body = {
      two_factor_enrollment_required: true,
      two_factor_required: true,
      scope: "admin",
    };
    expect(route(jsonResponse(403, body), body, "admin", setFlag)).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/admin-2fa-enroll");
    // Enrollment branch returns before touching the verify flag.
    expect(setFlag).not.toHaveBeenCalled();
  });
});

describe("routeTwoFactorRedirect — ordering: routes BEFORE any prevent-redirect bail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setLocation("/admin-dashboard/instances");
  });

  // The backend sets X-Prevent-Login-Redirect:true on its 2FA 403s. The shared
  // router must NOT consult that header — it routes 2FA unconditionally, and the
  // callers place this call BEFORE their prevent-redirect bail. This test fails
  // if someone makes the router honour prevent-redirect (which would make the
  // enroll/verify branches dead code, the 2026-07-01 regression class).
  it("routes an enrollment 403 that also carries X-Prevent-Login-Redirect:true", () => {
    const body = { two_factor_enrollment_required: true, scope: "admin" };
    const res = jsonResponse(403, body, { "X-Prevent-Login-Redirect": "true" });
    expect(route(res, body, "admin")).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith("/admin-2fa-enroll");
  });
});

describe("routeTwoFactorRedirect — non-2FA responses fall through", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setLocation("/admin-dashboard");
  });

  it("returns false for a plain 401 (no redirect, no stash)", () => {
    expect(route(jsonResponse(401, { message: "nope" }), { message: "nope" }, "admin")).toBe(
      false
    );
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY)).toBeNull();
  });

  it("returns false for a business-logic 403 with no 2FA flags", () => {
    const body = { success: false, message: "You lack permission." };
    expect(route(jsonResponse(403, body), body, "admin")).toBe(false);
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("does NOT treat a 200 carrying the flag as a 2FA response (status-gated)", () => {
    const body = { two_factor_required: true };
    expect(route(jsonResponse(200, body), body, "admin", vi.fn())).toBe(false);
  });
});

describe("routeTwoFactorRedirect — redirect-loop guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("does not redirect or stash when already on the target 2FA page", () => {
    setLocation("/admin-2fa-enroll");
    const body = { two_factor_enrollment_required: true, scope: "admin" };
    // Still reports handled (true) so the caller stops, but no navigation/stash.
    expect(route(jsonResponse(403, body), body, "admin")).toBe(true);
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY)).toBeNull();
  });
});

describe("detection predicates", () => {
  it("isTwoFactorEnrollmentRequired is 403-gated", () => {
    const body = { two_factor_enrollment_required: true };
    expect(
      isTwoFactorEnrollmentRequired(jsonResponse(403, body), toRecord(body), {})
    ).toBe(true);
    expect(
      isTwoFactorEnrollmentRequired(jsonResponse(401, body), toRecord(body), {})
    ).toBe(false);
  });

  it("isTwoFactorRequired reads the header", () => {
    const res = jsonResponse(403, {}, { "X-Auth-Status": "two-factor-required" });
    expect(isTwoFactorRequired(res, {}, {})).toBe(true);
  });
});

describe("consumeTwoFactorReturnTo — safe-path validation", () => {
  beforeEach(() => window.sessionStorage.clear());

  const expectRejected = (stored: string) => {
    window.sessionStorage.setItem(TWO_FACTOR_RETURN_TO_KEY, stored);
    expect(consumeTwoFactorReturnTo()).toBeNull();
    expect(window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY)).toBeNull();
  };

  it("rejects an absolute off-site URL", () => expectRejected("https://evil.com"));
  it("rejects a protocol-relative URL", () => expectRejected("//evil.com"));
  it("rejects a javascript: scheme", () => expectRejected("javascript:alert(1)"));

  it("accepts a same-origin deep link and clears the key", () => {
    window.sessionStorage.setItem(TWO_FACTOR_RETURN_TO_KEY, "/dashboard/x?a=1");
    expect(consumeTwoFactorReturnTo()).toBe("/dashboard/x?a=1");
    expect(window.sessionStorage.getItem(TWO_FACTOR_RETURN_TO_KEY)).toBeNull();
  });

  it("returns null when nothing is stashed", () => {
    expect(consumeTwoFactorReturnTo()).toBeNull();
  });
});
