import { describe, it, expect } from "vitest";
import {
  PREVIEW_PRICING_LIMITS,
  buildPreviewPricingPayload,
  composeExpectedTotal,
  extractPreviewPricingEstimate,
} from "../instancePreviewPricing";
import type { Configuration } from "../../types/InstanceConfiguration";

/*
 * The preview payload feeds POST /instances/preview-pricing (consumed by
 * MultiInstanceController::previewPricing) — the estimate customers see
 * while configuring AND the figure price-locked via expected_total. The
 * builder must (a) mirror the create payload's pricing-relevant fields,
 * including availability_zone for per-AZ pricing, and (b) refuse to build
 * anything the endpoint's stricter validation would 422 on.
 */

const completeConfig = (overrides: Partial<Configuration> = {}): Configuration =>
  ({
    id: "cfg-1",
    name: "vm-1",
    region: "uni-ng",
    availability_zone: "uni-ng-az-1",
    project_mode: "new",
    project_name: "Demo",
    network_preset: "standard",
    compute_instance_id: "42",
    os_image_id: "7",
    volume_type_id: "3",
    storage_size_gb: 100,
    months: 6,
    instance_count: 2,
    floating_ip_count: 1,
    bandwidth_id: "9",
    keypair_name: "ops-key",
    additional_volumes: [{ id: "v1", volume_type_id: "4", storage_size_gb: 200 }],
    ...overrides,
  }) as unknown as Configuration;

describe("buildPreviewPricingPayload", () => {
  it("mirrors the create payload's pricing-relevant fields, including the AZ", () => {
    const payload = buildPreviewPricingPayload([completeConfig()], "ng", "tenant-9");

    expect(payload).toEqual({
      country_iso: "NG",
      tenant_id: "tenant-9",
      pricing_requests: [
        {
          region: "uni-ng",
          availability_zone: "uni-ng-az-1",
          compute_instance_id: "42",
          os_image_id: "7",
          months: 6,
          number_of_instances: 2,
          volume_types: [
            { volume_type_id: "3", storage_size_gb: 100 },
            { volume_type_id: "4", storage_size_gb: 200 },
          ],
          bandwidth_id: "9",
          bandwidth_count: 1,
          floating_ip_count: 1,
        },
      ],
    });
  });

  it("omits bandwidth_count without a bandwidth selection and tenant_id when absent", () => {
    const payload = buildPreviewPricingPayload(
      [completeConfig({ bandwidth_id: "", additional_volumes: [] })],
      "NG"
    );

    const request = (payload?.pricing_requests as Record<string, unknown>[])[0]!;
    expect(request.bandwidth_id).toBeNull();
    expect(request).not.toHaveProperty("bandwidth_count");
    expect(payload).not.toHaveProperty("tenant_id");
  });

  it("returns null for empty or incomplete configurations", () => {
    expect(buildPreviewPricingPayload([], "NG")).toBeNull();
    expect(
      buildPreviewPricingPayload([completeConfig({ compute_instance_id: "" })], "NG")
    ).toBeNull();
  });

  it.each([
    ["instance count above the preview cap", { instance_count: 11 }],
    ["volume above the preview storage cap", { storage_size_gb: 2001 }],
    ["months above the preview cap", { months: 37 }],
    ["floating IPs above the preview cap", { floating_ip_count: 6 }],
    [
      "extra volume below the preview minimum",
      { additional_volumes: [{ id: "v1", volume_type_id: "4", storage_size_gb: 5 }] },
    ],
  ])("returns null instead of a payload the endpoint would 422 on (%s)", (_label, overrides) => {
    expect(
      buildPreviewPricingPayload([completeConfig(overrides as Partial<Configuration>)], "NG")
    ).toBeNull();
  });

  it("returns null above the configuration-count cap", () => {
    const configs = Array.from({ length: PREVIEW_PRICING_LIMITS.maxConfigurations + 1 }, (_, i) =>
      completeConfig({ id: `cfg-${i}` } as Partial<Configuration>)
    );
    expect(buildPreviewPricingPayload(configs, "NG")).toBeNull();
  });
});

describe("extractPreviewPricingEstimate", () => {
  it("reads grand_total and currency from the response envelope", () => {
    expect(
      extractPreviewPricingEstimate({ data: { grand_total: 15750, currency: "NGN" } })
    ).toEqual({ total: 15750, currency: "NGN" });
    // Some clients unwrap the envelope already.
    expect(extractPreviewPricingEstimate({ grand_total: 12.5, currency: "USD" })).toEqual({
      total: 12.5,
      currency: "USD",
    });
  });

  it("returns null for malformed or non-positive totals", () => {
    expect(extractPreviewPricingEstimate(null)).toBeNull();
    expect(extractPreviewPricingEstimate({ data: {} })).toBeNull();
    expect(extractPreviewPricingEstimate({ data: { grand_total: 0 } })).toBeNull();
    expect(extractPreviewPricingEstimate({ data: { grand_total: "abc" } })).toBeNull();
  });
});

describe("composeExpectedTotal", () => {
  it("adds the protection-plan fee the backend folds into the guarded total", () => {
    expect(composeExpectedTotal(1075.5)).toBe(1075.5);
    expect(composeExpectedTotal(1075.5, 240000)).toBe(241075.5);
    // Floating-point sums are normalized to 2dp, matching the backend's
    // abs(diff) <= 0.01 tolerance.
    expect(composeExpectedTotal(0.1, 0.2)).toBe(0.3);
  });

  it("bills the protection fee for the full term (fee × months)", () => {
    // Order is prepaid upfront for its term, so protection is fee × months —
    // compute estimate is already term-inclusive from the preview endpoint.
    expect(composeExpectedTotal(679035, 240000, 12)).toBe(3559035);
    // months defaults to 1 (compute-only / single-month callers unchanged).
    expect(composeExpectedTotal(1000, 240)).toBe(1240);
    // A 0/invalid month count is clamped to 1, never dropping the fee.
    expect(composeExpectedTotal(1000, 240, 0)).toBe(1240);
  });
});
