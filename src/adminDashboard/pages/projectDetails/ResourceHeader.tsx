import React from "react";
import { Info, Layers, Cpu, Database, Network } from "lucide-react";

interface ResourceHeaderProps {
  project: any;
  resourceStats: {
    vCPUs: number;
    ram: string;
    volumes: number;
    images: number;
    snapshots: number;
    ipPoolUsed: number;
    ipPoolTotal: number;
  };
}

const ResourceHeader: React.FC<ResourceHeaderProps> = ({ project, resourceStats }) => {
  const ipUsagePercent = Math.min(
    100,
    Math.round((resourceStats.ipPoolUsed / resourceStats.ipPoolTotal) * 100) || 0
  );

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm px-6 md:px-8 py-4">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            Info
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400 w-12">ID</span>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {project?.identifier}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400 w-12">NAME</span>
              <span className="text-sm font-semibold text-gray-900">{project?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400 w-12">REGION</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                {project?.provider} / {project?.region}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Resources */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            Resources
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-400 uppercase">vCPUs</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.vCPUs}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">RAM</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.ram}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Volumes</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.volumes}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Images</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.images}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Snapshots</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.snapshots}</span>
            </div>
          </div>
        </div>

        {/* Column 3: VPC */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Network className="w-3.5 h-3.5" />
            VPC Status
          </div>
          <div className="mt-2">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase">IP Pool Usage</span>
              <span className="text-[10px] font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                public: {resourceStats.ipPoolUsed} / {resourceStats.ipPoolTotal}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
              <div
                className={`h-full transition-all duration-500 ${
                  ipUsagePercent > 85
                    ? "bg-red-500"
                    : ipUsagePercent > 60
                      ? "bg-orange-400"
                      : "bg-green-500"
                }`}
                style={{ width: `${ipUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceHeader;
