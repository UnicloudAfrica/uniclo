import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

/*
 * GAP-003 — first pass of React Query hook tests.
 *
 * Business-critical target: wallet hooks. They handle balance fetch,
 * transaction history, top-up, billing-mode switching, and admin
 * adjustments. Bugs here directly affect money movement, so we pin
 * the observable contract (endpoint shape, cache invalidation,
 * response unwrapping) with a small but aggressive mock of the
 * underlying API layer.
 *
 * We mock the two shared api wrappers (`api/index` default export
 * and `silentApi`) rather than the fetch layer — the hooks are tested
 * at the boundary they actually depend on.
 */

const mockApi = vi.fn();
const mockSilentApi = vi.fn();

vi.mock("../../index/api", () => ({
  default: (...args: unknown[]) => mockApi(...args),
}));

vi.mock("../../index/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

import {
  useFetchWalletBalance,
  useFetchWalletTransactions,
  useTopUpWallet,
  useSetBillingMode,
  useGivePromoCredits,
} from "../walletHooks";

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

describe("useFetchWalletBalance", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("fetches balance with the supplied currency and unwraps { data: { data } }", async () => {
    mockSilentApi.mockResolvedValue({
      data: { data: { currency: "USD", balance: 4200 } },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchWalletBalance("USD"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/business/wallet", {
      currency: "USD",
    });
    expect(result.current.data).toEqual({ currency: "USD", balance: 4200 });
  });

  it("unwraps a single-level { data } envelope when the API omits the double wrap", async () => {
    mockSilentApi.mockResolvedValue({ data: { currency: "NGN", balance: 1000 } });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchWalletBalance("NGN"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ currency: "NGN", balance: 1000 });
  });
});

describe("useFetchWalletTransactions", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("passes query params through to the transactions endpoint", async () => {
    mockSilentApi.mockResolvedValue({
      data: [{ id: 1, type: "credit", amount: 500, currency: "NGN", created_at: "x" }],
      meta: { total: 1 },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useFetchWalletTransactions({ currency: "NGN", page: 2, per_page: 25 }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith(
      "GET",
      "/business/wallet/transactions",
      { currency: "NGN", page: 2, per_page: 25 },
    );
    expect((result.current.data as { data: unknown[] }).data).toHaveLength(1);
  });
});

describe("useTopUpWallet", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("posts to /business/wallet/topup and invalidates balance + transactions on success", async () => {
    mockApi.mockResolvedValue({ data: { reference: "pay_abc" } });

    const { Wrapper, client } = makeWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useTopUpWallet(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        amount: 1000,
        currency: "NGN",
        payment_method: "card",
      });
    });

    expect(mockApi).toHaveBeenCalledWith("POST", "/business/wallet/topup", {
      amount: 1000,
      currency: "NGN",
      payment_method: "card",
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([arg]) => (arg as { queryKey: unknown[] }).queryKey[0],
    );
    expect(invalidatedKeys).toContain("walletBalance");
    expect(invalidatedKeys).toContain("walletTransactions");
  });

  it("propagates API errors to the caller", async () => {
    mockApi.mockRejectedValue(new Error("Insufficient funds"));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTopUpWallet(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({
        amount: 1,
        currency: "NGN",
        payment_method: "card",
      }),
    ).rejects.toThrow("Insufficient funds");
  });
});

describe("useSetBillingMode", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("sends the billing_mode payload and invalidates only the wallet balance cache", async () => {
    mockApi.mockResolvedValue({ data: { billing_mode: "postpaid" } });

    const { Wrapper, client } = makeWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useSetBillingMode(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ billing_mode: "postpaid" });
    });

    expect(mockApi).toHaveBeenCalledWith("PUT", "/business/wallet/billing-mode", {
      billing_mode: "postpaid",
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([arg]) => (arg as { queryKey: unknown[] }).queryKey[0],
    );
    expect(invalidatedKeys).toEqual(["walletBalance"]);
  });
});

describe("useGivePromoCredits (admin)", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("posts to the admin promo-credits endpoint with the full payload", async () => {
    mockApi.mockResolvedValue({ data: { id: 99 } });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useGivePromoCredits(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        user_id: "u1",
        amount: 500,
        reason: "launch_promo",
        currency: "NGN",
      });
    });

    expect(mockApi).toHaveBeenCalledWith("POST", "/admin/v1/wallets/promo-credits", {
      user_id: "u1",
      amount: 500,
      reason: "launch_promo",
      currency: "NGN",
    });
  });
});
