/**
 * Tests for `AdminMonitoringPricing` (B7 frontend).
 *
 * Mocks the data layer at module boundary (the page's own hooks) so the
 * assertions exercise rendering + interaction logic without touching
 * `fetch` or `silentApi`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Hook mocks ──────────────────────────────────────────────────────

const pricingState: { current: unknown } = {
  current: { data: [], isLoading: false, isFetching: false },
};
const updatePricingState: { current: unknown } = {
  current: { mutateAsync: vi.fn(), isPending: false },
};
const tenantPricingState: { current: unknown } = {
  current: { data: [], isFetching: false },
};
const upsertTenantState: { current: unknown } = {
  current: { mutateAsync: vi.fn(), isPending: false },
};

vi.mock("../hooks/useAdminMonitoringPricing", () => ({
  useMonitoringPricing: () => pricingState.current,
  useUpdateMonitoringPricing: () => updatePricingState.current,
  useTenantMonitoringPricing: () => tenantPricingState.current,
  useUpsertTenantMonitoringPricing: () => upsertTenantState.current,
}));

const tenantsState: { current: unknown } = {
  current: { data: [{ id: "ten-1", name: "Acme Co" }], isFetching: false },
};
vi.mock("@/hooks/adminHooks/tenantHooks", () => ({
  useFetchTenants: () => tenantsState.current,
}));

// PriceLabel internally calls useFormatPrice which queries the FX rate
// endpoint. Stub it to a trivial USD-only formatter to keep the test
// hermetic.
vi.mock("@/hooks/useFormatPrice", () => ({
  useFormatPrice: (amount: number, sourceCurrency: string) => ({
    formatted: `$${Number(amount).toFixed(2)}`,
    displayAmount: amount,
    displayCurrency: sourceCurrency,
    isLoading: false,
    fallback: false,
    rate: 1,
  }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import AdminMonitoringPricing from "./AdminMonitoringPricing";

// ─── Test scaffolding ────────────────────────────────────────────────

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminMonitoringPricing />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const mkPricingRows = () => [
  {
    tier: "standard" as const,
    price_per_host_usd: 10,
    retention_days: 7,
    features: ["cpu", "memory"],
  },
  {
    tier: "professional" as const,
    price_per_host_usd: 25,
    retention_days: 30,
    features: ["cpu", "memory", "alerts"],
  },
  {
    tier: "enterprise" as const,
    price_per_host_usd: 60,
    retention_days: 90,
    features: ["cpu", "memory", "alerts", "log-shipping"],
  },
];

beforeEach(() => {
  pricingState.current = {
    data: mkPricingRows(),
    isLoading: false,
    isFetching: false,
  };
  updatePricingState.current = {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  tenantPricingState.current = { data: [], isFetching: false };
  upsertTenantState.current = {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  tenantsState.current = {
    data: [{ id: "ten-1", name: "Acme Co" }],
    isFetching: false,
  };
  toastSuccess.mockReset();
  toastError.mockReset();
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminMonitoringPricing — tier list", () => {
  it("renders all three tiers with their retention and feature chips", () => {
    renderPage();

    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();

    // retention day labels — find at least the unique one
    expect(screen.getByText(/90 days/i)).toBeInTheDocument();

    // feature chips — "alerts" only appears in pro + enterprise
    expect(screen.getAllByText(/alerts/i).length).toBeGreaterThan(0);
  });

  it("renders an info callout when no tiers are configured", () => {
    pricingState.current = { data: [], isLoading: false, isFetching: false };

    renderPage();

    expect(screen.getByText(/No tiers configured/i)).toBeInTheDocument();
  });
});

describe("AdminMonitoringPricing — inline edit", () => {
  it("typing a new price marks the row dirty and submitting calls update", async () => {
    const user = userEvent.setup();
    renderPage();

    const standardInput = screen.getByLabelText(/Price for Standard/i) as HTMLInputElement;
    expect(standardInput.value).toBe("10");

    fireEvent.change(standardInput, { target: { value: "15" } });
    expect(standardInput.value).toBe("15");

    // Per-row Save button becomes enabled.
    const saveButtons = screen.getAllByRole("button", { name: /^Save$/ });
    const enabledSave = saveButtons.find((btn) => !(btn as HTMLButtonElement).disabled);
    expect(enabledSave).toBeTruthy();
    await user.click(enabledSave!);

    await waitFor(() => {
      expect(
        (updatePricingState.current as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync,
      ).toHaveBeenCalledWith({ tier: "standard", price_per_host_usd: 15 });
    });

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/Saved Standard/i)),
    );
  });

  it("rejects a negative price with an error toast", async () => {
    const user = userEvent.setup();
    renderPage();

    const proInput = screen.getByLabelText(/Price for Professional/i) as HTMLInputElement;
    fireEvent.change(proInput, { target: { value: "-5" } });

    const saveButtons = screen.getAllByRole("button", { name: /^Save$/ });
    const enabledSave = saveButtons.find((btn) => !(btn as HTMLButtonElement).disabled);
    await user.click(enabledSave!);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/Invalid price/i)),
    );
    expect(
      (updatePricingState.current as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync,
    ).not.toHaveBeenCalled();
  });
});

describe("AdminMonitoringPricing — tenant overrides", () => {
  it("selecting a tenant reveals the override table and saving calls upsert", async () => {
    const user = userEvent.setup();
    renderPage();

    // Override table is hidden until a tenant is picked.
    expect(screen.queryByLabelText(/Override for Standard/i)).toBeNull();

    const tenantSelect = screen.getByLabelText(/Apply overrides for/i) as HTMLSelectElement;
    fireEvent.change(tenantSelect, { target: { value: "ten-1" } });

    const overrideInput = await screen.findByLabelText(
      /Override for Standard/i,
    );
    fireEvent.change(overrideInput, { target: { value: "20" } });

    // The first override "Save" button. Filter to enabled ones in the
    // override table.
    const saveButtons = screen.getAllByRole("button", { name: /^Save$/ });
    const enabledSave = saveButtons.find((btn) => !(btn as HTMLButtonElement).disabled);
    await user.click(enabledSave!);

    await waitFor(() => {
      expect(
        (upsertTenantState.current as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync,
      ).toHaveBeenCalledWith({ tier: "standard", price_per_host_usd: 20 });
    });
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/Override saved/i)),
    );
  });

  it("marks the row as 'Override active' when the tenant has an existing override", async () => {
    tenantPricingState.current = {
      data: [{ tier: "professional" as const, price_per_host_usd: 30, is_override: true }],
      isFetching: false,
    };

    renderPage();

    const tenantSelect = screen.getByLabelText(/Apply overrides for/i) as HTMLSelectElement;
    fireEvent.change(tenantSelect, { target: { value: "ten-1" } });

    expect(await screen.findByText(/Override active/i)).toBeInTheDocument();
  });
});
