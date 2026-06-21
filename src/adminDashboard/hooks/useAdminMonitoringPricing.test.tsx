/**
 * Hook-level tests for `useAdminMonitoringPricing` (B7).
 *
 * Unlike the page test (which mocks these hooks), this suite mocks the
 * admin `silentApi` client so it exercises the REAL request/response key
 * mapping against the backend `AdminMonitoringPricingController`.
 *
 * Guards producer↔consumer parity on the price field: the BE `index()`
 * emits `price` + `currency_code` and both Form Requests validate `price`
 * — so the FE must read `price` and POST `price`, never the legacy
 * `price_per_host_usd`. The page-level mock test can't catch a divergence
 * here because it stubs the hook output instead of the wire payload.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockSilentApi = vi.fn();

vi.mock("../../index/admin/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

import {
  useMonitoringPricing,
  useUpdateMonitoringPricing,
  useUpsertTenantMonitoringPricing,
} from "./useAdminMonitoringPricing";

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
  return { Wrapper };
}

beforeEach(() => mockSilentApi.mockReset());

describe("useMonitoringPricing", () => {
  it("GETs /monitoring/pricing and reads the BE `price` + `currency_code` keys", async () => {
    // Shape mirrors AdminMonitoringPricingController@index — the keys are
    // `price` / `currency_code`, NOT `price_per_host_usd`.
    mockSilentApi.mockResolvedValue({
      data: [
        {
          tier: "standard",
          price: 2,
          currency_code: "USD",
          retention_days: 30,
          features: [],
        },
      ],
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useMonitoringPricing(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/monitoring/pricing");
    expect(result.current.data?.[0].price).toBe(2);
    expect(result.current.data?.[0].currency_code).toBe("USD");
  });
});

describe("useUpdateMonitoringPricing", () => {
  it("PATCHes the tier with a `price` body — the key the BE Form Request validates", async () => {
    mockSilentApi.mockResolvedValue({
      data: { tier: "standard", price: 3.5, currency_code: "USD" },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateMonitoringPricing(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({ tier: "standard", price: 3.5 });

    expect(mockSilentApi).toHaveBeenCalledWith(
      "PATCH",
      "/monitoring/pricing/standard",
      { price: 3.5 },
    );
  });
});

describe("useUpsertTenantMonitoringPricing", () => {
  it("PUTs the tenant override with a `price` body the BE validates", async () => {
    mockSilentApi.mockResolvedValue({
      data: { tier: "standard", price: 4.5, is_override: true },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useUpsertTenantMonitoringPricing("ten-1"),
      { wrapper: Wrapper },
    );

    await result.current.mutateAsync({ tier: "standard", price: 4.5 });

    expect(mockSilentApi).toHaveBeenCalledWith(
      "PUT",
      "/monitoring/pricing/tenants/ten-1/standard",
      { price: 4.5 },
    );
  });
});
