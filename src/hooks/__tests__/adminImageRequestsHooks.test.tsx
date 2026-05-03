import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

const mockSilentApi = vi.fn();

vi.mock("../../index/admin/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

vi.mock("../../utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import {
  useAggregatedImageRequests,
  useApproveImageRequest,
  useBulkApproveImageRequests,
  useRejectImageRequest,
} from "../adminHooks/adminImageRequestsHooks";

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

describe("useAggregatedImageRequests", () => {
  beforeEach(() => mockSilentApi.mockReset());

  it("GETs /inventory/image-requests and unwraps data", async () => {
    mockSilentApi.mockResolvedValue({
      data: [
        {
          distro: "ubuntu",
          version: "24.04",
          arch: "x86_64",
          region: "lagos-1",
          total_requests: 5,
          unique_tenants: 3,
          status: "pending",
          latest_request: "2026-05-02T00:00:00Z",
        },
      ],
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAggregatedImageRequests(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/inventory/image-requests");
    expect(result.current.data?.[0]?.distro).toBe("ubuntu");
  });
});

describe("useApproveImageRequest", () => {
  beforeEach(() => mockSilentApi.mockReset());

  it("POSTs to the approve endpoint with the identifier", async () => {
    mockSilentApi.mockResolvedValue({ message: "Approval queued." });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useApproveImageRequest(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("img-req-123");
    });

    expect(mockSilentApi).toHaveBeenCalledWith(
      "POST",
      "/inventory/image-requests/img-req-123/approve"
    );
  });
});

describe("useBulkApproveImageRequests", () => {
  beforeEach(() => mockSilentApi.mockReset());

  it("POSTs the bulk-approve identifiers list", async () => {
    mockSilentApi.mockResolvedValue({
      message: "3 approved.",
      errors: [],
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBulkApproveImageRequests(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(["a", "b", "c"]);
    });

    expect(mockSilentApi).toHaveBeenCalledWith(
      "POST",
      "/inventory/image-requests/bulk-approve",
      { identifiers: ["a", "b", "c"] }
    );
  });
});

describe("useRejectImageRequest", () => {
  beforeEach(() => mockSilentApi.mockReset());

  it("POSTs the reject endpoint with reason in body", async () => {
    mockSilentApi.mockResolvedValue({ message: "Rejected." });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useRejectImageRequest(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        identifier: "img-req-9",
        reason: "duplicate",
      });
    });

    expect(mockSilentApi).toHaveBeenCalledWith(
      "POST",
      "/inventory/image-requests/img-req-9/reject",
      { reason: "duplicate" }
    );
  });
});
