import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

/*
 * GAP-003 round 2 — subscription hooks regression coverage. Pins the
 * envelope handling (single vs double `data` wrap) and the cache
 * invalidation behaviour on mutations so the admin subscription
 * dashboard doesn't silently regress when the API response shape shifts.
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
  useFetchSubscriptionPlan,
  useFetchSubscriptions,
  useCancelSubscription,
  useChangeSubscriptionPlan,
} from "../subscriptionHooks";

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

describe("subscriptionHooks — envelope handling", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("useFetchSubscriptionPlan unwraps a { data: {...} } envelope", async () => {
    mockSilentApi.mockResolvedValue({
      data: {
        id: "p_1",
        name: "Pro",
        price: 100,
        currency: "NGN",
        interval: "month",
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchSubscriptionPlan("p_1"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/subscription-plans/p_1");
    expect(result.current.data).toMatchObject({ id: "p_1", name: "Pro" });
  });

  it("useFetchSubscriptionPlan accepts flat responses (no data wrapper)", async () => {
    mockSilentApi.mockResolvedValue({
      id: "p_2",
      name: "Lite",
      price: 50,
      currency: "NGN",
      interval: "month",
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchSubscriptionPlan("p_2"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({ id: "p_2", name: "Lite" });
  });

  it("useFetchSubscriptions passes query params through", async () => {
    mockSilentApi.mockResolvedValue({ data: [{ id: "s1", plan_id: "p1", status: "active" }] });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFetchSubscriptions({ status: "active", page: 2 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSilentApi).toHaveBeenCalledWith("GET", "/subscriptions", {
      status: "active",
      page: 2,
    });
  });
});

describe("subscriptionHooks — mutation cache invalidation", () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockSilentApi.mockReset();
  });

  it("useCancelSubscription busts subscriptions + subscription + stats caches", async () => {
    mockApi.mockResolvedValue({ data: { ok: true } });

    const { Wrapper, client } = makeWrapper();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCancelSubscription(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "sub_1", reason: "downgrade" });
    });

    expect(mockApi).toHaveBeenCalledWith("POST", "/subscriptions/sub_1/cancel", {
      reason: "downgrade",
      note: undefined,
      immediately: undefined,
    });

    const keys = invalidate.mock.calls.map(
      ([arg]) => (arg as { queryKey: unknown[] }).queryKey[0],
    );
    expect(keys).toContain("subscriptions");
    expect(keys).toContain("subscription");
    expect(keys).toContain("subscriptionStats");
  });

  it("useChangeSubscriptionPlan hits /change-plan with the prorate flag", async () => {
    mockApi.mockResolvedValue({ data: { id: "sub_1", plan_id: "new_plan", status: "active" } });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useChangeSubscriptionPlan(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "sub_1",
        plan_id: "new_plan",
        prorate: true,
      });
    });

    expect(mockApi).toHaveBeenCalledWith("POST", "/subscriptions/sub_1/change-plan", {
      plan_id: "new_plan",
      prorate: true,
    });
  });
});
