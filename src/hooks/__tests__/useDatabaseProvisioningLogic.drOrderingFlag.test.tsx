import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * DR-ordering gating — feature-flag SOURCE contract (GAP-218).
 *
 * The backend 422s a `dr_enabled` payload unless
 * `config('features.managed_database_dr_ordering')` is on
 * (InitiateManagedDatabaseAction + StoreManagedDatabaseRequest). The wizard
 * therefore mirrors that flag off the public /features endpoint under key
 * `managed_database_dr_ordering`, exposes it as `drOrderingEnabled`, and fails
 * closed: when the flag is off, `drEnabled` is forced back to false so a stale
 * toggle can never submit a payload the backend would reject.
 *
 * Fixtures are hoisted + frozen so their identity is stable across renders.
 */
const { orderMutateAsync, quoteMutateAsync, mockUser, featureFlagsRef, ENGINES, EMPTY, REGIONS, AZS } =
  vi.hoisted(() => ({
    orderMutateAsync: vi.fn(async () => ({
      data: { payment: { required: false }, order: { id: 1 } },
    })),
    quoteMutateAsync: vi.fn(async () => ({ total: 100, currency: "USD" })),
    mockUser: { country_iso: "NG" } as const,
    featureFlagsRef: { current: {} as Record<string, boolean> },
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
  useFeatureFlags: () => ({ data: featureFlagsRef.current }),
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

import useDatabaseProvisioningLogic from "@/hooks/useDatabaseProvisioningLogic";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDatabaseProvisioningLogic — DR-ordering flag source", () => {
  beforeEach(() => {
    featureFlagsRef.current = {};
    orderMutateAsync.mockClear();
    quoteMutateAsync.mockClear();
  });

  it("exposes drOrderingEnabled = true when the /features flag is ON", async () => {
    featureFlagsRef.current = { managed_database_dr_ordering: true };

    const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.drOrderingEnabled).toBe(true));
  });

  it("exposes drOrderingEnabled = false when the /features flag is OFF", async () => {
    featureFlagsRef.current = { managed_database_dr_ordering: false };

    const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
      wrapper: createWrapper(),
    });

    expect(result.current.drOrderingEnabled).toBe(false);
  });

  it("defaults drOrderingEnabled to false (fail closed) when /features omits the key", async () => {
    featureFlagsRef.current = {};

    const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
      wrapper: createWrapper(),
    });

    expect(result.current.drOrderingEnabled).toBe(false);
  });

  it("forces drEnabled back to false when the flag is OFF (no 422 payload can leave the FE)", async () => {
    featureFlagsRef.current = { managed_database_dr_ordering: false };

    const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateForm({ drEnabled: true });
    });

    // The fail-closed effect drives it straight back to false.
    await waitFor(() => expect(result.current.form.drEnabled).toBe(false));
  });

  it("keeps a user-set drEnabled = true when the flag is ON", async () => {
    featureFlagsRef.current = { managed_database_dr_ordering: true };

    const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateForm({ drEnabled: true });
    });

    await waitFor(() => expect(result.current.form.drEnabled).toBe(true));
  });
});
