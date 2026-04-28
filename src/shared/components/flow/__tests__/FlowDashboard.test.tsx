import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * FlowDashboard smoke tests. Stubs `useFlowApi` so we can assert the
 * dashboard renders the right banners + tabs for each subscription state
 * without needing a real backend.
 *
 * Focus areas:
 *   1. Loading spinner while fetching status
 *   2. "Get started" view when not subscribed
 *   3. Trial banner with day count when on trial
 *   4. Past-due banner when status === 'past_due' (UX regression net for #6)
 */

const mockGetStatus = vi.fn();
const mockGetPlans = vi.fn();
const mockGetServers = vi.fn();
const mockSubscribe = vi.fn();
const mockCancel = vi.fn();

vi.mock("@/shared/hooks/useFlowApi", () => ({
  useFlowApi: () => ({
    getStatus: mockGetStatus,
    getPlans: mockGetPlans,
    getServers: mockGetServers,
    subscribe: mockSubscribe,
    cancel: mockCancel,
  }),
}));

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({
    context: "tenant",
    apiBaseUrl: "/tenant/v1/admin",
    authHeaders: {},
    isAuthenticated: true,
  }),
}));

import FlowDashboard from "../FlowDashboard";

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const basePlans = [
  {
    id: 1,
    slug: "starter",
    name: "Starter",
    price_monthly_kobo: 500000,
    max_servers: 5,
    max_sites: 25,
    max_databases: 10,
    is_active: true,
    has_trial: true,
    trial_days: 14,
    features: [],
  },
];

beforeEach(() => {
  mockGetStatus.mockReset();
  mockGetPlans.mockReset();
  mockGetServers.mockReset();
  mockGetPlans.mockResolvedValue({ data: basePlans });
  mockGetServers.mockResolvedValue({ data: { servers: [] } });
});

describe("FlowDashboard", () => {
  it("shows the loading spinner while status is fetching", () => {
    mockGetStatus.mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <Wrapper>
        <FlowDashboard basePath="/dashboard/flow" />
      </Wrapper>,
    );

    // The lucide loader has aria-hidden, but the parent should be rendered
    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });

  it("shows the get-started view when not subscribed", async () => {
    mockGetStatus.mockResolvedValue({
      data: { subscribed: false, message: "No active UniCloudFlow subscription." },
    });

    render(
      <Wrapper>
        <FlowDashboard basePath="/dashboard/flow" />
      </Wrapper>,
    );

    await waitFor(() => {
      // Plan card renders when unsubscribed
      expect(screen.getByText("Starter")).toBeInTheDocument();
      // Hero copy mentions the trial
      expect(screen.getByText(/free 30-day trial/i)).toBeInTheDocument();
    });
  });

  it("renders the trial banner with days remaining when on trial", async () => {
    mockGetStatus.mockResolvedValue({
      data: {
        subscribed: true,
        is_usable: true,
        is_on_trial: true,
        is_trial_expired: false,
        trial_days_remaining: 7,
        can_add_server: true,
        can_add_site: true,
        subscription: {
          id: 1,
          tenant_id: "00000000-0000-0000-0000-000000000000",
          plan_id: 1,
          status: "trialing",
          trial_ends_at: new Date().toISOString(),
          plan: basePlans[0],
        },
      },
    });

    render(
      <Wrapper>
        <FlowDashboard basePath="/dashboard/flow" />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/7 days remaining|day remaining/i)).toBeInTheDocument();
    });
  });

  it("renders the past-due banner when subscription.status === 'past_due'", async () => {
    mockGetStatus.mockResolvedValue({
      data: {
        subscribed: true,
        is_usable: false,
        is_on_trial: false,
        is_trial_expired: false,
        trial_days_remaining: null,
        can_add_server: false,
        can_add_site: false,
        subscription: {
          id: 1,
          tenant_id: "00000000-0000-0000-0000-000000000000",
          plan_id: 1,
          status: "past_due",
          plan: basePlans[0],
        },
      },
    });

    render(
      <Wrapper>
        <FlowDashboard basePath="/dashboard/flow" />
      </Wrapper>,
    );

    await waitFor(() => {
      // Banner copy
      expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
      // CTA
      expect(
        screen.getByRole("button", { name: /Update payment method/i }),
      ).toBeInTheDocument();
      // Banner has alert role for screen readers
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
