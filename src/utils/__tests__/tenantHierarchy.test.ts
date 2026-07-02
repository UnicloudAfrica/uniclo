import { describe, it, expect } from "vitest";
import { buildTenantHierarchyOptions } from "../tenantHierarchy";

describe("buildTenantHierarchyOptions", () => {
  it("nests children under their parent with increasing depth", () => {
    const result = buildTenantHierarchyOptions([
      { id: "1", name: "Acme", parent_id: null },
      { id: "2", name: "Acme Reseller", parent_id: "1" },
      { id: "3", name: "Acme Reseller Sub", parent_id: "2" },
    ]);

    expect(result.map((r) => [String(r.id), r.depth])).toEqual([
      ["1", 0],
      ["2", 1],
      ["3", 2],
    ]);
  });

  it("keeps siblings alphabetical and groups them under the right parent", () => {
    const result = buildTenantHierarchyOptions([
      { id: "1", name: "Root", parent_id: null },
      { id: "3", name: "Zeta", parent_id: "1" },
      { id: "2", name: "Alpha", parent_id: "1" },
    ]);

    expect(result.map((r) => r.label)).toEqual(["Root", "Alpha", "Zeta"]);
    expect(result.map((r) => r.depth)).toEqual([0, 1, 1]);
  });

  it("treats a tenant whose parent is not in the list as a root (orphan)", () => {
    const result = buildTenantHierarchyOptions([
      { id: "2", name: "Orphan", parent_id: "missing" },
    ]);

    expect(result).toEqual([{ id: "2", label: "Orphan", depth: 0 }]);
  });

  it("never infinite-loops or drops tenants on a mutual parent cycle", () => {
    const result = buildTenantHierarchyOptions([
      { id: "1", name: "A", parent_id: "2" },
      { id: "2", name: "B", parent_id: "1" },
    ]);

    expect(result).toHaveLength(2);
    expect(new Set(result.map((r) => String(r.id)))).toEqual(new Set(["1", "2"]));
  });

  it("falls back to company_name then a generic label", () => {
    const result = buildTenantHierarchyOptions([
      { id: "9", company_name: "CompCo", parent_id: null },
      { id: "10", parent_id: null },
    ]);

    expect(result.find((r) => String(r.id) === "9")?.label).toBe("CompCo");
    expect(result.find((r) => String(r.id) === "10")?.label).toBe("Tenant 10");
  });
});
