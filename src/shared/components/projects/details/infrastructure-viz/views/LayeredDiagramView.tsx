/**
 * LayeredDiagramView.tsx
 *
 * Enhanced React Flow diagram showing all 12 cloud resource types arranged in
 * four horizontal bands: connectivity, network, security, and compute.
 * The structural relationships between resource types are always drawn so the
 * graph reads as a connected topology even before anything is provisioned;
 * live connections (both endpoints populated) are emphasised. See
 * buildLayeredEdges.
 */
import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ResourceNode from "../components/ResourceNode";
import { buildLayeredEdges } from "./layeredEdges";
import type { ResourceNodeData } from "../components/ResourceNode";
import { LAYER_ORDER, getResourcesByLayerForProvider } from "../resourceExplanations";
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

    // -- Nodes ---------------------------------------------------------------

    for (const layer of LAYER_ORDER) {
      const resources = getResourcesByLayerForProvider(layer.id, data.providerFeatures);
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
    // Structural relationships are always drawn (see buildLayeredEdges) so a
    // new / empty / failed project still reads as a connected topology, with
    // live connections emphasised.
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = buildLayeredEdges(
      nodeIds,
      (typeId) => getResourceCount(data, typeId),
      highlightedTypes
    );

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
