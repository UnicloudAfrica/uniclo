/**
 * LayeredDiagramView.tsx
 *
 * Enhanced React Flow diagram showing all 12 cloud resource types arranged in
 * four horizontal bands: connectivity, network, security, and compute.
 * Resources with non-zero counts are connected to their related resources via
 * animated dashed edges.
 */
import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ResourceNode from "../components/ResourceNode";
import type { ResourceNodeData } from "../components/ResourceNode";
import {
  RESOURCE_EXPLANATIONS,
  LAYER_ORDER,
  getResourcesByLayerForProvider,
} from "../resourceExplanations";
import type { ResourceTypeId, InfraLayer } from "../resourceExplanations";
import type { ViewProps } from "../InfrastructureVisualization.types";

// ---------------------------------------------------------------------------
// Register custom node types OUTSIDE the component to avoid React Flow warnings
// ---------------------------------------------------------------------------

const nodeTypes = { resource: ResourceNode };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAYER_Y: Record<InfraLayer, number> = {
  connectivity: 50,
  network: 180,
  security: 310,
  compute: 440,
};

const NODE_X_START = 100;
const NODE_X_SPACING = 180;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResourceCount(data: ViewProps["data"], typeId: ResourceTypeId): number {
  if (typeId === "instances") return data.instanceStats.total;
  return (data.resourceCounts[typeId] as number) ?? 0;
}

/**
 * Derive the configuration status for a resource from the networkStatus
 * prop when available.
 */
function getStatus(
  data: ViewProps["data"],
  typeId: ResourceTypeId
): "configured" | "not_configured" | undefined {
  const ns = data.networkStatus;
  if (!ns) return undefined;

  switch (typeId) {
    case "vpcs":
      return ns.vpc?.configured ? "configured" : "not_configured";
    case "internet_gateways":
      return ns.internet_gateway?.configured ? "configured" : "not_configured";
    case "subnets":
      return ns.subnets?.configured ? "configured" : "not_configured";
    case "security_groups":
      return ns.security_groups?.configured ? "configured" : "not_configured";
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LayeredDiagramView({
  data,
  selectedResource,
  onSelectResource,
  highlightedTypes,
}: ViewProps) {
  // ---- Build nodes & edges from the data ----------------------------------

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<ResourceNodeData>[] = [];
    const edges: Edge[] = [];
    const edgeSet = new Set<string>(); // dedupe edges

    // -- Nodes ---------------------------------------------------------------

    for (const layer of LAYER_ORDER) {
      const resources = getResourcesByLayerForProvider(layer.id, data.provider);
      const rowWidth = resources.length * NODE_X_SPACING;
      const xOffset = NODE_X_START + (4 * NODE_X_SPACING - rowWidth) / 2;

      // Section label node (plain text, not interactive)
      nodes.push({
        id: `label-${layer.id}`,
        type: "default",
        position: { x: 0, y: LAYER_Y[layer.id] + 8 },
        data: { label: layer.label } as unknown as ResourceNodeData,
        selectable: false,
        draggable: false,
        style: {
          background: "transparent",
          border: "none",
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          width: 80,
          textAlign: "right" as const,
          pointerEvents: "none" as const,
          boxShadow: "none",
        },
      } as unknown as Node<ResourceNodeData>);

      resources.forEach((res, idx) => {
        const count = getResourceCount(data, res.id);
        const isHighlighted = highlightedTypes.includes(res.id);
        const isSelected = selectedResource?.typeId === res.id;
        const status = getStatus(data, res.id);

        nodes.push({
          id: res.id,
          type: "resource",
          position: { x: xOffset + idx * NODE_X_SPACING, y: LAYER_Y[layer.id] },
          data: {
            icon: res.icon,
            label: res.label,
            count,
            color: res.color,
            bgColor: res.bgColor,
            isHighlighted,
            isSelected,
            status,
          },
        } as Node<ResourceNodeData>);
      });
    }

    // -- Edges ---------------------------------------------------------------

    // Collect the set of node IDs that were actually rendered
    const nodeIds = new Set(nodes.map((n) => n.id));

    for (const res of Object.values(RESOURCE_EXPLANATIONS)) {
      // Skip resources whose nodes weren't rendered (provider-filtered)
      if (!nodeIds.has(res.id)) continue;

      const sourceCount = getResourceCount(data, res.id);
      if (sourceCount === 0) continue;

      for (const targetId of res.relatedResources) {
        // Skip targets whose nodes weren't rendered (provider-filtered)
        if (!nodeIds.has(targetId)) continue;

        const targetCount = getResourceCount(data, targetId);
        if (targetCount === 0) continue;

        // Build a canonical key so we don't create duplicate edges A->B and B->A
        const edgeKey = [res.id, targetId].sort().join("--");
        if (edgeSet.has(edgeKey)) continue;
        edgeSet.add(edgeKey);

        const bothHighlighted =
          highlightedTypes.includes(res.id) && highlightedTypes.includes(targetId);

        edges.push({
          id: `e-${edgeKey}`,
          source: res.id,
          target: targetId,
          animated: true,
          style: {
            stroke: bothHighlighted ? "#60a5fa" : "#d1d5db",
            strokeDasharray: "5 3",
            strokeWidth: bothHighlighted ? 2 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: bothHighlighted ? "#60a5fa" : "#d1d5db",
          },
        });
      }
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [data, selectedResource, highlightedTypes]);

  // React Flow controlled state
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edgesState, , onEdgesChange] = useEdgesState(initialEdges);

  // ---- Event handlers -----------------------------------------------------

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Ignore label nodes
      if (node.id.startsWith("label-")) return;
      onSelectResource({ typeId: node.id as ResourceTypeId });
    },
    [onSelectResource]
  );

  // ---- Render --------------------------------------------------------------

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        maxZoom={1.5}
        minZoom={0.3}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
