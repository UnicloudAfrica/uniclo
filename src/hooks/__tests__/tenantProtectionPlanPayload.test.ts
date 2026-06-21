import { describe, it, expect } from "vitest";
import { buildProtectionPlanPayload } from "../useTenantProvisioningLogic";

/*
 * Tenant order payload: the protection plan the user selected (and saw
 * priced) must travel on the order, or the fee is displayed but never
 * billed. Mirrors the admin builder's block shape so the backend's
 * operator-only validation + paid-plan price check apply uniformly.
 */
describe("buildProtectionPlanPayload", () => {
  it("returns null for no plan or plan 'none' (payload omits the key)", () => {
    expect(buildProtectionPlanPayload(undefined)).toBeNull();
    expect(buildProtectionPlanPayload({ plan: "none", monthlyCost: 0 })).toBeNull();
    expect(buildProtectionPlanPayload({ plan: "", monthlyCost: 100 })).toBeNull();
  });

  it("forwards a paid plan with its displayed monthly cost", () => {
    expect(buildProtectionPlanPayload({ plan: "backup_only", monthlyCost: 240.5 })).toEqual({
      plan: "backup_only",
      monthly_cost: 240.5,
    });
  });

  it("includes redundancy_pattern only for DR plans", () => {
    expect(
      buildProtectionPlanPayload({
        plan: "dr_standby",
        monthlyCost: 12000,
        redundancyPattern: "n_plus_1",
      })
    ).toEqual({
      plan: "dr_standby",
      monthly_cost: 12000,
      redundancy_pattern: "n_plus_1",
    });

    expect(
      buildProtectionPlanPayload({
        plan: "backup_only",
        monthlyCost: 240,
        redundancyPattern: "n_plus_1",
      })
    ).toEqual({
      plan: "backup_only",
      monthly_cost: 240,
    });
  });

  it("sends 0 for an unpriced paid plan so the backend can reject it explicitly", () => {
    expect(buildProtectionPlanPayload({ plan: "backup_only", monthlyCost: 0 })).toEqual({
      plan: "backup_only",
      monthly_cost: 0,
    });
  });
});
