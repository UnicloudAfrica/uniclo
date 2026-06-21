import React from "react";
import { Server, Play, Square, Network } from "lucide-react";
import { ModernStatsCard } from "../ui";
import { summarizeInstances, type InstanceLike } from "./instanceStatus";

interface InstanceStatsProps {
  instances: InstanceLike[];
}

const InstanceStats = ({ instances }: InstanceStatsProps) => {
  const {
    total: totalInstancesCount,
    running: runningCount,
    provisioning: provisioningCount,
    stopped: stoppedCount,
    bandwidthReady: bandwidthReadyCount,
  } = summarizeInstances(instances);

  const fleetStats: Array<{
    key: string;
    title: string;
    value: string;
    description: string;
    icon: React.ReactElement;
    color: "error" | "success" | "primary" | "warning" | "info";
  }> = [
    {
      key: "total",
      title: "Total Instances",
      value: totalInstancesCount.toLocaleString(),
      description: `${runningCount} running`,
      icon: <Server size={24} />,
      color: "info",
    },
    {
      key: "running",
      title: "Active",
      value: runningCount.toLocaleString(),
      description: provisioningCount ? `${provisioningCount} provisioning` : "All healthy",
      icon: <Play size={24} />,
      color: "success",
    },
    {
      key: "idle",
      title: "Idle / Stopped",
      value: stoppedCount.toLocaleString(),
      description:
        stoppedCount > 0
          ? `${Math.round((stoppedCount / Math.max(totalInstancesCount, 1)) * 100)}% of fleet`
          : "No idle instances",
      icon: <Square size={24} />,
      color: "warning",
    },
    {
      key: "bandwidth",
      title: "Bandwidth Ready",
      value: bandwidthReadyCount.toLocaleString(),
      description: "Floating IP or dedicated bandwidth attached",
      icon: <Network size={24} />,
      color: "info",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {fleetStats.map((stat) => (
        <ModernStatsCard
          key={stat.key}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  );
};

export default InstanceStats;
