import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ObjectStorageProfileCard } from "../ObjectStorageProfileCard";
import type { ResolvedProfile } from "@/hooks/useObjectStoragePricing";

vi.mock("@/hooks/adminHooks/regionHooks", () => ({
  useFetchAvailabilityZones: () => ({ data: [], isFetching: false }),
}));

const makeProfile = (overrides: Partial<ResolvedProfile> = {}): ResolvedProfile => ({
  id: "profile_test",
  name: "",
  region: "uni-ng",
  availability_zone: "uni-ng-lag-az1",
  tierKey: "__all__::1",
  unitPriceOverride: "",
  months: 12,
  storageGb: 100,
  regionKey: "uni-ng",
  regionData: null,
  tierOptions: [{ value: "__all__::1", label: "Object Storage (per GiB)" }],
  usingFallbackCatalog: true,
  tierRow: {},
  tierData: {},
  tierQuotaGb: 1,
  fallbackUnitPrice: 40.6,
  unitPrice: 40.6,
  quantity: 1,
  subtotal: 48720,
  currency: "NGN",
  hasTierData: true,
  tierName: "Object Storage (per GiB)",
  ...overrides,
});

const noop = () => undefined;

const renderCard = (profile: ResolvedProfile, onStorageGbChange = noop) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <ObjectStorageProfileCard
        profile={profile}
        index={0}
        regionOptions={[{ value: "uni-ng", label: "Nigeria (uni-ng)" }]}
        canRemove={false}
        onRemove={noop}
        onRegionChange={noop}
        onTierChange={noop}
        onMonthsChange={noop}
        onStorageGbChange={onStorageGbChange}
        onNameChange={noop}
      />
    </MemoryRouter>
    </QueryClientProvider>
  );

describe("ObjectStorageProfileCard", () => {
  it("offers quick-size buttons that set the storage size", () => {
    const onStorageGbChange = vi.fn();
    renderCard(makeProfile(), onStorageGbChange);

    fireEvent.click(screen.getByRole("button", { name: "500 GB" }));
    expect(onStorageGbChange).toHaveBeenCalledWith("500");

    fireEvent.click(screen.getByRole("button", { name: "1 TB" }));
    expect(onStorageGbChange).toHaveBeenCalledWith("1000");
  });

  it("explains when a zone has no published storage rates", () => {
    renderCard(makeProfile({ tierKey: "", tierOptions: [], hasTierData: false }));

    expect(
      screen.getByText(/No storage rates are published for this zone yet/i)
    ).toBeInTheDocument();
  });

  it("shows the live per-profile breakdown once a tier is resolved", () => {
    renderCard(makeProfile());

    expect(screen.getByText("Unit price")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
  });
});
