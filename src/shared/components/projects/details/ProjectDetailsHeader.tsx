import React from "react";
import { CheckCircle, Info, Layers, Network } from "lucide-react";
import type { ProjectDetailsResourceStats } from "./types";

interface ProjectDetailsHeaderProps {
  project: import("../../../../types/project").Project;
  resourceStats: ProjectDetailsResourceStats;
}

const ProjectDetailsHeader: React.FC<ProjectDetailsHeaderProps> = ({ project, resourceStats }) => {
  const ipUsagePercent = resourceStats.ipPoolTotal
    ? Math.min(100, Math.round((resourceStats.ipPoolUsed / resourceStats.ipPoolTotal) * 100) || 0)
    : 0;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
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
            <div className="flex flex-col border-l border-gray-100 pl-3 md:pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">RAM</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.ram}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-3 md:pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Volumes</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.volumes}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-3 md:pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Images</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.images}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-3 md:pl-4">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Snapshots</span>
              <span className="text-lg font-bold text-gray-900">{resourceStats.snapshots}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Network className="w-3.5 h-3.5" />
            VPC Status
          </div>
          <div className="mt-2">
            {resourceStats.ipPoolTotal > 0 ? (
              <>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    IP Pool Usage
                  </span>
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
              </>
            ) : resourceStats.edgeNetworkConnected ? (
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-green-700">
                    Edge network connected
                    {resourceStats.edgeNetworkName ? `: ${resourceStats.edgeNetworkName}` : ""}
                  </p>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    Public IP allocation is available via the assigned edge network.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-600">
                    No edge network configured
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Public IP allocation requires an edge network. Contact your administrator to
                    enable.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsHeader;
