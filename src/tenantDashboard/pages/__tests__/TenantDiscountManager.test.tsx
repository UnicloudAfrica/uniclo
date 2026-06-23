/**
 * Tests for the tenant Discount & Settlement Manager page.
 *
 * The page's hooks call `tenantApi` (src/index/tenant/silentTenant) directly,
 * which resolves to the parsed HTTP body. So the mocked client returns the
 * exact envelope each backend `TenantSettlementController` action ships, and
 * the assertions verify the producer↔consumer contract end-to-end through the
 * real hooks + components.
 *
 * Every settlement endpoint is SINGLE-wrapped (`response()->json(['data' => …])`).
 * The hooks must therefore unwrap exactly once (margin-preview / summary /
 * client-discounts read `response.data`), except own-discount whose body carries
 * both `data` and a sibling `has_discount` flag — there the whole body IS the
 * shape the UI reads, so it must not be unwrapped at all. A regression to
 * double-unwrapping silently blanks these panels even on a valid 200.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";

// The page imports tenantApi via a relative path (no @/index alias exists).
// Mock the same module by the path that resolves to src/index/tenant/silentTenant.
vi.mock("../../../index/tenant/silentTenant", () => ({ default: vi.fn() }));

// Stub the page shell (heavy nav/branding chrome) down to a passthrough so the
// test isolates the settlement data flow.
vi.mock("../../../dashboard/components/TenantPageShell", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

import tenantApi from "../../../index/tenant/silentTenant";
import TenantDiscountManager from "../TenantDiscountManager";

const tenantApiMock = vi.mocked(tenantApi);

// Exactly the body verified live for the e2e tenant:
// GET /tenant/v1/admin/settlements/margin-preview?base_amount=250&discount_percent=20
const MARGIN_PREVIEW_BODY = {
  data: {
    base_amount: 250,
    tenant_discount_percent: 0,
    proposed_client_discount_percent: 20,
    client_pays: 200,
    tenant_owes: 250,
    margin: -50,
    margin_percent: -20,
    is_profitable: false,
    is_loss: true,
  },
};

type ApiOverrides = {
  summary?: unknown;
  ownDiscount?: unknown;
  clientDiscounts?: unknown;
  marginPreview?: unknown;
};

const installApi = (overrides: ApiOverrides = {}) => {
  const responses = {
    // Single-wrapped, like TenantSettlementController@summary. Receivable side
    // lives under `as_payee` (total_received / outstanding_receivable).
    summary: {
      data: {
        as_payer: { outstanding: 0 },
        as_payee: { total_received: 0, outstanding_receivable: 0 },
        margins: {},
      },
    },
    // Whole body is the OwnDiscount shape: { data, has_discount }.
    ownDiscount: { data: null, has_discount: false },
    // Single-wrapped array, like @getClientDiscounts.
    clientDiscounts: { data: [] },
    marginPreview: MARGIN_PREVIEW_BODY,
    ...overrides,
  };

  tenantApiMock.mockImplementation((_method: string, path: string) => {
    if (path.includes("settlements/summary")) return Promise.resolve(responses.summary);
    if (path.includes("settlements/own-discount")) return Promise.resolve(responses.ownDiscount);
    if (path.includes("settlements/margin-preview")) {
      return Promise.resolve(responses.marginPreview);
    }
    if (path.includes("client-discounts")) return Promise.resolve(responses.clientDiscounts);
    return Promise.resolve({});
  });
};

const renderPage = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  tenantApiMock.mockReset();
});

describe("TenantDiscountManager — margin calculator", () => {
  it("renders the margin preview from a single-wrapped { data: {...} } response", async () => {
    installApi();

    renderPage(<TenantDiscountManager />);

    // Preview block is absent until a calculation succeeds.
    expect(screen.queryByText("Client Pays:")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("100"), { target: { value: "250" } });
    fireEvent.change(screen.getByPlaceholderText("30"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate Margin/i }));

    // The numbers only appear if the single-wrapped body was unwrapped once.
    await waitFor(() => {
      expect(screen.getByText("Client Pays:")).toBeInTheDocument();
    });
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText(/-\$50\.00\s*\(-20%\)/)).toBeInTheDocument();
    expect(screen.getByText(/This discount results in a loss/i)).toBeInTheDocument();

    // Producer contract: the request carried the inputs as query params.
    const previewCall = tenantApiMock.mock.calls.find(([, path]) =>
      String(path).includes("margin-preview")
    );
    expect(previewCall?.[1]).toMatch(/base_amount=250.*discount_percent=20/);
  });

  it("shows the tenant's own admin discount from the { data, has_discount } body", async () => {
    installApi({
      ownDiscount: { data: { discount_type: "percent", value: 10 }, has_discount: true },
    });

    renderPage(<TenantDiscountManager />);

    // Reads `has_discount` (top level) AND `data.value` (nested) — both must
    // survive, which only happens when the body is returned un-unwrapped.
    await waitFor(() => {
      expect(screen.getByText(/Your discount from admin/i)).toBeInTheDocument();
    });
    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});

describe("TenantDiscountManager — settlement panels", () => {
  it("renders summary cards and client-discount rows from single-wrapped responses", async () => {
    installApi({
      summary: {
        data: {
          as_payer: { outstanding: 1500 },
          as_payee: { total_received: 7800, outstanding_receivable: 640 },
          margins: {},
        },
      },
      clientDiscounts: {
        data: [
          {
            id: 1,
            discount_type: "percent",
            value: 15,
            ends_at: null,
            applies_to: { first_name: "Ada", last_name: "Lovelace" },
            applies_to_id: 42,
          },
        ],
      },
    });

    renderPage(<TenantDiscountManager />);

    await waitFor(() => {
      // Summary card unwrapped → "Outstanding to Admin" shows the real value.
      // (Before the fix `response.data.data` was undefined → the whole block hid.)
      expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    });

    // Cards 2 & 3 read the receivable side from `as_payee` (previously
    // `as_payer.total_paid` and the non-existent `as_receiver` → always $0).
    expect(screen.getByText("$7,800.00")).toBeInTheDocument(); // Total Received
    expect(screen.getByText("$640.00")).toBeInTheDocument(); // Outstanding from Clients

    // Client-discount list unwrapped → the row renders instead of the empty state.
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(/15%\s*discount/i)).toBeInTheDocument();
    expect(screen.queryByText("No client discounts configured")).toBeNull();
  });
});
