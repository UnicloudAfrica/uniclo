import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import AdminInstanceConfigurationCard, { formatPriceSuffix } from "../AdminInstanceConfigurationCard";
import { getPricingNotice } from "@/shared/components/instance-wizard/ComputeImageSection";
import type { Configuration, Option } from "@/types/InstanceConfiguration";

const { formPropsSpy, mockUseFetchProductPricing } = vi.hoisted(() => ({
  formPropsSpy: vi.fn(),
  mockUseFetchProductPricing: vi.fn(),
}));

vi.mock("@/shared/components/instance-wizard/InstanceConfigurationForm", () => ({
  default: (props: Record<string, unknown>) => {
    formPropsSpy(props);
    return <div data-testid="instance-form" />;
  },
}));
vi.mock("@/hooks/resource", () => ({
  useFetchProductPricing: mockUseFetchProductPricing,
}));
vi.mock("@/hooks/adminHooks/projectHooks", () => ({
  useFetchProjects: () => ({ data: null }),
}));
vi.mock("@/shared/hooks/resources/securityGroupHooks", () => ({
  useFetchSecurityGroups: () => ({ data: [] }),
}));
vi.mock("@/shared/hooks/keyPairsHooks", () => ({
  useFetchKeyPairs: () => ({ data: [] }),
}));
vi.mock("@/shared/hooks/resources/subnetHooks", () => ({
  useFetchSubnets: () => ({ data: [] }),
}));
vi.mock("@/hooks/adminHooks/networkHooks", () => ({
  useFetchNetworks: () => ({ data: [] }),
}));
vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("@/utils/instanceCreationUtils", () => ({
  buildConfigurationFromTemplate: vi.fn(() => ({})),
}));

const makeCfg = (overrides: Partial<Configuration> = {}): Configuration => ({
  id: "cfg-1",
  launch_mode: "custom",
  name: "",
  instance_count: 1,
  description: "",
  project_id: "",
  region: "lagos",
  months: 1,
  compute_instance_id: "",
  os_image_id: "",
  volume_type_id: "",
  storage_size_gb: 50,
  bandwidth_id: "",
  bandwidth_count: 0,
  floating_ip_count: 0,
  security_group_ids: [],
  keypair_name: "",
  keypair_label: "",
  additional_volumes: [],
  network_id: "",
  subnet_id: "",
  subnet_label: "",
  tags: "",
  ...overrides,
});

// Structurally matches the card's (unexported) RegionResource shape.
type TestRegion = {
  code: string;
  az_selection_mode?: "auto" | "user_selectable" | "disabled";
  availability_zones: { code: string; name: string; status: string; provider: string }[];
};

const singleProviderRegion: TestRegion = {
  code: "lagos",
  availability_zones: [{ code: "az1", name: "Zone 1", status: "active", provider: "provider_a" }],
};

const multiProviderRegion: TestRegion = {
  code: "lagos",
  az_selection_mode: "user_selectable",
  availability_zones: [
    { code: "az1", name: "Zone 1", status: "active", provider: "provider_a" },
    { code: "az2", name: "Zone 2", status: "active", provider: "provider_b" },
  ],
};

const renderCard = (
  cfg: Configuration = makeCfg(),
  regions: TestRegion[] = [singleProviderRegion],
  updateConfiguration: (id: string, patch: Partial<Configuration>) => void = vi.fn()
) =>
  render(
    <AdminInstanceConfigurationCard
      cfg={cfg}
      index={0}
      totalConfigurations={1}
      billingCountry="NG"
      regionOptions={[]}
      baseProjectOptions={[]}
      isLoadingResources={false}
      updateConfiguration={updateConfiguration}
      removeConfiguration={vi.fn()}
      addAdditionalVolume={vi.fn()}
      updateAdditionalVolume={vi.fn()}
      removeAdditionalVolume={vi.fn()}
      regions={regions}
    />
  );

const lastFormProps = () => formPropsSpy.mock.calls.at(-1)?.[0] as Record<string, Option[]>;

