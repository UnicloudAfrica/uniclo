import { describe, it, expect } from "vitest";
import {
  resolveAutoSelectTierKey,
  GLOBAL_TIER_KEY,
  type Option,
} from "../../objectStorageUtils";

type CatalogEntry = { options: Option[]; map: Map<string, unknown> };

const catalog = (entries: Record<string, Option[]>): Map<string, CatalogEntry> =>
  new Map(
    Object.entries(entries).map(([key, options]) => [key, { options, map: new Map() }])
  );

describe("resolveAutoSelectTierKey", () => {
  it("returns the only tier key when the catalog has exactly one option", () => {
    const tierCatalog = catalog({
      [GLOBAL_TIER_KEY]: [{ value: "__all__::1", label: "Object Storage (per GiB)" }],
    });

    expect(resolveAutoSelectTierKey({ region: "uni-ng", tierKey: "" }, tierCatalog)).toBe(
      "__all__::1"
    );
  });

  it("prefers the region bucket over the global fallback", () => {
    const tierCatalog = catalog({
      "uni-ng": [{ value: "uni-ng::7", label: "Regional tier" }],
      [GLOBAL_TIER_KEY]: [
        { value: "__all__::7", label: "Regional tier" },
        { value: "__all__::8", label: "Other region tier" },
      ],
    });

    expect(resolveAutoSelectTierKey({ region: "UNI-NG", tierKey: "" }, tierCatalog)).toBe(
      "uni-ng::7"
    );
  });

  it("returns null when a tier is already selected", () => {
    const tierCatalog = catalog({
      [GLOBAL_TIER_KEY]: [{ value: "__all__::1", label: "Tier" }],
    });

    expect(
      resolveAutoSelectTierKey({ region: "uni-ng", tierKey: "__all__::1" }, tierCatalog)
    ).toBeNull();
  });

  it("returns null when there is no region, no catalog entry, or multiple options", () => {
    const multi = catalog({
      [GLOBAL_TIER_KEY]: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    });

    expect(resolveAutoSelectTierKey({ region: "", tierKey: "" }, multi)).toBeNull();
    expect(resolveAutoSelectTierKey({ region: "uni-ng", tierKey: "" }, new Map())).toBeNull();
    expect(resolveAutoSelectTierKey({ region: "uni-ng", tierKey: "" }, multi)).toBeNull();
  });
});
