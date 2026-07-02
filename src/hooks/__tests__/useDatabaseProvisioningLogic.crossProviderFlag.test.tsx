import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cross-provider replica gating — feature-flag SOURCE contract (GAP-216).
 *
 * The wizard marks cross-provider replica AZs selectable only when the
 * managed-database cross-provider flag is on. The bug: the flag was read
 * from `window.__MANAGED_DB_CROSS_PROVIDER_ENABLED__`, which nothing in the
 * app ever assigned → the flag could never turn on → cross-provider was
 * permanently "coming soon" even where the backend allowed it.
 *
 * The fix sources the flag from `useFeatureFlags()` (the public /features
 * endpoint) under key `managed_database_cross_provider`. This test mocks
 * THAT source and asserts the wizard's replica-AZ selectability tracks it —
 * proving the flag now has a real, reachable source. The pure-function
 * behaviour of `tagReplicaAzModes` is covered separately in
 * `filterSameProviderReplicaAzs.test.ts`; here we pin the wiring.
 *
 * Fixtures are hoisted + frozen so their identity is stable across renders
 * (the hook has effects keyed off derived-memo identity; fresh literals per
 * render would loop → OOM). See DatabaseCreationWizardDr.test.tsx.
 */
const {
  orderMutateAsync,
  quoteMutateAsync,
  mockUser,
  featureFlagsRef,
  ENGINES,
  EMPTY,
  REGIONS,
  AZS,
} = vi.hoisted(() => ({
  orderMutateAsync: vi.fn(async () => ({
    data: { payment: { required: false }, order: { id: 1 } },
  })),
  quoteMutateAsync: vi.fn(async () => ({ total: 100, currency: "USD" })),
  mockUser: { country_iso: "NG" } as const,
  // Mutable holder so each test can set the flag the hook will read.
  featureFlagsRef: { current: {} as Record<string, boolean> },
  // Server engine catalog — postgresql is disk_backed, which the tagger
  // maps to public_endpoint cross-provider capability. Without a tier the
  // tagger falls back to "unavailable" regardless of the flag.
  ENGINES: {
    postgresql: {
      label: "PostgreSQL",
      supports_replication: true,
      max_replicas: 5,
      replication: { tier: "disk_backed" },
    },
  } as const,
  EMPTY: [] as const,
  // Two AZs in the same region under DIFFERENT providers → az-2 is the
  // cross-provider replica target relative to primary az-1.
  REGIONS: [
    {
      region: "lagos-1",
      label: "Lagos",
      availability_zones: [
        { code: "az-1", name: "AZ 1", provider: "alpha" },
        { code: "az-2", name: "AZ 2", provider: "beta" },
      ],
    },
  ] as const,
  AZS: [
    { code: "az-1", name: "AZ 1", provider: "alpha" },
    { code: "az-2", name: "AZ 2", provider: "beta" },
  ] as const,
}));

// The flag SOURCE under test.
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

/** Render the wizard with a disk_backed engine + primary AZ az-1 selected. */
async function renderWithPrimarySelected() {
  const { result } = renderHook(() => useDatabaseProvisioningLogic(), {
    wrapper: createWrapper(),
  });

  act(() => {
    result.current.selectEngine("postgresql"); // disk_backed tier
    result.current.updateForm({ region: "lagos-1", availabilityZone: "az-1" });
  });

  // Wait for the tagger to see the cross-provider AZ (az-2, provider beta).
  await waitFor(() => {
    expect(result.current.taggedReplicaAzs.some((az) => az.value === "az-2")).toBe(true);
  });

  return result;
}

describe("useDatabaseProvisioningLogic — cross-provider flag source", () => {
  beforeEach(() => {
    featureFlagsRef.current = {};
    orderMutateAsync.mockClear();
    quoteMutateAsync.mockClear();
  });

  it("marks the cross-provider AZ SELECTABLE for disk_backed when the /features flag is ON", async () => {
    featureFlagsRef.current = { managed_database_cross_provider: true };

    const result = await renderWithPrimarySelected();

    const crossAz = result.current.taggedReplicaAzs.find((az) => az.value === "az-2");
    expect(crossAz?.mode).toBe("public_endpoint");
    expect(crossAz?.selectable).toBe(true);
    expect(result.current.replicaAvailableAzs.map((az) => az.value)).toContain("az-2");
  });

  it("shows the cross-provider AZ as 'coming soon' (NOT selectable) when the /features flag is OFF", async () => {
    featureFlagsRef.current = { managed_database_cross_provider: false };

    const result = await renderWithPrimarySelected();

    const crossAz = result.current.taggedReplicaAzs.find((az) => az.value === "az-2");
    // Still surfaced with a public_endpoint badge, but disabled → "coming soon".
    expect(crossAz?.mode).toBe("public_endpoint");
    expect(crossAz?.selectable).toBe(false);
    expect(result.current.replicaAvailableAzs.map((az) => az.value)).not.toContain("az-2");
  });

  it("defaults to OFF (coming soon) when /features omits the key entirely", async () => {
    featureFlagsRef.current = {}; // key absent → fail closed

    const result = await renderWithPrimarySelected();

    const crossAz = result.current.taggedReplicaAzs.find((az) => az.value === "az-2");
    expect(crossAz?.selectable).toBe(false);
  });
});
