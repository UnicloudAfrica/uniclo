import { Server, Play, Square, Network } from "lucide-react";
import type { ReactNode } from "react";
import { ModernStatsCard } from "@/shared/components/ui";

interface InstanceLike {
  status?: string;
  bandwidth_count?: number | string;
}

interface InstanceStatsProps {
  instances: InstanceLike[];
}

type StatColor = "info" | "success" | "warning" | "danger" | "neutral";

interface FleetStat {
  key: string;
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  color: StatColor;
}

const matchStatus = (instance: InstanceLike, candidates: string[]): boolean =>
  candidates.includes((instance.status ?? "").toLowerCase());

const InstanceStats = ({ instances }: InstanceStatsProps) => {
  const totalInstancesCount = instances.length;
  const runningCount = instances.filter((instance) =>
    matchStatus(instance, ["running", "active"])
  ).length;
  const stoppedCount = instances.filter((instance) =>
    matchStatus(instance, ["stopped", "shutoff", "paused", "suspended"])
  ).length;
  const provisioningCount = instances.filter((instance) =>
    matchStatus(instance, ["provisioning", "building", "reboot", "hard_reboot"])
  ).length;

  const fleetStats: FleetStat[] = [
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
      value: instances
        .filter((instance) => Number(instance.bandwidth_count || 0) > 0)
        .length.toLocaleString(),
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
