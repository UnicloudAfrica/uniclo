import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

/**
 * Contract test for the tenant product-pricing override hooks.
 *
 * Producer (these hooks) ↔ consumer (Laravel `TenantProductPricingController`,
 * the Route::resource mounted at `/api/v1/tenant/admin/product-pricing`). The
 * unified api client prepends the tenant base URL at runtime, so the hook is
 * responsible for the `/admin/product-pricing` path + the HTTP method the
 * backend resource route expects. Asserting the (method, path, body) triple is
 * what catches a producer/consumer path drift that page-level fixtures mask —
 * exactly the footgun the repo's before-claiming-done checklist calls out.
 */

const mockRequest = vi.fn();

// All `index/{tenant,admin}/*` clients are thin shims that delegate to this
// single unified client, so mocking it here exercises the real shim path-build.
vi.mock("@/lib/api", () => ({
  api: { request: (...args: unknown[]) => mockRequest(...args) },
  default: { request: (...args: unknown[]) => mockRequest(...args) },
}));

import {
  useUpsertTenantPricingOverride,
  useUpdateTenantPricingOverride,
  useDeleteTenantPricingOverride,
} from "../tenantPricingHooks";

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

describe("tenant product-pricing override hooks", () => {
  beforeEach(() => mockRequest.mockReset());

  it("set → POSTs a region-scoped override to /admin/product-pricing", async () => {
    mockRequest.mockResolvedValue({ success: true, data: { id: 1 } });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpsertTenantPricingOverride(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({
      productable_type: "compute_instance",
      productable_id: 5,
      provider: "zadara",
      price_usd: 15,
      region: "uni-ng-lag",
    });

    expect(mockRequest).toHaveBeenCalledWith("POST", "/admin/product-pricing", {
      productable_type: "compute_instance",
      productable_id: 5,
      provider: "zadara",
      price_usd: 15,
      region: "uni-ng-lag",
    });
  });

  it("edit → PATCHes the override row by id", async () => {
    mockRequest.mockResolvedValue({ success: true, data: { id: 7 } });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateTenantPricingOverride(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({ id: 7, payload: { price_usd: 20 } });

    expect(mockRequest).toHaveBeenCalledWith("PATCH", "/admin/product-pricing/7", {
      price_usd: 20,
    });
  });

  it("clear → DELETEs the override row by id (reverts to the admin default)", async () => {
    mockRequest.mockResolvedValue({ success: true });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteTenantPricingOverride(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync(7);

    expect(mockRequest).toHaveBeenCalledWith("DELETE", "/admin/product-pricing/7", null);
  });
});
