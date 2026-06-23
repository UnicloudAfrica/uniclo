import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IntegrationPricingPane from "../IntegrationPricingPane";
import type { TenantIntegrationPricingRow } from "@/hooks/tenantHooks/tenantIntegrationPricingHooks";

const upsertMock = vi.fn();
const revertMock = vi.fn();
let mockRows: TenantIntegrationPricingRow[] = [];

vi.mock("@/hooks/tenantHooks/tenantIntegrationPricingHooks", () => ({
  useTenantFetchIntegrationPricing: () => ({ data: mockRows, isFetching: false }),
  useTenantUpsertIntegrationPricing: () => ({ mutateAsync: upsertMock, isPending: false }),
  useTenantRevertIntegrationPricing: () => ({ mutateAsync: revertMock, isPending: false }),
}));

// Admin hooks are imported by the module even though the tenant view never
// calls them — stub so nothing hits the network.
vi.mock("@/hooks/adminHooks/adminIntegrationPricingHooks", () => ({
  useFetchIntegrationPricing: () => ({ data: [], isFetching: false }),
  useUpdateIntegrationPricing: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function renderTenantPane(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const ui: ReactElement = (
    <QueryClientProvider client={client}>
      <IntegrationPricingPane
        role="tenant"
        integrationKey="anycloudflow"
        title="AnyCloudFlow services"
        description="Migration, replication, DR and backup-orchestration rates."
      />
    </QueryClientProvider>
  );
  render(ui);
}

const baseRow: TenantIntegrationPricingRow = {
  id: 7,
  integration_key: "anycloudflow",
  service_type: "vm_replication",
  name: "VM Replication",
  description: "Replicate VMs across regions",
  billing_model: "monthly_flat",
  unit_label: "per VM / month",
  provider: null,
  region: null,
  pricing_tiers: null,
  admin_price: 10,
  admin_currency_code: "USD",
  tenant_price: null,
  currency_code: "USD",
  effective_price: 10,
  has_override: false,
};

describe("IntegrationPricingPane — tenant view", () => {
  beforeEach(() => {
    upsertMock.mockReset().mockResolvedValue({});
    revertMock.mockReset().mockResolvedValue({});
    mockRows = [{ ...baseRow }];
  });

  it("scopes to the current tenant — no tenant picker, override editor renders directly", () => {
    renderTenantPane();

    // The broken model required selecting another tenant first. That picker
    // must be gone in the tenant dashboard.
    expect(screen.queryByText(/apply tenant overrides for/i)).toBeNull();
    expect(screen.queryByText(/select a tenant/i)).toBeNull();

    // Row + its own-tenant override editor render with no selection step.
    expect(screen.getByText("VM Replication")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-override-7")).toBeInTheDocument();
    expect(screen.getByText(/uses platform default/i)).toBeInTheDocument();
  });

  it("saves an override at or above the platform default", async () => {
    renderTenantPane();

    const input = screen.getByTestId("tenant-override-7-input");
    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.click(screen.getByTestId("tenant-override-7-save"));

    await waitFor(() => expect(upsertMock).toHaveBeenCalledTimes(1));
    expect(upsertMock).toHaveBeenCalledWith({
      integrationProductId: 7,
      price: 25,
      currency_code: "USD",
    });
  });

  it("blocks a price below the platform default and does not call the API", async () => {
    renderTenantPane();

    const input = screen.getByTestId("tenant-override-7-input");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("tenant-override-7-save"));

    expect(await screen.findByTestId("tenant-override-7-error")).toHaveTextContent(/below/i);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("clears an active override via the revert control", async () => {
    mockRows = [{ ...baseRow, tenant_price: 25, has_override: true }];
    renderTenantPane();

    fireEvent.click(screen.getByTestId("tenant-override-7-clear"));

    await waitFor(() => expect(revertMock).toHaveBeenCalledWith(7));
  });
});
