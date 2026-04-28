import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/*
 * Phase 10 — useFormatPrice hook tests.
 *
 * Pins the stability guarantee on the frontend: repeated renders inside
 * the published-rate window produce identical NGN amounts, and manual
 * API rejections fall back to the source currency instead of rendering
 * ₦NaN.
 */

const mockSilentApi = vi.fn();

vi.mock("../../index/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

// useCurrency pulls from the auth store; stub it to return a fixed
// display currency so these tests don't depend on store mocking.
vi.mock("../useCurrency", () => {
  const table = {
    NGN: { code: "NGN", symbol: "₦", precision: 2 },
    USD: { code: "USD", symbol: "$", precision: 2 },
  };
  return {
    useCurrency: () => table.NGN,
    CURRENCY_TABLE: table,
  };
});

import { useFormatPrice } from "../useFormatPrice";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

describe("useFormatPrice", () => {
  beforeEach(() => {
    mockSilentApi.mockReset();
  });

  it("short-circuits when source equals display currency (no API call)", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFormatPrice(1000, "NGN"), {
      wrapper: Wrapper,
    });

    expect(result.current.displayAmount).toBe(1000);
    expect(result.current.displayCurrency).toBe("NGN");
    expect(result.current.rate).toBe(1);
    expect(result.current.formatted).toBe("₦1,000.00");
    expect(mockSilentApi).not.toHaveBeenCalled();
  });

  it("converts using the published rate on a cross-currency amount", async () => {
    mockSilentApi.mockResolvedValue({
      data: {
        rate: 1600,
        source_currency: "USD",
        target_currency: "NGN",
        fx_source: "published",
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFormatPrice(10, "USD"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockSilentApi).toHaveBeenCalledWith(
      "GET",
      "/exchange-rates/published?source_currency=USD&target_currency=NGN",
    );
    expect(result.current.displayAmount).toBe(16000);
    expect(result.current.displayCurrency).toBe("NGN");
    expect(result.current.rate).toBe(1600);
    expect(result.current.formatted).toBe("₦16,000.00");
    expect(result.current.fallback).toBe(false);
  });

  it("falls back to the source currency when no published rate exists", async () => {
    mockSilentApi.mockResolvedValue({ data: null });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFormatPrice(10, "USD"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.fallback).toBe(true);
    expect(result.current.displayCurrency).toBe("USD");
    expect(result.current.formatted).toBe("$10.00");
    expect(result.current.rate).toBeNull();
  });

  it("is stable across repeated renders within a published-rate window", async () => {
    mockSilentApi.mockResolvedValue({
      data: { rate: 1600, source_currency: "USD", target_currency: "NGN", fx_source: "published" },
    });

    const { Wrapper, client } = makeWrapper();

    // Pre-warm the cache.
    const { result: first } = renderHook(() => useFormatPrice(10, "USD"), { wrapper: Wrapper });
    await waitFor(() => expect(first.current.isLoading).toBe(false));

    // Second render should NOT hit the API again (cached).
    mockSilentApi.mockClear();
    const { result: second } = renderHook(() => useFormatPrice(10, "USD"), { wrapper: Wrapper });

    // With cached data the hook resolves synchronously.
    expect(second.current.displayAmount).toBe(16000);
    expect(mockSilentApi).not.toHaveBeenCalled();

    client.clear();
  });
});