describe("AdminInstanceConfigurationCard pricing notices", () => {
  beforeEach(() => {
    formPropsSpy.mockClear();
    mockUseFetchProductPricing.mockReset();
  });

  it("passes loading notices to every product dropdown while pricing is fetching", () => {
    mockUseFetchProductPricing.mockReturnValue({ data: undefined, isFetching: true });

    renderCard();

    const props = lastFormProps();
    expect(getPricingNotice(props.computeOptions)).toEqual({
      kind: "loading",
      label: "Loading sizes…",
    });
    expect(getPricingNotice(props.osImageOptions)?.label).toBe("Loading OS images…");
    expect(getPricingNotice(props.volumeTypeOptions)?.label).toBe("Loading volume types…");
    expect(getPricingNotice(props.bandwidthOptions)?.label).toBe("Loading bandwidth options…");
  });

  it("passes settled-empty notices when a zone has no priced products", () => {
    mockUseFetchProductPricing.mockReturnValue({ data: [], isFetching: false });

    renderCard();

    const props = lastFormProps();
    expect(getPricingNotice(props.computeOptions)).toEqual({
      kind: "empty",
      label: "No instance types are published for this zone yet — try another availability zone.",
    });
    expect(getPricingNotice(props.osImageOptions)?.kind).toBe("empty");
    expect(getPricingNotice(props.volumeTypeOptions)?.kind).toBe("empty");
    expect(getPricingNotice(props.bandwidthOptions)?.kind).toBe("empty");
  });

  it("treats rows without effective pricing as a settled-empty zone", () => {
    mockUseFetchProductPricing.mockReturnValue({
      data: [{ product: { productable_id: 9, name: "unpriced" }, pricing: { effective: {} } }],
      isFetching: false,
    });

    renderCard();

    expect(getPricingNotice(lastFormProps().computeOptions)?.kind).toBe("empty");
  });

  it("asks for an AZ pick (and keeps fetches disabled) in a multi-provider region without an AZ", () => {
    mockUseFetchProductPricing.mockReturnValue({ data: undefined, isFetching: false });

    renderCard(makeCfg({ availability_zone: "" }), [multiProviderRegion]);

    const props = lastFormProps();
    const expected = {
      kind: "awaiting_az",
      label: "Pick an availability zone to see available sizes and prices.",
    };
    expect(getPricingNotice(props.computeOptions)).toEqual(expected);
    expect(getPricingNotice(props.osImageOptions)).toEqual(expected);
    expect(getPricingNotice(props.volumeTypeOptions)).toEqual(expected);
    expect(getPricingNotice(props.bandwidthOptions)).toEqual(expected);

    // Pricing must stay gated until the user makes the AZ (= price) decision.
    for (const call of mockUseFetchProductPricing.mock.calls) {
      expect((call[2] as Record<string, unknown>).enabled).toBe(false);
    }
  });

  it("does not ask for an AZ once one is selected in a multi-provider region", () => {
    mockUseFetchProductPricing.mockReturnValue({ data: [], isFetching: false });

    renderCard(makeCfg({ availability_zone: "az2" }), [multiProviderRegion]);

    expect(getPricingNotice(lastFormProps().computeOptions)?.kind).toBe("empty");
    for (const call of mockUseFetchProductPricing.mock.calls) {
      expect((call[2] as Record<string, unknown>).enabled).toBe(true);
    }
  });

  it("passes real priced options with no notice when pricing resolves", () => {
    mockUseFetchProductPricing.mockImplementation((_region: string, type: string) =>
      type === "compute_instance"
        ? {
            data: [
              {
                product: { productable_id: 7, name: "m1.small", vcpus: 2, memory_mb: 4096 },
                pricing: { effective: { price_local: 100, currency: "NGN" } },
              },
            ],
            isFetching: false,
          }
        : { data: [], isFetching: false }
    );

    renderCard();

    const props = lastFormProps();
    expect(getPricingNotice(props.computeOptions)).toBeNull();
    expect(props.computeOptions).toHaveLength(1);
    expect(props.computeOptions[0].value).toBe("7");
    expect(props.computeOptions[0].label).toContain("m1.small");
  });

  it("passes no options (and no notice) before a region is selected", () => {
    mockUseFetchProductPricing.mockReturnValue({ data: undefined, isFetching: false });

    renderCard(makeCfg({ region: "" }), []);

    expect(lastFormProps().computeOptions).toEqual([]);
  });
});

