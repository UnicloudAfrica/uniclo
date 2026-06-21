import { describe, it, expect } from "vitest";
import { buildRegionMarkers, tileConfigFor } from "../AfricaMap";
import type { NocRegionSummary } from "@/hooks/adminHooks/nocHooks";

const region = (over: Partial<NocRegionSummary> = {}): NocRegionSummary =>
  ({
    code: "uni-ng",
    name: "Nigeria",
    city: "Lagos",
    latitude: 6.5244,
    longitude: 3.3792,
    status: "green",
    counts: { vms: 17, vpcs: 1, tenants: 0 },
    has_live_credentials: true,
    ...over,
  }) as NocRegionSummary;

describe("buildRegionMarkers", () => {
  it("maps a region to a marker with status colour, coords and a VM-count label", () => {
    const [m] = buildRegionMarkers([region()]);
    expect(m.code).toBe("uni-ng");
    expect(m.lat).toBe(6.5244);
    expect(m.lng).toBe(3.3792);
    expect(m.color).toBe("#22c55e"); // green = healthy
    expect(m.label).toBe("Lagos · Healthy · 17 VMs");
  });

  it("drops regions with no real coordinates (0,0)", () => {
    expect(buildRegionMarkers([region({ latitude: 0, longitude: 0 })])).toHaveLength(0);
    // a single non-zero coordinate still counts as placed
    expect(buildRegionMarkers([region({ latitude: 0, longitude: 3.3 })])).toHaveLength(1);
  });

  it("colours amber/red/unknown distinctly and singularises 1 VM", () => {
    expect(buildRegionMarkers([region({ status: "amber" })])[0].color).toBe("#f59e0b");
    expect(buildRegionMarkers([region({ status: "red" })])[0].color).toBe("#ef4444");
    expect(buildRegionMarkers([region({ status: "unknown" })])[0].color).toBe("#94a3b8");
    expect(buildRegionMarkers([region({ counts: { vms: 1 } } as Partial<NocRegionSummary>)])[0].label).toContain(
      "1 VM"
    );
  });

  it("omits the VM suffix when a region has none", () => {
    const [m] = buildRegionMarkers([region({ counts: { vms: 0 } } as Partial<NocRegionSummary>)]);
    expect(m.label).toBe("Lagos · Healthy");
  });
});

describe("tileConfigFor (map follows theme)", () => {
  it("uses CARTO dark tiles + dark background in dark mode", () => {
    const t = tileConfigFor(true);
    expect(t.url).toContain("dark_all");
    expect(t.background).toBe("#0a1424");
  });

  it("uses CARTO light tiles + light background in light mode", () => {
    const t = tileConfigFor(false);
    expect(t.url).toContain("light_all");
    expect(t.background).toBe("#e8eef4");
  });
});
