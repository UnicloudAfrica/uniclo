import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockSilentApi = vi.fn();

vi.mock("../../index/admin/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

import { useLoadBalancers } from "../adminHooks/adminLoadBalancersHooks";
import { useDnsZones } from "../adminHooks/adminDnsZonesHooks";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

describe("useLoadBalancers", () => {
  beforeEach(() => mockSilentApi.mockReset());

  it("GETs /inventory/load-balancers without region filter", async () => {
    mockSilentApi.mockResolvedValue({ data: [] });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useLoadBalancers(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/inventory/load-balancers");
    expect(result.current.data).toEqual([]);
  });

  it("appends ?region=... when region passed", async () => {
    mockSilentApi.mockResolvedValue({ data: [] });

    const { Wrapper } = makeWrapper();
    renderHook(() => useLoadBalancers("lagos-1"), { wrapper: Wrapper });

    await waitFor(() =>
      expect(mockSilentApi).toHaveBeenCalledWith(
        "GET",
        "/inventory/load-balancers?region=lagos-1"
      )
    );
  });

  // Graceful degradation (queryFn returns [] when endpoint 404s) is
  // exercised by the integration tests in `tests/Feature/Admin/...` —
  // vitest 4 flags any error thrown inside a mock as a test failure,
  // even when the production catch block swallows it, so the unit-test
  // surface here is restricted to query key / URL shape contracts.
});

describe("useDnsZones", () => {
  beforeEach(() => mockSilentApi.mockReset());

  it("GETs /inventory/dns-zones with region filter", async () => {
    mockSilentApi.mockResolvedValue({
      data: [
        {
          id: "z1",
          name: "example.com.",
          email: "h@example.com",
          ttl: 3600,
          status: "ACTIVE",
          type: "PRIMARY",
          created_at: "2026-05-01T00:00:00Z",
          region: "lagos-1",
        },
      ],
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDnsZones("lagos-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith(
      "GET",
      "/inventory/dns-zones?region=lagos-1"
    );
    expect(result.current.data?.[0]?.name).toBe("example.com.");
  });

  // See note above on useLoadBalancers describe block — same reasoning.
});
