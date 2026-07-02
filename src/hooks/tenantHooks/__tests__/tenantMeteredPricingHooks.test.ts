import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

/**
 * Contract test for the tenant Pay-As-You-Go metered-unit-price override hooks.
 *
 * Producer (these hooks) ↔ consumer (Laravel `TenantMeteredUnitPriceController`,
 * mounted under the tenant `admin` route group at
 * `/api/v1/tenant/admin/metered-unit-prices`). The unified api client prepends
 * the tenant base URL (`config.tenantURL` → `/tenant/v1`) at runtime, so the
 * hook owns the `/admin/metered-unit-prices` path + the HTTP method the backend
 * route expects — the resolved URL is `/tenant/v1/admin/metered-unit-prices`.
 *
 * The hook previously omitted the `/admin` segment, so every request resolved
 * to `/tenant/v1/metered-unit-prices` (no route → 404) and the PAYG tenant
 * override editor was broken over HTTP. Page-level fixtures mask that drift;
 * asserting the (method, path, body) triple is what catches it — exactly the
 * producer/consumer parity footgun the repo's before-claiming-done checklist
 * calls out. Same fix + same convention as the sibling flow-plan / integration
 * pricing hooks.
 *
 * Mocking the unified client (rather than the thin `index/tenant/*` shims that
 * delegate to it) exercises the real shim path-build, same as
 * `tenantFlowPlanPricingHooks.test.ts`.
 */

const mockRequest = vi.fn();

vi.mock("@/lib/api", () => ({
  api: { request: (...args: unknown[]) => mockRequest(...args) },
  default: { request: (...args: unknown[]) => mockRequest(...args) },
}));

import {
  useTenantFetchMeteredPricing,
  useTenantUpdateMeteredPricing,
  useTenantRevertMeteredPricing,
} from "../tenantMeteredPricingHooks";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { Wrapper };
}

describe("tenant metered-unit-price override hooks", () => {
  beforeEach(() => mockRequest.mockReset());

  it("list → GETs /admin/metered-unit-prices (silent)", async () => {
    mockRequest.mockResolvedValue({ data: [] });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTenantFetchMeteredPricing(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRequest).toHaveBeenCalledWith("GET", "/admin/metered-unit-prices", null, {
      silent: true,
    });
  });

  it("save → PATCHes the override row by metric id", async () => {
    mockRequest.mockResolvedValue({ data: { metric_id: 3 } });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTenantUpdateMeteredPricing(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({ metricId: 3, unit_price: 250 });

    expect(mockRequest).toHaveBeenCalledWith("PATCH", "/admin/metered-unit-prices/3", {
      unit_price: 250,
    });
  });

  it("revert → DELETEs the override row by metric id (reverts to admin default)", async () => {
    mockRequest.mockResolvedValue({ data: null });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTenantRevertMeteredPricing(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync(3);

    expect(mockRequest).toHaveBeenCalledWith("DELETE", "/admin/metered-unit-prices/3", null);
  });
});
