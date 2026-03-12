import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Globe, Box } from "lucide-react";

/**
 * ProjectTopologyGraph
 *
 * Visualizes the project infrastructure (VPC, Subnets, Gateway, Instances).
 * Uses React Flow for an interactive, zoomable experience.
 */
interface ProjectTopologyGraphProps {
  vpc?: { name?: string };
  subnets?: Array<{ id?: string | number; name?: string; cidr?: string }>;
  igw?: { id?: string | number; name?: string } | boolean;
  instances?: Array<{ id?: string | number; name?: string; status?: string }>;
  activeStepId?: string;
}

const ProjectTopologyGraph: React.FC<ProjectTopologyGraphProps> = ({
  vpc,
  subnets = [],
  igw,
  activeStepId,
}) => {
  // 1. Transform Backend Data to Nodes/Edges
  const { nodes, edges } = useMemo(() => {
    const nodes: import("@xyflow/react").Node[] = [];
    const edges: import("@xyflow/react").Edge[] = [];

    // Core VPC Node (The Container)
    nodes.push({
      id: "vpc",
      data: { label: vpc?.name || "VPC Core" },
      position: { x: 250, y: 50 },
      style: {
        width: 600,
        height: 500,
        backgroundColor: "rgb(var(--theme-color-rgb) / 0.05)",
        border: "2px dashed var(--theme-color)",
        borderRadius: "16px",
        zIndex: -1,
      },
      type: "group",
    });

    // Internet Gateway (Entry Point)
    nodes.push({
      id: "igw",
      data: {
        label: (
          <div className="flex flex-col items-center">
            <Globe className={`w-5 h-5 ${igw ? "text-green-500" : "text-gray-400"}`} />
            <span className="text-[10px] font-bold mt-1">Gateway</span>
          </div>
        ),
      },
      position: { x: 500, y: -80 },
      style: {
        padding: "10px",
        borderRadius: "50px",
        background: "var(--theme-card-bg)",
        border: "2px solid var(--theme-color)",
        width: 80,
      },
    });

    // Subnets
    subnets.forEach((s, idx) => {
      const xPos = 50 + idx * 200;
      nodes.push({
        id: `subnet-${s.id || idx}`,
        parentId: "vpc",
        extent: "parent",
        data: {
          label: (
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Box className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {s.name || "Subnet"}
                </span>
              </div>
              <div className="text-[8px] text-gray-500 font-mono mt-1">{s.cidr || "0.0.0.0/0"}</div>
            </div>
          ),
        },
        position: { x: xPos, y: 150 },
        style: {
          width: 160,
          height: 300,
          backgroundColor: "var(--theme-card-bg)",
          border: "1px solid rgb(var(--theme-neutral-200))",
          borderRadius: "8px",
          boxShadow: "var(--shadow-sm, 0 4px 6px -1px rgb(var(--theme-neutral-900) / 0.1))",
        },
      });

      // Edge from IGW to Subnet
      edges.push({
        id: `igw-to-subnet-${idx}`,
        source: "igw",
        target: `subnet-${s.id || idx}`,
        animated: true,
        style: { stroke: "var(--theme-color)", strokeWidth: 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--theme-color)" },
      });
    });

    // Active Provisioning Indicator Node
    if (activeStepId) {
      nodes.push({
        id: "provision-cursor",
        data: { label: "⚡ PROVISIONING" },
        position: { x: 200, y: 10 },
        className: "animate-pulse",
        style: {
          background: "rgb(var(--theme-warning-500))",
          color: "var(--theme-card-bg)",
          fontSize: "8px",
          borderRadius: "4px",
          padding: "4px 8px",
          border: "none",
          fontWeight: "bold",
        },
      });
    }

    return { nodes, edges };
  }, [vpc, subnets, igw, activeStepId]);

  return (
    <div className="w-full h-[280px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-[rgb(var(--theme-neutral-50))] rounded-xl border border-[rgb(var(--theme-neutral-200))] overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-[rgb(var(--theme-neutral-50))]"
        maxZoom={1.5}
        minZoom={0.5}
      >
        <Background
          color="rgb(var(--theme-neutral-300))"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
        />
        <Controls
          showInteractive={false}
          className="border-[rgb(var(--theme-neutral-200))]"
          style={{ backgroundColor: "var(--theme-card-bg)" }}
        />
        <Panel
          position="top-right"
          className="backdrop-blur-sm p-2 rounded-lg border border-[rgb(var(--theme-neutral-100))] shadow-sm"
          style={{ backgroundColor: "rgb(var(--theme-neutral-50) / 0.8)" }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-semibold text-gray-600 uppercase">
                Interactive Topology
              </span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default ProjectTopologyGraph;
