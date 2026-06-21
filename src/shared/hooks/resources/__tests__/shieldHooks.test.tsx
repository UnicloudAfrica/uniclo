import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * Regression for the shield-attack-map "data is undefined" bug.
 *
 * silentApi.get() returns the PARSED BODY (the `{ success, data }` envelope),
 * not an axios response — so the hook must unwrap with `asEnvelope(res).data`,
 * NOT `asEnvelope(res.data).data` (which double-unwraps to undefined and trips
 * the page's empty-state error guard).
 */

const mockGet = vi.fn();

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "admin" }),
}));

vi.mock("@/shared/api/apiRegistry", () => ({
  apiRegistry: {
    admin: {
      silentApi: { get: (...a: unknown[]) => mockGet(...a) },
      urlPrefix: "/api/v1/admin",
    },
  },
}));

import { useFetchAttackMap } from "../shieldHooks";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe("useFetchAttackMap", () => {
  beforeEach(() => mockGet.mockReset());

  it("unwraps the {success, data} envelope so data is defined (no double-unwrap)", async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        summary: { total_attacks: 0, active_domains: 0 },
        flows: [],
        top_sources: [],
        by_type: {},
        timeline: [],
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchAttackMap(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Before the fix this was `undefined`, which rendered the error state.
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.summary.total_attacks).toBe(0);
    expect(result.current.data?.flows).toEqual([]);
    expect(mockGet).toHaveBeenCalledWith("/api/v1/admin/shield/attack-map");
  });
});
