import { describe, it, expect } from "vitest";
import { buildLayeredEdges } from "../layeredEdges";
import { RESOURCE_EXPLANATIONS } from "../../resourceExplanations";
import type { ResourceTypeId } from "../../resourceExplanations";

const allNodeIds = new Set<string>(Object.values(RESOURCE_EXPLANATIONS).map((r) => r.id));

describe("buildLayeredEdges", () => {
  it("draws structural edges even when every resource count is zero", () => {
    // Regression: an empty / just-created / failed project rendered as a set of
    // disconnected cards because edges were skipped whenever a count was 0.
    const edges = buildLayeredEdges(allNodeIds, () => 0, []);

    expect(edges.length).toBeGreaterThan(0);
    // Structural (an endpoint still empty) → faint, non-animated.
    expect(edges.every((e) => e.animated === false)).toBe(true);
  });

  it("emphasises (animates) an edge whose endpoints both have resources", () => {
    const withRel = Object.values(RESOURCE_EXPLANATIONS).find(
      (r) => r.relatedResources.length > 0 && allNodeIds.has(r.relatedResources[0])
    );
    expect(withRel).toBeTruthy();

    const a = withRel!.id;
    const b = withRel!.relatedResources[0] as ResourceTypeId;
    const live = new Set<string>([a, b]);

    const edges = buildLayeredEdges(allNodeIds, (id) => (live.has(id) ? 2 : 0), []);
    const edge = edges.find((e) => e.id === `e-${[a, b].sort().join("--")}`);

    expect(edge).toBeTruthy();
    expect(edge!.animated).toBe(true);
  });
});