describe("AdminInstanceConfigurationCard AZ-for-pricing flag", () => {
  beforeEach(() => {
    formPropsSpy.mockClear();
    mockUseFetchProductPricing.mockReset();
    mockUseFetchProductPricing.mockReturnValue({ data: [], isFetching: false });
  });

  it("tells the form an AZ pick is required in a multi-provider region", () => {
    renderCard(makeCfg(), [multiProviderRegion]);
    expect((lastFormProps() as Record<string, unknown>).requiresAzForPricing).toBe(true);
  });

  it("does not require an AZ in a single-provider region", () => {
    renderCard(makeCfg(), [singleProviderRegion]);
    expect((lastFormProps() as Record<string, unknown>).requiresAzForPricing).toBe(false);
  });
});

describe("AdminInstanceConfigurationCard lone-option auto-select", () => {
  beforeEach(() => {
    formPropsSpy.mockClear();
    mockUseFetchProductPricing.mockReset();
  });

  const loneRow = (type: string) => ({
    data: [
      {
        product: {
          productable_id: `${type}-1`,
          name: `${type} only`,
          ...(type === "compute_instance" ? { family_code: "gp" } : {}),
        },
        pricing: { effective: { price_local: 100, currency: "NGN" } },
      },
    ],
    isFetching: false,
  });

  it("pre-selects products whose catalog offers exactly one choice", () => {
    mockUseFetchProductPricing.mockImplementation((_region: string, type: string) =>
      ["compute_instance", "os_image", "volume_type"].includes(type)
        ? loneRow(type)
        : { data: [], isFetching: false }
    );
    const updateConfiguration = vi.fn();

    renderCard(makeCfg(), [singleProviderRegion], updateConfiguration);

    expect(updateConfiguration).toHaveBeenCalledWith(
      "cfg-1",
      expect.objectContaining({
        compute_instance_id: "compute_instance-1",
        os_image_id: "os_image-1",
        volume_type_id: "volume_type-1",
        family_code: "gp",
      })
    );
  });

  it("does not auto-select when several choices exist or while pricing is fetching", () => {
    const twoRows = {
      data: [
        {
          product: { productable_id: "a", name: "A" },
          pricing: { effective: { price_local: 100, currency: "NGN" } },
        },
        {
          product: { productable_id: "b", name: "B" },
          pricing: { effective: { price_local: 200, currency: "NGN" } },
        },
      ],
      isFetching: false,
    };
    mockUseFetchProductPricing.mockImplementation((_region: string, type: string) =>
      type === "compute_instance" ? twoRows : { data: loneRow(type).data, isFetching: true }
    );
    const updateConfiguration = vi.fn();

    renderCard(makeCfg(), [singleProviderRegion], updateConfiguration);

    expect(updateConfiguration).not.toHaveBeenCalled();
  });
});

describe("formatPriceSuffix currency pairing", () => {
  it("uses the effective row's own currency", () => {
    expect(
      formatPriceSuffix({ pricing: { effective: { price_local: 12500, currency: "NGN" } } })
    ).toBe("NGN 12,500.00");
  });

  it("reads item-level currency fields instead of asserting USD", () => {
    // Per the platform money convention, price_usd columns are a misnomer
    // carrying the row's own currency_code.
    expect(formatPriceSuffix({ price_usd: 950, currency_code: "ngn" })).toBe("NGN 950.00");
    expect(formatPriceSuffix({ price_local: 200, local_currency: "KES" })).toBe("KES 200.00");
    expect(formatPriceSuffix({ amount: 5, currency: "USD" })).toBe("USD 5.00");
  });

  it("shows a bare amount rather than a wrong currency code when none resolves", () => {
    expect(formatPriceSuffix({ price_usd: 75 })).toBe("75.00");
    expect(formatPriceSuffix({ price_usd: 75 })).not.toContain("USD");
  });

  it("returns an empty suffix when no price resolves", () => {
    expect(formatPriceSuffix({})).toBe("");
    expect(formatPriceSuffix(null)).toBe("");
  });
});
