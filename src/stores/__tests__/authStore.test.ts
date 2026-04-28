import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Install a deterministic in-memory localStorage BEFORE importing the store,
// because the store constructs its persist middleware at import time.
const memStore: Record<string, string> = {};
const memoryStorage = {
  getItem: (key: string) => (key in memStore ? memStore[key] : null),
  setItem: (key: string, value: string) => {
    memStore[key] = value;
  },
  removeItem: (key: string) => {
    delete memStore[key];
  },
  clear: () => {
    for (const k of Object.keys(memStore)) delete memStore[k];
  },
  key: (i: number) => Object.keys(memStore)[i] ?? null,
  get length() {
    return Object.keys(memStore).length;
  },
};
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryStorage,
});

// Now safe to import the store
const authModule = await import("../authStore");
const useAuthStore = authModule.default;
const { inferTenantContext } = authModule;

const clearPersistedAuth = () => {
  memoryStorage.clear();
};

describe("authStore", () => {
  beforeEach(() => {
    clearPersistedAuth();
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearPersistedAuth();
  });

  describe("login()", () => {
    it("sets user state and marks authenticated", () => {
      useAuthStore.getState().login({
        user: { id: 1, email: "a@b.com" } as unknown as never,
        email: "a@b.com",
        role: "tenant",
        abilities: ["view.dashboard"],
        cloudRoles: ["viewer"],
        permissions: ["users.read"],
      });

      const s = useAuthStore.getState();
      expect(s.isAuthenticated).toBe(true);
      expect(s.userEmail).toBe("a@b.com");
      expect(s.role).toBe("tenant");
      expect(s.abilities).toEqual(["view.dashboard"]);
      expect(s.cloudRoles).toEqual(["viewer"]);
      expect(s.permissions).toEqual(["users.read"]);
      expect(s.session?.role).toBe("tenant");
    });

    it("defaults to client role when not provided", () => {
      useAuthStore.getState().login({ email: "x@y.com" });
      expect(useAuthStore.getState().role).toBe("client");
    });

    it("never stores a token in state (SEC-027: cookie-based auth)", () => {
      useAuthStore.getState().login({
        email: "a@b.com",
        role: "admin",
        token: "should-not-be-persisted",
        access_token: "also-not-persisted",
      } as never);

      const s = useAuthStore.getState();
      expect(s.token).toBeNull();
    });

    it("handles non-array abilities/roles by defaulting to []", () => {
      useAuthStore.getState().login({
        email: "q@w.com",
        abilities: "not-an-array" as unknown as string[],
        cloudRoles: undefined,
      });
      const s = useAuthStore.getState();
      expect(s.abilities).toEqual([]);
      expect(s.cloudRoles).toEqual([]);
    });
  });

  describe("logout()", () => {
    it("clears session and calls logout API endpoint", async () => {
      useAuthStore.getState().login({ email: "a@b.com", role: "tenant" });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      await useAuthStore.getState().logout();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(String(url)).toContain("/business/auth/logout");
      expect(opts.method).toBe("POST");
      expect(opts.credentials).toBe("include");

      const s = useAuthStore.getState();
      expect(s.isAuthenticated).toBe(false);
      expect(s.user).toBeNull();
      expect(s.userEmail).toBeNull();
    });

    // C-07: Server-confirmed logout. Network failure must NOT clear
    // local state — caller should see the error and decide whether to
    // retry or use forceLogout().
    it("does NOT clear local state when server is unreachable", async () => {
      useAuthStore.getState().login({ email: "a@b.com", role: "client" });
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

      await expect(
        useAuthStore.getState().logout()
      ).rejects.toThrow();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("does NOT clear local state when server returns 5xx", async () => {
      useAuthStore.getState().login({ email: "a@b.com", role: "client" });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 503 })
      );

      await expect(
        useAuthStore.getState().logout()
      ).rejects.toThrow();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("DOES clear local state on 401 (session already expired)", async () => {
      useAuthStore.getState().login({ email: "a@b.com", role: "client" });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 401 })
      );

      await useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("forceLogout() clears state without contacting the server", () => {
      useAuthStore.getState().login({ email: "a@b.com", role: "client" });
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      useAuthStore.getState().forceLogout();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("switchTenant() — SEC-026 sanitization + H-01 server check", () => {
    let originalHref = "";
    beforeEach(() => {
      originalHref = window.location.href;
      // Safe assignable location mock
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          protocol: "https:",
          port: "",
          hostname: "unicloudafrica.com",
          pathname: "/",
          href: originalHref,
          assign: vi.fn(),
        },
      });
      // Default: server says access is granted.
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, status: 200 })
      );
    });

    it("strips dangerous characters before building the host", async () => {
      const ok = await useAuthStore
        .getState()
        .switchTenant("acme<script>alert(1)</script>");
      expect(ok).toBe(true);
      expect(String(window.location.href)).toContain("acmescriptalert1script");
      expect(String(window.location.href)).toContain(".unicloudafrica.com");
    });

    it("rejects empty slug after sanitization (prevents javascript: redirects)", async () => {
      const ok = await useAuthStore.getState().switchTenant("<>/:");
      expect(ok).toBe(false);
    });

    it("rejects empty string input", async () => {
      const ok = await useAuthStore.getState().switchTenant("");
      expect(ok).toBe(false);
    });

    it("keeps only [a-zA-Z0-9-] characters", async () => {
      await useAuthStore.getState().switchTenant("Acme-Co_123!@#");
      expect(String(window.location.href)).toContain("Acme-Co123");
    });

    it("does NOT redirect when server denies access (H-01)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 403 })
      );
      const hrefBefore = String(window.location.href);
      const ok = await useAuthStore.getState().switchTenant("acme");
      expect(ok).toBe(false);
      expect(String(window.location.href)).toBe(hrefBefore);
    });
  });

  describe("getAuthHeaders()", () => {
    it("returns correct content-type/accept headers without token (SEC-027)", () => {
      const headers = useAuthStore.getState().getAuthHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Accept"]).toBe("application/json");
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("adds X-Tenant-Slug on non-central domain with tenant slug", () => {
      useAuthStore.setState({
        currentTenant: { slug: "acme" } as never,
        session: {
          role: "tenant",
          tenantSlug: "acme",
          tenantId: null,
          workspaceRole: null,
          abilities: [],
          cloudRoles: [],
          cloudAbilities: [],
          permissions: [],
          expiresAt: null,
          isCentralDomain: false,
          currentDomain: "acme.unicloudafrica.com",
        },
      });
      const headers = useAuthStore.getState().getAuthHeaders();
      expect(headers["X-Tenant-Slug"]).toBe("acme");
    });

    it("does NOT add X-Tenant-Slug on central domain", () => {
      useAuthStore.setState({
        currentTenant: { slug: "acme" } as never,
        session: {
          role: "admin",
          tenantSlug: "acme",
          tenantId: null,
          workspaceRole: null,
          abilities: [],
          cloudRoles: [],
          cloudAbilities: [],
          permissions: [],
          expiresAt: null,
          isCentralDomain: true,
          currentDomain: "unicloudafrica.com",
        },
      });
      const headers = useAuthStore.getState().getAuthHeaders();
      expect(headers["X-Tenant-Slug"]).toBeUndefined();
    });
  });

  describe("persistence (SEC-027)", () => {
    it("does NOT persist deprecated token field to localStorage", () => {
      useAuthStore.getState().login({
        email: "a@b.com",
        role: "tenant",
        token: "secret-token",
        access_token: "secret-access",
      } as never);

      const persisted = localStorage.getItem("unicloud_auth");
      expect(persisted).not.toBeNull();
      expect(persisted).not.toContain("secret-token");
      expect(persisted).not.toContain("secret-access");
    });
  });

  describe("permission helpers", () => {
    beforeEach(() => {
      useAuthStore.getState().setPermissions(["users.read", "users.write"]);
    });

    it("hasPermission returns true for present perm", () => {
      expect(useAuthStore.getState().hasPermission("users.read")).toBe(true);
      expect(useAuthStore.getState().hasPermission("admin.destroy")).toBe(false);
    });

    it("hasAnyPermission returns true if at least one matches", () => {
      expect(
        useAuthStore.getState().hasAnyPermission(["none", "users.write"])
      ).toBe(true);
      expect(
        useAuthStore.getState().hasAnyPermission(["a", "b"])
      ).toBe(false);
    });

    it("hasAllPermissions requires all matches", () => {
      expect(
        useAuthStore.getState().hasAllPermissions(["users.read", "users.write"])
      ).toBe(true);
      expect(
        useAuthStore.getState().hasAllPermissions(["users.read", "missing"])
      ).toBe(false);
    });
  });

  describe("role helpers", () => {
    it("isAdmin/isTenant/isClient reflect session role", () => {
      useAuthStore.getState().login({ email: "a@b.com", role: "admin" });
      expect(useAuthStore.getState().isAdmin()).toBe(true);
      expect(useAuthStore.getState().isTenant()).toBe(false);
      expect(useAuthStore.getState().isClient()).toBe(false);

      useAuthStore.getState().login({ email: "a@b.com", role: "client" });
      expect(useAuthStore.getState().isClient()).toBe(true);
    });
  });

  describe("inferTenantContext()", () => {
    it("treats unicloudafrica.com as central domain", () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { hostname: "unicloudafrica.com" },
      });
      const ctx = inferTenantContext();
      expect(ctx.isCentralDomain).toBe(true);
      expect(ctx.currentTenant).toBeNull();
    });

    it("treats localhost as central domain", () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { hostname: "localhost" },
      });
      const ctx = inferTenantContext();
      expect(ctx.isCentralDomain).toBe(true);
    });

    it("extracts tenant slug from subdomain", () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { hostname: "acme.unicloudafrica.com" },
      });
      const ctx = inferTenantContext();
      expect(ctx.isCentralDomain).toBe(false);
      expect(ctx.currentTenant?.slug).toBe("acme");
    });
  });
});
