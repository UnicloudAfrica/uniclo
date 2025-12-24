import React from "react";
import { Key, Route, Globe, Cable, ChevronRight, ExternalLink, Info, Clock } from "lucide-react";

interface ResourceSummaryCardProps {
  keyPairs: number;
  routeTables: number;
  elasticIps: number;
  networkInterfaces: number;
  onViewAll?: () => void;
  onViewKeyPairs?: () => void;
  onViewRouteTables?: () => void;
  onViewElasticIps?: () => void;
  onViewNetworkInterfaces?: () => void;
}

const ResourceSummaryCard: React.FC<ResourceSummaryCardProps> = ({
  keyPairs = 0,
  routeTables = 0,
  elasticIps = 0,
  networkInterfaces = 0,
  onViewAll,
  onViewKeyPairs,
  onViewRouteTables,
  onViewElasticIps,
  onViewNetworkInterfaces,
}) => {
  const resources = [
    {
      icon: Key,
      label: "Key Pairs",
      count: keyPairs,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      onClick: onViewKeyPairs,
      description: "SSH keys for secure instance access",
      implemented: true,
    },
    {
      icon: Route,
      label: "Route Tables",
      count: routeTables,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      onClick: onViewRouteTables,
      description: "Control traffic routing between subnets",
      implemented: true,
    },
    {
      icon: Globe,
      label: "Elastic IPs",
      count: elasticIps,
      color: "text-green-500",
      bgColor: "bg-green-50",
      onClick: onViewElasticIps,
      description: "Static public IPs for your instances",
      implemented: true,
    },
    {
      icon: Cable,
      label: "Network Interfaces",
      count: networkInterfaces,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      onClick: onViewNetworkInterfaces,
      description: "Virtual network cards attached to instances",
      implemented: true,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resource Summary</h3>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Click to manage
        </span>
      </div>

      {/* Resource List */}
      <div className="space-y-2">
        {resources.map((resource) => {
          const isClickable = resource.implemented && !!resource.onClick;

          return (
            <div
              key={resource.label}
              className={`w-full flex items-center justify-between py-3 px-3 rounded-lg transition-colors ${
                isClickable
                  ? "bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent cursor-pointer group"
                  : "bg-gray-50/50 border border-gray-100"
              }`}
              onClick={isClickable ? resource.onClick : undefined}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${resource.bgColor}`}>
                  <resource.icon className={`w-4 h-4 ${resource.color}`} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{resource.label}</span>
                    {!resource.implemented && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Soon
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{resource.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${resource.count > 0 ? resource.color : "text-gray-300"}`}
                >
                  {resource.count}
                </span>
                {isClickable && (
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer py-2.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors"
        >
          View All Resources
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ResourceSummaryCard;
