import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApiClient, resetCsrfPrimed } from "../createApiClient";

vi.mock("../toastUtil", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../logger", () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../authRedirect", () => ({
  handleAuthRedirect: vi.fn(() => false),
}));

import ToastUtils from "../toastUtil";
import { handleAuthRedirect } from "../authRedirect";

const jsonResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const makeAuthStore = (overrides: Record<string, unknown> = {}) => {
  const state = {
    getAuthHeaders: () => ({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    setTwoFactorRequired: vi.fn(),
    clearSession: vi.fn(),
    getEffectiveRole: () => "tenant",
    role: "tenant",
    ...overrides,
  };
  return { getState: () => state };
};

// Helper: find the first fetch call that is NOT the /sanctum/csrf-cookie prime.
// CSRF priming is transparent behavior added by the client; tests assert on the
// real request they made.
const realCall = (fetchMock: ReturnType<typeof vi.fn>) => {
  const calls = fetchMock.mock.calls;
  const match = calls.find((c) => !String(c[0] ?? "").includes("/sanctum/csrf-cookie"));
  return match ?? calls[0];
};

describe("createApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCsrfPrimed();
    // Ensure handleAuthRedirect default each test
    (handleAuthRedirect as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => false
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends GET with credentials:include", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });
    await client.get("/ping");

    const [url, options] = realCall(fetchMock);
    expect(url).toBe("https://api.test/ping");
    expect(options.method).toBe("GET");
    expect(options.credentials).toBe("include");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("sends POST with JSON body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(201, { data: { id: 5 } }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });
    const res = await client.post("/items", { name: "x" });

    const [, options] = realCall(fetchMock);
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "x" }));
    expect(res).toEqual({ data: { id: 5 } });
  });

  it("strips Content-Type when body is FormData", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });
    const fd = new FormData();
    fd.append("a", "b");
    await client.post("/upload", fd);

    const [, options] = realCall(fetchMock);
    expect(options.headers["Content-Type"]).toBeUndefined();
    expect(options.body).toBe(fd);
  });

  it("calls PUT/PATCH/DELETE with correct method", async () => {
    // Return a *fresh* response each call — Response bodies are one-shot.
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse(200, {})));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });
    await client.put("/r/1", { a: 1 });
    await client.patch("/r/1", { a: 2 });
    await client.delete("/r/1");

    // Filter out the one-shot csrf-cookie prime before asserting methods.
    const methods = fetchMock.mock.calls
      .filter((c) => !String(c[0] ?? "").includes("/sanctum/csrf-cookie"))
      .map((c) => c[1].method);
    expect(methods).toEqual(["PUT", "PATCH", "DELETE"]);
  });

  it("throws Error with server message on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(500, { message: "boom" }))
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });
    await expect(client.get("/fail")).rejects.toThrow("boom");
  });

  it("clears session on 401 when toasts enabled and auth redirect handled", async () => {
    const authStore = makeAuthStore();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(401, { message: "nope" }))
    );
    (handleAuthRedirect as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => true
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore,
      showToasts: true,
    });

    await expect(client.get("/secure")).rejects.toThrow("Unauthorized");
    expect(authStore.getState().clearSession).toHaveBeenCalled();
  });

  it("handles 204 No Content without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });

    const res = await client.delete("/x");
    expect(res).toEqual({});
  });

  it("treats 403 with two-factor header as 2FA", async () => {
    const setTwoFactor = vi.fn();
    const authStore = makeAuthStore({ setTwoFactorRequired: setTwoFactor });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          403,
          { message: "need 2fa" },
          { "X-Auth-Status": "two-factor-required" }
        )
      )
    );

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: { pathname: "/elsewhere", assign },
    });

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore,
    });
    await expect(client.get("/secure")).rejects.toThrow();
    expect(setTwoFactor).toHaveBeenCalledWith(true);
    expect(assign).toHaveBeenCalledWith("/verify-mail");
  });

  it("unwraps envelope responses (returns the raw body)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { data: { items: [1, 2] } }))
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
    });
    const res = await client.get<{ data: { items: number[] } }>("/items");
    expect(res.data.items).toEqual([1, 2]);
  });

  it("shows success toast when enabled and message present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { message: "Saved!" }))
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
      showToasts: true,
    });
    await client.post("/x");
    expect(ToastUtils.success).toHaveBeenCalledWith("Saved!");
  });

  it("shows friendly toast for 5xx to non-admin role", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(503, { message: "db exploded" }))
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore(),
      showToasts: true,
    });
    await expect(client.get("/fail")).rejects.toThrow();
    expect(ToastUtils.error).toHaveBeenCalledWith(
      "Something went wrong. Please contact support."
    );
  });

  it("shows raw error to admin on 5xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(500, { message: "stack trace detail" }))
    );

    const client = createApiClient({
      baseURL: "https://api.test",
      authStore: makeAuthStore({ getEffectiveRole: () => "admin", role: "admin" }),
      showToasts: true,
    });
    await expect(client.get("/fail")).rejects.toThrow();
    expect(ToastUtils.error).toHaveBeenCalledWith("stack trace detail");
  });
});
