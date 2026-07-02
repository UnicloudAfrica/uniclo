import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

/**
 * Contract test for the tenant SlimDeploy flow-plan pricing override hooks.
 *
 * Producer (these hooks) ↔ consumer (Laravel `TenantFlowPlanPricingController`,
 * mounted under the tenant `admin` route group at
 * `/api/v1/tenant/admin/flow-plan-pricing`). The unified api client prepends
 * the tenant base URL (`config.tenantURL` → `/tenant/v1`) at runtime, so the
 * hook owns the `/admin/flow-plan-pricing` path + the HTTP method the backend
 * route expects — the resolved URL is `/tenant/v1/admin/flow-plan-pricing`.
 *
 * The hook previously omitted the `/admin` segment, so every request resolved
 * to `/tenant/v1/flow-plan-pricing` (no route → 404) and the SlimDeploy tenant
 * override pane was broken over HTTP. Page-level fixtures mask that drift;
 * asserting the (method, path, body) triple is what catches it — exactly the
 * producer/consumer parity footgun the repo's before-claiming-done checklist
 * calls out.
 *
 * Mocking the unified client (rather than the thin `index/tenant/*` shims that
 * delegate to it) exercises the real shim path-build, same as
 * `tenantPricingHooks.test.ts`.
 */

const mockRequest = vi.fn();

vi.mock("@/lib/api", () => ({
  api: { request: (...args: unknown[]) => mockRequest(...args) },
  default: { request: (...args: unknown[]) => mockRequest(...args) },
}));

import {
  useTenantFetchFlowPlanPricing,
  useTenantUpdateFlowPlanPricing,
  useTenantRevertFlowPlanPricing,
} from "../tenantFlowPlanPricingHooks";

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

describe("tenant flow-plan pricing override hooks", () => {
  beforeEach(() => mockRequest.mockReset());

  it("list → GETs /admin/flow-plan-pricing (silent)", async () => {
    mockRequest.mockResolvedValue({ data: [] });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTenantFetchFlowPlanPricing(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRequest).toHaveBeenCalledWith("GET", "/admin/flow-plan-pricing", null, {
      silent: true,
    });
  });

  it("save → PATCHes the override row by plan id", async () => {
    mockRequest.mockResolvedValue({ data: { plan_id: 3 } });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTenantUpdateFlowPlanPricing(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({ planId: 3, price_monthly_kobo: 250000 });

    expect(mockRequest).toHaveBeenCalledWith("PATCH", "/admin/flow-plan-pricing/3", {
      price_monthly_kobo: 250000,
    });
  });

  it("revert → DELETEs the override row by plan id (reverts to platform default)", async () => {
    mockRequest.mockResolvedValue({ data: null });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTenantRevertFlowPlanPricing(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync(3);

    expect(mockRequest).toHaveBeenCalledWith("DELETE", "/admin/flow-plan-pricing/3", null);
  });
});
