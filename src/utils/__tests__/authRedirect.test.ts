import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../toastUtil", () => ({
  default: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../stores/authStore", () => ({ default: () => ({}) }));

vi.mock("../../stores/sessionUtils", () => ({
  resolveActivePersona: () => ({ key: "tenant" }),
}));

import { handleAuthRedirect } from "../authRedirect";
import ToastUtils from "../toastUtil";

const makeResponse = (
  status: number,
  headers: Record<string, string> = {}
): Response =>
  ({
    status,
    headers: {
      get: (name: string) => headers[name] ?? headers[name.toLowerCase()] ?? null,
    },
  }) as unknown as Response;

describe("handleAuthRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/dashboard", href: "" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for non-401/403 statuses", () => {
    expect(handleAuthRedirect(makeResponse(200), {})).toBe(false);
    expect(handleAuthRedirect(makeResponse(500), {})).toBe(false);
  });

  it("respects X-Prevent-Login-Redirect header", () => {
    const resp = makeResponse(401, { "X-Prevent-Login-Redirect": "true" });
    expect(handleAuthRedirect(resp, {})).toBe(false);
  });

  it("returns false for 403 business-logic errors (success:false with message)", () => {
    // A structured 403 with a message should NOT redirect — it's a
    // business-logic error (e.g. insufficient permissions).
    const resp = makeResponse(403);
    expect(
      handleAuthRedirect(resp, { success: false, message: "forbidden" })
    ).toBe(false);
  });

  it("respects body.prevent_redirect flag", () => {
    const resp = makeResponse(401);
    expect(handleAuthRedirect(resp, { prevent_redirect: true })).toBe(false);
  });

  it("respects nested data.prevent_redirect flag", () => {
    const resp = makeResponse(401);
    expect(
      handleAuthRedirect(resp, { data: { prevent_redirect: true } })
    ).toBe(false);
  });

  it("redirects to /sign-in for 401 (tenant persona) and shows toast", () => {
    const resp = makeResponse(401);
    const handled = handleAuthRedirect(resp, {});
    expect(handled).toBe(true);
    expect(ToastUtils.error).toHaveBeenCalled();
    expect(window.location.href).toBe("/sign-in");
  });

  it("only redirects once concurrently (isRedirecting guard)", () => {
    const resp = makeResponse(401);
    handleAuthRedirect(resp, {});
    // Reset href; second call should still return true but NOT re-navigate
    window.location.href = "";
    const handled = handleAuthRedirect(resp, {});
    expect(handled).toBe(true);
    expect(window.location.href).toBe("");
  });
});
