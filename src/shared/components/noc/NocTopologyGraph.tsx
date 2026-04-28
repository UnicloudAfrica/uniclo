import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Server, Network, Globe, Router } from "lucide-react";

interface BackendNode {
  id: string;
  type: "vpc" | "subnet" | "vm" | "nat" | string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}
interface BackendEdge {
  id: string;
  source: string;
  target: string;
}

interface Props {
  nodes: BackendNode[];
  edges: BackendEdge[];
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 90;
const COLUMN_GAP = 100;
const ROW_GAP = 24;

/**
 * Tier-based auto-layout — no dagre/elk dependency.
 * VPC → subnets → VMs columns, NAT above the VPC.
 */
const layoutNodes = (backendNodes: BackendNode[]): Record<string, { x: number; y: number }> => {
  const byType: Record<string, BackendNode[]> = {
    vpc: [],
    subnet: [],
    vm: [],
    nat: [],
    other: [],
  };

  for (const n of backendNodes) {
    const bucket = byType[n.type] ? n.type : "other";
    byType[bucket].push(n);
  }

  const positions: Record<string, { x: number; y: number }> = {};

  const place = (items: BackendNode[], x: number, rowHeight = NODE_HEIGHT) => {
    const totalHeight = items.length * (rowHeight + ROW_GAP) - ROW_GAP;
    const startY = -totalHeight / 2;
    items.forEach((item, idx) => {
      positions[item.id] = {
        x,
        y: startY + idx * (rowHeight + ROW_GAP),
      };
    });
  };

  const col0 = 0;
  const col1 = col0 + NODE_WIDTH + COLUMN_GAP;
  const col2 = col1 + NODE_WIDTH + COLUMN_GAP;

  place(byType.vpc, col0);
  place(byType.subnet, col1);
  place(byType.vm, col2);

  byType.nat.forEach((n, i) => {
    positions[n.id] = {
      x: col0,
      y: -240 - i * (NODE_HEIGHT + ROW_GAP),
    };
  });

  byType.other.forEach((n) => {
    if (!positions[n.id]) positions[n.id] = n.position;
  });

  return positions;
};

const iconFor = (type: string) => {
  switch (type) {
    case "vpc":
      return <Globe className="h-4 w-4" />;
    case "subnet":
      return <Network className="h-4 w-4" />;
    case "nat":
      return <Router className="h-4 w-4" />;
    case "vm":
    default:
      return <Server className="h-4 w-4" />;
  }
};

/**
 * Node visuals are CSS-variable driven so tenant theme overrides
 * propagate into the topology graph automatically.
 */
const styleFor = (type: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: 12,
    padding: 10,
    width: NODE_WIDTH,
    fontFamily: "Outfit, system-ui, sans-serif",
  };
  switch (type) {
    case "vpc":
      return {
        ...base,
        background: "rgb(var(--theme-color-50))",
        border: "2px solid rgb(var(--theme-color-500))",
      };
    case "subnet":
      return {
        ...base,
        background: "rgb(var(--secondary-color-500) / 0.10)",
        border: "2px solid rgb(var(--secondary-color-500))",
      };
    case "nat":
      return {
        ...base,
        background: "rgb(var(--theme-warning-500) / 0.12)",
        border: "2px solid rgb(var(--theme-warning-500))",
      };
    case "vm":
    default:
      return {
        ...base,
        background: "var(--theme-card-bg)",
        border: "2px solid rgb(var(--theme-neutral-300))",
      };
  }
};

const renderLabel = (bn: BackendNode): React.ReactNode => {
  const d = bn.data as Record<string, unknown>;
  const title = (d.label as string) || bn.id;
  return (
    <div className="space-y-0.5 text-xs font-outfit">
      <div className="flex items-center gap-1.5 font-semibold text-gray-800">
        {iconFor(bn.type)}
        <span className="truncate">{title}</span>
      </div>
      {d.cidr && (
        <div className="font-mono text-[10px] text-gray-500">{String(d.cidr)}</div>
      )}
      {d.cidr_block && (
        <div className="font-mono text-[10px] text-gray-500">{String(d.cidr_block)}</div>
      )}
      {d.instance_type && (
        <div className="text-[10px] text-gray-500">
          {String(d.instance_type)} • {String(d.vcpus)} vCPU · {Math.round(Number(d.ram_mb ?? 0) / 1024)} GB
        </div>
      )}
      {d.address && (
        <div className="font-mono text-[10px] text-gray-500">{String(d.address)}</div>
      )}
      {d.status && (
        <div
          className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
            d.status === "active"
              ? "bg-success-500/15 text-success-700"
              : d.status === "error"
                ? "bg-danger-500/15 text-danger-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {String(d.status)}
        </div>
      )}
    </div>
  );
};

const NocTopologyGraph: React.FC<Props> = ({ nodes, edges }) => {
  const flowNodes: Node[] = useMemo(() => {
    const positions = layoutNodes(nodes);
    return nodes.map((n) => ({
      id: n.id,
      data: { label: renderLabel(n) },
      position: positions[n.id] ?? n.position,
      style: styleFor(n.type),
    }));
  }, [nodes]);

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: false,
        type: "smoothstep",
        style: { stroke: "rgb(var(--theme-neutral-400))", strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "rgb(var(--theme-neutral-400))",
        },
      })),
    [edges]
  );

  if (!nodes.length) {
    return (
      <div className="db-surface-soft flex h-[500px] items-center justify-center rounded-xl text-sm text-gray-500 font-outfit">
        No topology data available for this VPC.
      </div>
    );
  }

  return (
    <div className="db-surface-card h-[600px] rounded-xl overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        minZoom={0.15}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          color="rgb(var(--theme-neutral-200))"
        />
        <Controls position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          style={{
            background: "var(--theme-surface-alt)",
            border: "1px solid var(--theme-border-color)",
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default NocTopologyGraph;
