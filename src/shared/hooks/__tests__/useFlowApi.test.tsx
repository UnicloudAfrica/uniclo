import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// useFlowApi resolves the dashboard context via useApiContext (router +
// auth store). Stub it with a fixed context so these tests focus on the
// transport contract of request(): SEC-027 cookie-based auth.
vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({
    context: "tenant",
    apiBaseUrl: "http://api.test/tenant/v1",
    authHeaders: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Tenant-Slug": "acme",
    },
    isAuthenticated: true,
  }),
}));

import { useFlowApi, useAdminFlowApi } from "../useFlowApi";

const okJson = (payload: unknown) => ({
  ok: true,
  status: 200,
  json: async () => payload,
});

const clearXsrfCookie = () => {
  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

describe("useFlowApi transport (SEC-027: cookie-based auth)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(okJson({ success: true, data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    clearXsrfCookie();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearXsrfCookie();
  });

  it("sends credentials: 'include' and no Authorization header on GET", async () => {
    const { result } = renderHook(() => useFlowApi());
    await result.current.getPlans();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://api.test/tenant/v1/flow/plans");
    expect(options.credentials).toBe("include");
    expect(options.headers.Authorization).toBeUndefined();
    expect(options.headers["X-Tenant-Slug"]).toBe("acme");
  });

  it("forwards the XSRF-TOKEN cookie as X-XSRF-TOKEN on mutations", async () => {
    document.cookie = "XSRF-TOKEN=test-xsrf%3D%3D; path=/";
    const { result } = renderHook(() => useFlowApi());
    await result.current.subscribe("starter");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(options.headers["X-XSRF-TOKEN"]).toBe("test-xsrf==");
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("omits X-XSRF-TOKEN on GET and when the cookie is absent", async () => {
    const { result } = renderHook(() => useFlowApi());
    await result.current.getStatus();
    await result.current.subscribe("starter");

    const [, getOptions] = fetchMock.mock.calls[0];
    const [, postOptions] = fetchMock.mock.calls[1];
    expect(getOptions.headers["X-XSRF-TOKEN"]).toBeUndefined();
    expect(postOptions.headers["X-XSRF-TOKEN"]).toBeUndefined();
  });

  it("useAdminFlowApi sends the same cookie-transport contract", async () => {
    document.cookie = "XSRF-TOKEN=admin-xsrf; path=/";
    const { result } = renderHook(() => useAdminFlowApi());
    await result.current.createPlan({ name: "Pro" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://api.test/tenant/v1/flow/plans");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(options.headers["X-XSRF-TOKEN"]).toBe("admin-xsrf");
    expect(options.headers.Authorization).toBeUndefined();
  });
});
