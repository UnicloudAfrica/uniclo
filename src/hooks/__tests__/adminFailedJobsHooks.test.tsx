import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * Hook tests for the admin Failed Jobs surface. Same pattern as walletHooks
 * — mock the silentApi wrapper, exercise the hook contract.
 *
 * Pins:
 *  - useFailedJobs hits /ops/failed-jobs with pagination params + unwraps
 *    the paginator shape exactly as the backend returns it.
 *  - useRetryFailedJob POSTs the right path + invalidates the list query.
 *  - useRetryAllFailedJobs POSTs /retry-all + reports the count.
 *
 * If a backend route changes, these tests fail loud rather than the UI
 * silently 404'ing.
 */

const mockSilentApi = vi.fn();

vi.mock("../../index/admin/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

vi.mock("../../utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import {
  useFailedJobs,
  useRetryFailedJob,
  useRetryAllFailedJobs,
} from "../adminHooks/adminFailedJobsHooks";

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

describe("useFailedJobs", () => {
  beforeEach(() => {
    mockSilentApi.mockReset();
  });

  it("calls /ops/failed-jobs with page + per_page", async () => {
    mockSilentApi.mockResolvedValue({
      data: [],
      total: 0,
      current_page: 1,
      per_page: 25,
      last_page: 1,
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFailedJobs(2, 25), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/ops/failed-jobs?page=2&per_page=25");
    expect(result.current.data?.total).toBe(0);
  });

  it("returns the paginator shape unchanged", async () => {
    const payload = {
      data: [
        {
          id: 1,
          uuid: "abc-123",
          connection: "sync",
          queue: "default",
          payload: "{}",
          payload_preview: "CopyVolumeDataJob",
          exception: "RuntimeException",
          failed_at: "2026-05-01T00:00:00Z",
        },
      ],
      total: 1,
      current_page: 1,
      per_page: 25,
      last_page: 1,
    };
    mockSilentApi.mockResolvedValue(payload);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFailedJobs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data[0]?.payload_preview).toBe("CopyVolumeDataJob");
    expect(result.current.data?.data[0]?.uuid).toBe("abc-123");
  });
});

describe("useRetryFailedJob", () => {
  beforeEach(() => {
    mockSilentApi.mockReset();
  });

  it("POSTs to /ops/failed-jobs/{uuid}/retry and invalidates the list", async () => {
    mockSilentApi.mockResolvedValue({ message: "Job re-queued.", uuid: "abc-123" });

    const { Wrapper, client } = makeWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useRetryFailedJob(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("abc-123");
    });

    expect(mockSilentApi).toHaveBeenCalledWith("POST", "/ops/failed-jobs/abc-123/retry");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "failed-jobs"] });
  });
});

describe("useRetryAllFailedJobs", () => {
  beforeEach(() => {
    mockSilentApi.mockReset();
  });

  it("POSTs to /ops/failed-jobs/retry-all and returns the count", async () => {
    mockSilentApi.mockResolvedValue({ message: "12 jobs re-queued.", count: 12 });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRetryAllFailedJobs(), { wrapper: Wrapper });

    let response: { message: string; count: number } | undefined;
    await act(async () => {
      response = await result.current.mutateAsync();
    });

    expect(mockSilentApi).toHaveBeenCalledWith("POST", "/ops/failed-jobs/retry-all");
    expect(response?.count).toBe(12);
  });
});
