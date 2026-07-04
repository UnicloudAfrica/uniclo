import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Quote-less submit guard — the backend REQUIRES expected_total on
 * non-fast-track managed-DB creates (422 without it). A submit reaching
 * /store with no confirmable quote total means the customer never saw a
 * price: the hook must BLOCK with the re-quote UX instead of shipping a
 * payload the backend will reject. Fast-track legitimately submits
 * quote-less (skips payment; the backend exempts it) and must pass through.
 *
 * Harness mirrors useDatabaseProvisioningLogic.crossProviderFlag.test.tsx
 * (hoisted frozen fixtures — see that file's OOM note).
 */
const { orderMutateAsync, quoteMutateAsync, toastError, mockUser, ENGINES, EMPTY, REGIONS, AZS } =
  vi.hoisted(() => ({
    orderMutateAsync: vi.fn(async () => ({
      data: { payment: { required: false }, order: { id: 1 } },
    })),
    quoteMutateAsync: vi.fn(async () => ({ total: 100, currency: "USD" })),
    toastError: vi.fn(),
    mockUser: { country_iso: "NG" } as const,
    ENGINES: {
      postgresql: {
        label: "PostgreSQL",
        supports_replication: true,
        max_replicas: 5,
        replication: { tier: "disk_backed" },
      },
    } as const,
    EMPTY: [] as const,
    REGIONS: [
      {
        region: "lagos-1",
        label: "Lagos",
        availability_zones: [{ code: "az-1", name: "AZ 1", provider: "alpha" }],
      },
    ] as const,
    AZS: [{ code: "az-1", name: "AZ 1", provider: "alpha" }] as const,
  }));

vi.mock("@/hooks/featureFlagsHooks", () => ({
  useFeatureFlags: () => ({ data: {} }),
}));
vi.mock("@/shared/hooks/resources/managedDatabaseHooks", () => ({
  useDatabaseQuote: () => ({ mutateAsync: quoteMutateAsync, isPending: false }),
  useCreateDatabaseOrder: () => ({ mutateAsync: orderMutateAsync, isPending: false }),
  useFetchAvailableEngines: () => ({ data: ENGINES }),
  useFetchAvailablePlans: () => ({ data: undefined }),
}));
vi.mock("@/shared/hooks/resources", () => ({
  useFetchProjects: () => ({ data: EMPTY }),
}));
vi.mock("@/shared/hooks/resources/projectHooks", () => ({
  useProjectMembershipSuggestions: () => ({ data: EMPTY, isFetching: false }),
}));
vi.mock("@/shared/hooks/resources/regionHooks", () => ({
  useFetchRegions: () => ({ data: REGIONS }),
  useFetchAvailabilityZones: () => ({ data: AZS }),
}));
vi.mock("@/hooks/resource", () => ({
  useFetchCountries: () => ({ data: EMPTY, isFetching: false }),
}));
vi.mock("@/hooks/adminHooks/useCustomerContext", () => ({
  useCustomerContext: () => ({
    tenants: [],
    isTenantsFetching: false,
    userPool: [],
    isUsersFetching: false,
    contextType: "tenant",
    setContextType: vi.fn(),
    selectedTenantId: null,
    setSelectedTenantId: vi.fn(),
    selectedUserId: null,
    setSelectedUserId: vi.fn(),
  }),
}));
vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "client" }),
}));
vi.mock("@/stores/authStore", () => ({
  default: (selector: (state: { user: unknown }) => unknown) => selector({ user: mockUser }),
}));
vi.mock("@/utils/toastUtil", () => ({
  default: { error: toastError, success: vi.fn() },
}));

import useDatabaseProvisioningLogic from "@/hooks/useDatabaseProvisioningLogic";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/** Render with a complete, submittable form but NO quote fetched. */
async function renderSubmittableWithoutQuote() {
  const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
    wrapper: createWrapper(),
  });

  act(() => {
    result.current.selectEngine("postgresql");
    result.current.updateForm({
      engineVersion: "16",
      planSize: "small",
      region: "lagos-1",
    });
  });

  await waitFor(() => {
    expect(result.current.canProceedToReview).toBe(true);
  });

  return result;
}

describe("useDatabaseProvisioningLogic — quote-less submit guard", () => {
  beforeEach(() => {
    orderMutateAsync.mockClear();
    quoteMutateAsync.mockClear();
    toastError.mockClear();
  });

  it("blocks a non-fast-track submit with no quote total: no order call, re-quote UX", async () => {
    const result = await renderSubmittableWithoutQuote();

    await act(async () => {
      // NOTE: the return value is swallowed by useAsyncAction.run() (same for
      // the 409 requote path) — the guard's contract is behavioral, asserted
      // below, not the callback's internal return.
      await result.current.handleCreateOrder();
    });

    // The order mutation must never fire without a confirmable total —
    // this assertion fails if the guard is removed (the payload would ship
    // without expected_total and 422 on the backend).
    expect(orderMutateAsync).not.toHaveBeenCalled();
    // The guard re-quotes and tells the user why.
    expect(quoteMutateAsync).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/couldn't confirm the order total/i));
  });

  it("lets a fast-track submit through quote-less (the backend exemption)", async () => {
    const result = await renderSubmittableWithoutQuote();

    act(() => {
      result.current.updateForm({ fastTrack: true });
    });

    await act(async () => {
      await result.current.handleCreateOrder();
    });

    expect(orderMutateAsync).toHaveBeenCalledTimes(1);
    const payload = (orderMutateAsync.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(payload.fast_track).toBe(true);
    expect(payload.expected_total).toBeUndefined();
  });
});
