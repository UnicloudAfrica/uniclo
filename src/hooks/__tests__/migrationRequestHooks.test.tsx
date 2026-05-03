import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * Hook tests for the customer-facing migration request surface.
 *
 * Pins:
 *  - useMigrationRequests hits the right path + unwraps `{ data: [...] }`.
 *  - useSubmitMigrationRequest POSTs the single-pair payload.
 *  - useSubmitBatchMigrationRequests POSTs to /batch with the pairs array
 *    (the multi-region feature).
 */

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("../../lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("../../utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import {
  useMigrationRequests,
  useSubmitMigrationRequest,
  useSubmitBatchMigrationRequests,
} from "../migrationRequestHooks";

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

describe("useMigrationRequests", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it("GETs /migration-requests and unwraps the data array", async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 1,
          identifier: "mig-req-1",
          tenant_id: "t-1",
          source_provider: "zadara",
          source_region: "lagos-1",
          target_region: "abuja-1",
          status: "pending",
          customer_notes: null,
          admin_notes: null,
          provider_migration_id: null,
          created_at: "2026-05-01T00:00:00Z",
          updated_at: "2026-05-01T00:00:00Z",
          user_id: 1,
          preferred_window_start: null,
          preferred_window_end: null,
        },
      ],
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useMigrationRequests(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/migration-requests", { silent: true });
    expect(result.current.data?.[0]?.identifier).toBe("mig-req-1");
  });
});

describe("useSubmitMigrationRequest", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it("POSTs the single-pair payload", async () => {
    mockPost.mockResolvedValue({ data: { identifier: "mig-req-99" }, message: "ok" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSubmitMigrationRequest(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        source_provider: "zadara",
        source_region: "lagos-1",
        target_region: "abuja-1",
        customer_notes: "weekend window please",
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/migration-requests",
      expect.objectContaining({
        source_provider: "zadara",
        source_region: "lagos-1",
        target_region: "abuja-1",
      })
    );
  });
});

describe("useSubmitBatchMigrationRequests", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it("POSTs /migration-requests/batch with the pairs array", async () => {
    mockPost.mockResolvedValue({
      message: "2 migration request(s) submitted.",
      data: [{ identifier: "mig-1" }, { identifier: "mig-2" }],
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useSubmitBatchMigrationRequests(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        source_provider: "zadara",
        pairs: [
          { source_region: "lagos-1", target_region: "abuja-1" },
          { source_region: "abuja-1", target_region: "lagos-1" },
        ],
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/migration-requests/batch",
      expect.objectContaining({
        source_provider: "zadara",
        pairs: [
          { source_region: "lagos-1", target_region: "abuja-1" },
          { source_region: "abuja-1", target_region: "lagos-1" },
        ],
      })
    );
  });
});
