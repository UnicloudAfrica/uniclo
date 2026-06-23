/**
 * Tenant availability-zone loading in the invoice wizard.
 *
 * Regression guard for the bug where ResourceItemBuilder imported the
 * admin-only `useFetchAvailabilityZones`, which issued an un-prefixed
 * `GET /tenant/v1/regions/{code}/availability-zones` in tenant context →
 * 404, leaving the AZ dropdown empty so a tenant operator could not add a
 * compute line item.
 *
 * The real tenant route is `/tenant/v1/admin/regions/{code}/availability-zones`
 * (the `admin` prefix group in routes/tenant.php). The context-aware shared
 * hook resolves that via apiRegistry.tenant.urlPrefix === "/admin". This fetch
 * mock therefore serves AZs ONLY at the correctly-prefixed URL and 404s
 * everything else, mirroring the live backend.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import ResourceItemBuilder from "../ResourceItemBuilder";
import type { InvoiceFormData, BillingRegion, UpdateInvoiceFormData } from "../../types";

const TENANT_AZ_PATH = "/tenant/v1/admin/regions/uni-ng/availability-zones";
const BARE_AZ_PATH = "/tenant/v1/regions/uni-ng/availability-zones";

const azPayload = {
  data: [
    {
      code: "uni-ng-az1",
      name: "Lagos Zone A",
      provider: "zadara",
      status: "healthy",
      is_active: true,
    },
    {
      code: "uni-ng-az2",
      name: "Lagos Zone B",
      provider: "zadara",
      status: "healthy",
      is_active: true,
    },
  ],
};

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (key: string) => (key.toLowerCase() === "content-type" ? "application/json" : null),
  },
  text: async () => JSON.stringify(body),
  json: async () => body,
});

const fetchMock = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith(TENANT_AZ_PATH)) {
    return Promise.resolve(jsonResponse(azPayload));
  }
  // Any other path — including the buggy un-prefixed tenant URL — is a 404,
  // exactly as the backend responds.
  return Promise.resolve(jsonResponse({ message: "Not Found" }, 404));
});

const baseFormData: InvoiceFormData = {
  subject: "",
  email: "",
  emails: "",
  notes: "",
  bill_to_name: "",
  invoice_date: "2026-06-23",
  due_date: "2026-07-23",
  intent: "invoice",
  apply_total_discount: false,
  total_discount_type: "percent",
  total_discount_value: "",
  total_discount_label: "",
  create_lead: false,
  lead_first_name: "",
  lead_last_name: "",
  lead_email: "",
  lead_phone: "",
  lead_company: "",
  lead_country: "",
  region: "uni-ng",
  availability_zone: "",
  compute_instance_id: null,
  os_image_id: null,
  months: 1,
  number_of_instances: 1,
  volume_type_id: null,
  storage_size_gb: "",
  bandwidth_id: null,
  bandwidth_count: 0,
  floating_ip_id: null,
  floating_ip_count: 0,
  object_storage_region: "",
  object_storage_availability_zone: "",
  object_storage_product_id: null,
  object_storage_quantity: 1000,
  object_storage_months: 1,
  cross_connect_id: null,
};

const baseProps = {
  formData: baseFormData,
  errors: {} as Record<string, string | null>,
  updateFormData: vi.fn() as unknown as UpdateInvoiceFormData,
  regions: [{ code: "uni-ng", name: "Nigeria" }] as BillingRegion[],
  isRegionsFetching: false,
  isComputerInstancesFetching: false,
  isOsImagesFetching: false,
  isEbsVolumesFetching: false,
  isBandwidthsFetching: false,
  isFloatingIpsFetching: false,
  isCrossConnectsFetching: false,
  onAddRequest: vi.fn(),
};

/** Render inside a tenant route so useApiContext resolves context === "tenant". */
function renderInTenantContext(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <MemoryRouter initialEntries={["/dashboard/create-invoice"]}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("ResourceItemBuilder — tenant availability zones", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads availability zones for a tenant via the /admin-prefixed route", async () => {
    renderInTenantContext(<ResourceItemBuilder {...baseProps} />);

    // The dropdown populates — proving a tenant can pick an AZ (and therefore
    // go on to add a compute line item).
    expect(
      await screen.findByRole("option", { name: "Lagos Zone A (uni-ng-az1)" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lagos Zone B (uni-ng-az2)" })).toBeInTheDocument();

    const requestedUrls = fetchMock.mock.calls.map((call) => String(call[0]));

    // Hit the route that actually exists for the tenant audience…
    expect(requestedUrls.some((url) => url.endsWith(TENANT_AZ_PATH))).toBe(true);
    // …and never the un-prefixed path that 404s.
    expect(requestedUrls.some((url) => url.endsWith(BARE_AZ_PATH))).toBe(false);
  });
});
