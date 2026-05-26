/**
 * Tests for `MonitoringDashboard` — re-entrancy guards.
 *
 * Validates that rapid double-clicks on the unassign / subscribe / cancel
 * buttons do not dispatch duplicate mutations, and that the visual
 * disabled state activates while a mutation is pending.
 *
 * Mocks the data layer at the hook-module boundary so we exercise the
 * component's handler wiring without touching `silentApi` / `fetch`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Hook + dependency mocks ─────────────────────────────────────────

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>;
  mutateAsync: ReturnType<typeof vi.fn>;
  isPending: boolean;
};

const statusState: { current: unknown } = { current: undefined };
const tiersState: { current: unknown } = { current: undefined };
const hostsState: { current: unknown } = { current: undefined };
const subscribeMutationState: { current: MutationStub } = {
  current: {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  },
};
const upgradeMutationState: { current: MutationStub } = {
  current: {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  },
};
const cancelMutationState: { current: MutationStub } = {
  current: {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  },
};
const unassignMutationState: { current: MutationStub } = {
  current: {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  },
};

vi.mock("@/hooks/monitoringSubscriptionHooks", () => ({
  useFetchMonitoringStatus: () => statusState.current,
  useFetchMonitoringTiers: () => tiersState.current,
  useFetchMonitoringHosts: () => hostsState.current,
  useSubscribeMonitoring: () => subscribeMutationState.current,
  useUpgradeMonitoring: () => upgradeMutationState.current,
  useCancelMonitoring: () => cancelMutationState.current,
  useUnassignMonitoringHost: () => unassignMutationState.current,
}));

vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import MonitoringDashboard from "../MonitoringDashboard";

// ─── Test scaffolding ────────────────────────────────────────────────

const renderDashboard = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MonitoringDashboard context="admin" />
    </QueryClientProvider>
  );
};

const mkPaidStatus = (overrides: Partial<Record<string, unknown>> = {}) => ({
  tier: "standard",
  subscription: {
    id: "sub-1",
    identifier: "sub-1",
    service_type: "monitoring_standard",
    status: "active",
    monthly_cost: 50,
    next_billing_date: null,
  },
  max_hosts: 10,
  used_hosts: 1,
  available_hosts: 9,
  ...overrides,
});

const mkBasicStatus = () => ({
  tier: "basic",
  subscription: null,
  max_hosts: 0,
  used_hosts: 0,
  available_hosts: 0,
});

beforeEach(() => {
  statusState.current = {
    data: mkPaidStatus(),
    isLoading: false,
    isError: false,
    error: null,
  };
  tiersState.current = {
    data: [
      {
        service_type: "monitoring_basic",
        name: "Basic",
        description: "",
        price_per_host: 0,
        features: ["Free"],
      },
      {
        service_type: "monitoring_standard",
        name: "Standard",
        description: "",
        price_per_host: 5,
        features: ["30-day retention"],
      },
      {
        service_type: "monitoring_professional",
        name: "Professional",
        description: "",
        price_per_host: 10,
        features: ["90-day retention"],
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  };
  hostsState.current = {
    data: {
      hosts: [
        { id: 1, name: "vm-001", ip_address: "10.0.0.1" },
      ],
      total: 1,
    },
    isLoading: false,
    isError: false,
    error: null,
  };
  subscribeMutationState.current = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  upgradeMutationState.current = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  cancelMutationState.current = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  unassignMutationState.current = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("MonitoringDashboard — unassign re-entrancy guard", () => {
  it("rapid double-click on the Trash2 unassign button fires the mutation exactly once", async () => {
    renderDashboard();

    const trashBtn = screen.getByRole("button", {
      name: /Remove vm-001 from monitoring/i,
    });

    // Two clicks in the same synchronous frame — fireEvent dispatches
    // without yielding the microtask queue, mimicking React's batched
    // onClick replay scenario.
    fireEvent.click(trashBtn);
    fireEvent.click(trashBtn);

    await waitFor(() => {
      expect(
        unassignMutationState.current.mutateAsync
      ).toHaveBeenCalledTimes(1);
    });
    expect(unassignMutationState.current.mutateAsync).toHaveBeenCalledWith(1);
  });

  it("disables the Trash2 unassign button visually while the action is pending", async () => {
    // Hold the mutation open so the action stays pending.
    let resolveUnassign: ((v: unknown) => void) | null = null;
    unassignMutationState.current = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(
        () => new Promise((resolve) => { resolveUnassign = resolve; })
      ),
      isPending: false,
    };

    renderDashboard();
    const trashBtn = screen.getByRole("button", {
      name: /Remove vm-001 from monitoring/i,
    }) as HTMLButtonElement;

    fireEvent.click(trashBtn);

    await waitFor(() => expect(trashBtn).toBeDisabled());

    resolveUnassign?.({});
  });
});

describe("MonitoringDashboard — cancel-subscription re-entrancy guard", () => {
  it("rapid double-click on Cancel Subscription fires the mutation exactly once", async () => {
    // window.confirm needs to be stubbed — handler short-circuits if false.
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDashboard();

    const cancelBtn = screen.getByRole("button", {
      name: /Cancel Subscription/i,
    });

    fireEvent.click(cancelBtn);
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(cancelMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});

describe("MonitoringDashboard — subscribe/upgrade re-entrancy guard", () => {
  it("rapid double-click on the tier subscribe button fires the mutation exactly once", async () => {
    statusState.current = {
      data: mkBasicStatus(),
      isLoading: false,
      isError: false,
      error: null,
    };

    renderDashboard();

    // Open the tier panel so the per-tier Subscribe buttons render.
    fireEvent.click(
      screen.getByRole("button", { name: /Subscribe to Paid Plan/i })
    );

    const subscribeBtns = await screen.findAllByRole("button", {
      name: /^Subscribe$/,
    });
    // The first tile (Standard tier) is the one we click.
    const subscribeBtn = subscribeBtns[0];

    fireEvent.click(subscribeBtn);
    fireEvent.click(subscribeBtn);

    await waitFor(() => {
      expect(
        subscribeMutationState.current.mutateAsync
      ).toHaveBeenCalledTimes(1);
    });
    expect(subscribeMutationState.current.mutateAsync).toHaveBeenCalledWith({
      service_type: "monitoring_standard",
    });
  });

  it("rapid double-click on 'Switch to this plan' fires the upgrade mutation exactly once", async () => {
    // tier=standard is current, so 'Professional' renders a Switch button.
    renderDashboard();

    fireEvent.click(
      screen.getByRole("button", { name: /Change Plan/i })
    );

    const switchBtn = await screen.findByRole("button", {
      name: /Switch to this plan/i,
    });

    fireEvent.click(switchBtn);
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(
        upgradeMutationState.current.mutateAsync
      ).toHaveBeenCalledTimes(1);
    });
    expect(upgradeMutationState.current.mutateAsync).toHaveBeenCalledWith({
      service_type: "monitoring_professional",
    });
  });
});
