import React, { useMemo } from "react";
import ReactFlow, { Background, Controls, Panel, MarkerType, BackgroundVariant } from "reactflow";
import "reactflow/dist/style.css";
import { Server, Globe, Shield, Radio, Box } from "lucide-react";

const nodeTypes = {}; // We can add custom node types later

/**
 * ProjectTopologyGraph
 *
 * Visualizes the project infrastructure (VPC, Subnets, Gateway, Instances).
 * Uses React Flow for an interactive, zoomable experience.
 */
interface ProjectTopologyGraphProps {
  vpc?: any;
  subnets?: any[];
  igw?: any;
  instances?: any[];
  activeStepId?: string;
}

const ProjectTopologyGraph: React.FC<ProjectTopologyGraphProps> = ({
  vpc,
  subnets = [],
  igw,
  instances = [],
  activeStepId,
}) => {
  // 1. Transform Backend Data to Nodes/Edges
  const { nodes, edges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Core VPC Node (The Container)
    nodes.push({
      id: "vpc",
      data: { label: vpc?.name || "VPC Core" },
      position: { x: 250, y: 50 },
      style: {
        width: 600,
        height: 500,
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        border: "2px dashed #3b82f6",
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
        background: "#fff",
        border: "2px solid #3b82f6",
        width: 80,
      },
    });

    // Subnets
    subnets.forEach((s, idx) => {
      const xPos = 50 + idx * 200;
      nodes.push({
        id: `subnet-${s.id || idx}`,
        parentNode: "vpc",
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
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
      });

      // Edge from IGW to Subnet
      edges.push({
        id: `igw-to-subnet-${idx}`,
        source: "igw",
        target: `subnet-${s.id || idx}`,
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
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
          background: "#f59e0b",
          color: "#fff",
          fontSize: "8px",
          borderRadius: "4px",
          padding: "4px 8px",
          border: "none",
          fontWeight: "bold",
        },
      });
    }

    return { nodes, edges };
  }, [vpc, subnets, igw, instances, activeStepId]);

  return (
    <div className="w-full h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-slate-50"
        maxZoom={1.5}
        minZoom={0.5}
      >
        <Background color="#cbd5e1" variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} className="bg-white border-gray-200" />
        <Panel
          position="top-right"
          className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-gray-100 shadow-sm"
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
