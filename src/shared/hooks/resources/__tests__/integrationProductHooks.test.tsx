/**
 * Regression guard: the integration-product catalog must resolve through the
 * current API context like every other shared resource. In tenant mode it
 * must hit the `/admin`-prefixed route (`/tenant/v1/admin/integration-products`)
 * — the same class of bug that left the availability-zone dropdown empty.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useFetchIntegrationProducts } from "../integrationProductHooks";

const TENANT_URL = "/tenant/v1/admin/integration-products";
const BARE_URL = "/tenant/v1/integration-products";

const rows = [
  {
    id: 1,
    integration_key: "shield",
    service_type: "ddos",
    name: "DDoS Shield",
    description: null,
    billing_model: "monthly_flat",
    unit_label: "per domain",
    provider: null,
    region: null,
    pricing_tiers: null,
    pricing_id: 10,
    price: 50,
    currency_code: "USD",
  },
];

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (key: string) => (key.toLowerCase() === "content-type" ? "application/json" : null),
  },
  text: async () => JSON.stringify(body),
  json: async () => body,
});

const fetchMock = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);
  // Match the path regardless of query string (tenant_id, integration_key).
  if (url.includes(TENANT_URL)) {
    return Promise.resolve(jsonResponse({ data: rows }));
  }
  return Promise.resolve(jsonResponse({ message: "Not Found" }, 404));
});

function tenantWrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return (
    <MemoryRouter initialEntries={["/dashboard/create-invoice"]}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("useFetchIntegrationProducts", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hits the /admin-prefixed integration-products route in tenant context", async () => {
    const { result } = renderHook(() => useFetchIntegrationProducts(), { wrapper: tenantWrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe("DDoS Shield");

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.endsWith(TENANT_URL))).toBe(true);
    expect(urls.some((url) => url.endsWith(BARE_URL))).toBe(false);
  });

  it("appends tenant_id for override-accurate preview pricing", async () => {
    const { result } = renderHook(
      () => useFetchIntegrationProducts({ tenantId: "tenant-uuid-123" }),
      {
        wrapper: tenantWrapper,
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(
      urls.some((url) => url.includes(TENANT_URL) && url.includes("tenant_id=tenant-uuid-123"))
    ).toBe(true);
  });
});
