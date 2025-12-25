import React from "react";
import {
  Key,
  Route,
  Globe,
  Cable,
  ChevronRight,
  ExternalLink,
  Info,
  Network,
  Shield,
  Layers,
  Globe2,
  ShieldCheck,
  GitMerge,
  Zap,
} from "lucide-react";

interface ResourceSummaryCardProps {
  keyPairs?: number;
  routeTables?: number;
  elasticIps?: number;
  networkInterfaces?: number;
  subnets?: number;
  securityGroups?: number;
  vpcs?: number;
  natGateways?: number;
  networkAcls?: number;
  vpcPeering?: number;
  internetGateways?: number;
  loadBalancers?: number;
  onViewAll?: () => void;
  onViewKeyPairs?: () => void;
  onViewRouteTables?: () => void;
  onViewElasticIps?: () => void;
  onViewNetworkInterfaces?: () => void;
  onViewSubnets?: () => void;
  onViewSecurityGroups?: () => void;
  onViewVpcs?: () => void;
  onViewNatGateways?: () => void;
  onViewNetworkAcls?: () => void;
  onViewVpcPeering?: () => void;
  onViewInternetGateways?: () => void;
  onViewLoadBalancers?: () => void;
}

const ResourceSummaryCard: React.FC<ResourceSummaryCardProps> = ({
  keyPairs = 0,
  routeTables = 0,
  elasticIps = 0,
  networkInterfaces = 0,
  subnets = 0,
  securityGroups = 0,
  vpcs = 0,
  natGateways = 0,
  networkAcls = 0,
  vpcPeering = 0,
  internetGateways = 0,
  loadBalancers = 0,
  onViewAll,
  onViewKeyPairs,
  onViewRouteTables,
  onViewElasticIps,
  onViewNetworkInterfaces,
  onViewSubnets,
  onViewSecurityGroups,
  onViewVpcs,
  onViewNatGateways,
  onViewNetworkAcls,
  onViewVpcPeering,
  onViewInternetGateways,
  onViewLoadBalancers,
}) => {
  const resources = [
    {
      icon: Layers,
      label: "VPCs",
      count: vpcs,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      onClick: onViewVpcs,
      description: "Virtual Private Clouds for network isolation",
    },
    {
      icon: Network,
      label: "Subnets",
      count: subnets,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      onClick: onViewSubnets,
      description: "Network segments within VPCs",
    },
    {
      icon: Shield,
      label: "Security Groups",
      count: securityGroups,
      color: "text-red-500",
      bgColor: "bg-red-50",
      onClick: onViewSecurityGroups,
      description: "Firewall rules for instances",
    },
    {
      icon: Key,
      label: "Key Pairs",
      count: keyPairs,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      onClick: onViewKeyPairs,
      description: "SSH keys for secure instance access",
    },
    {
      icon: Route,
      label: "Route Tables",
      count: routeTables,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      onClick: onViewRouteTables,
      description: "Control traffic routing between subnets",
    },
    {
      icon: Globe,
      label: "Elastic IPs",
      count: elasticIps,
      color: "text-green-500",
      bgColor: "bg-green-50",
      onClick: onViewElasticIps,
      description: "Static public IPs for your instances",
    },
    {
      icon: Cable,
      label: "Network Interfaces",
      count: networkInterfaces,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      onClick: onViewNetworkInterfaces,
      description: "Virtual network cards attached to instances",
    },
    {
      icon: Globe2,
      label: "NAT Gateways",
      count: natGateways,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
      onClick: onViewNatGateways,
      description: "Enable outbound internet for private subnets",
    },
    {
      icon: Globe,
      label: "Internet Gateways",
      count: internetGateways,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
      onClick: onViewInternetGateways,
      description: "Connect VPCs to the internet",
    },
    {
      icon: ShieldCheck,
      label: "Network ACLs",
      count: networkAcls,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      onClick: onViewNetworkAcls,
      description: "Subnet-level access control lists",
    },
    {
      icon: GitMerge,
      label: "VPC Peering",
      count: vpcPeering,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      onClick: onViewVpcPeering,
      description: "Connect VPCs to each other",
    },
    {
      icon: Zap,
      label: "Load Balancers",
      count: loadBalancers,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      onClick: onViewLoadBalancers,
      description: "Distribute traffic across instances",
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

      {/* Resource List - Scrollable */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {resources.map((resource) => {
          const isClickable = !!resource.onClick;

          return (
            <div
              key={resource.label}
              className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                isClickable
                  ? "bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent cursor-pointer group"
                  : "bg-gray-50/50 border border-gray-100"
              }`}
              onClick={isClickable ? resource.onClick : undefined}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${resource.bgColor}`}>
                  <resource.icon className={`w-4 h-4 ${resource.color}`} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-700">{resource.label}</span>
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
