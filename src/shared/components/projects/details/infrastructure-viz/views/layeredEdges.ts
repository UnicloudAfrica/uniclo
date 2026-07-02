import { MarkerType } from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import { RESOURCE_EXPLANATIONS } from "../resourceExplanations";
import type { ResourceTypeId } from "../resourceExplanations";

/**
 * Build the topology edges for the layered diagram.
 *
 * The structural relationships between resource types are ALWAYS drawn, so the
 * graph reads as a connected topology even before anything is provisioned. The
 * old behaviour skipped any edge whose source or target had a zero count, which
 * meant every empty (and every just-created, and every failed) project rendered
 * as a set of disconnected cards.
 *
 * Edges whose BOTH endpoints have live resources are emphasised — solid grey,
 * animated; purely-structural edges (an endpoint still empty) render faint and
 * static so the live shape stays readable.
 */
export function buildLayeredEdges(
  nodeIds: Set<string>,
  getCount: (typeId: ResourceTypeId) => number,
  highlightedTypes: ResourceTypeId[]
): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const res of Object.values(RESOURCE_EXPLANATIONS)) {
    // Skip resources whose nodes weren't rendered (provider-filtered).
    if (!nodeIds.has(res.id)) continue;
    const sourceCount = getCount(res.id);

    for (const targetId of res.relatedResources as ResourceTypeId[]) {
      if (!nodeIds.has(targetId)) continue;

      // Canonical key so A->B and B->A don't both render.
      const edgeKey = [res.id, targetId].sort().join("--");
      if (seen.has(edgeKey)) continue;
      seen.add(edgeKey);

      const active = sourceCount > 0 && getCount(targetId) > 0;
      const bothHighlighted =
        highlightedTypes.includes(res.id) && highlightedTypes.includes(targetId);

      const stroke = bothHighlighted ? "#60a5fa" : active ? "#9ca3af" : "#e5e7eb";

      edges.push({
        id: `e-${edgeKey}`,
        source: res.id,
        target: targetId,
        animated: active,
        style: {
          stroke,
          strokeDasharray: "5 3",
          strokeWidth: bothHighlighted ? 2 : 1,
          opacity: active ? 1 : 0.55,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: stroke,
        },
      });
    }
  }

  return edges;
}
