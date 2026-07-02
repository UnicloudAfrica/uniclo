import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Disaster Recovery (same-provider) wiring contract.
 *
 * The DatabaseCreationWizard exposes a same-provider DR toggle that maps
 * to `form.drEnabled`. This test pins the load-bearing behaviour: the DR
 * selection must travel into the order submit payload as `dr_enabled`
 * (the field name the backend's StoreManagedDatabaseRequest /
 * InitiateManagedDatabaseAction read). Cross-provider / orbit DR stays
 * out of scope here — it's gated "coming soon" in the UI.
 *
 * We render the hook (not the JSX) so the assertion targets the real
 * payload-building logic in `handleCreateOrder`, rather than a fixture.
 */

// All mocked query results are HOISTED + frozen so they keep a stable
// identity across renders. The hook has several `useEffect`s that call
// `setForm` keyed off the identity of derived `useMemo`s (countryOptions,
// availabilityZones, …). A fresh array/object literal per render would
// flip those identities every render → effect re-runs → setForm →
// re-render → unbounded loop → OOM. Freezing the source data breaks it.
const {
  orderMutateAsync,
  quoteMutateAsync,
  mockUser,
  EMPTY,
  REGIONS,
  AZS,
} = vi.hoisted(() => ({
  orderMutateAsync: vi.fn(async (_payload: Record<string, unknown>) => ({
    data: { payment: { required: false }, order: { id: 1 } },
  })),
  quoteMutateAsync: vi.fn(async () => ({ total: 100, currency: "USD" })),
  mockUser: { country_iso: "NG" } as const,
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

// Order + quote mutations — capture the payload the hook submits.
vi.mock("@/shared/hooks/resources/managedDatabaseHooks", () => ({
  useDatabaseQuote: () => ({ mutateAsync: quoteMutateAsync, isPending: false }),
  useCreateDatabaseOrder: () => ({ mutateAsync: orderMutateAsync, isPending: false }),
  useFetchAvailableEngines: () => ({ data: undefined }),
  useFetchAvailablePlans: () => ({ data: undefined }),
}));

// DR ordering is flag-gated (GAP-218): the hook fails closed and forces
// `drEnabled` back to false unless the /features flag is on. DR submission
// is only reachable with the flag ON, which is the precondition this suite
// exercises, so mock it on.
vi.mock("@/hooks/featureFlagsHooks", () => ({
  useFeatureFlags: () => ({ data: { managed_database_dr_ordering: true } }),
}));

// Remaining data-fetching dependencies — neutralised so the hook renders
// without any network. AZ list is supplied so a primary AZ auto-selects.
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
  default: (selector: (state: { user: unknown }) => unknown) =>
    selector({ user: mockUser }),
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

/** Drive the form into a submittable state with a fixed DR selection. */
async function submitWith(drEnabled: boolean) {
  const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
    wrapper: createWrapper(),
  });

  act(() => {
    result.current.selectEngine("postgresql");
    result.current.updateForm({
      planSize: "small",
      region: "lagos-1",
      availabilityZone: "az-1",
      drEnabled,
    });
  });

  await waitFor(() => expect(result.current.canProceedToReview).toBe(true));

  await act(async () => {
    await result.current.handleCreateOrder();
  });

  return orderMutateAsync.mock.calls.at(-1)?.[0] as Record<string, unknown>;
}

describe("DatabaseCreationWizard — same-provider DR", () => {
  beforeEach(() => {
    orderMutateAsync.mockClear();
    quoteMutateAsync.mockClear();
  });

  it("includes dr_enabled: true in the submit payload when DR is toggled on", async () => {
    const payload = await submitWith(true);
    expect(payload).toMatchObject({ dr_enabled: true });
  });

  it("includes dr_enabled: false in the submit payload when DR is left off (default)", async () => {
    const payload = await submitWith(false);
    expect(payload.dr_enabled).toBe(false);
  });
});
