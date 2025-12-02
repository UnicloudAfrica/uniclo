import React from "react";
import { Server, Play, Square, Network } from "lucide-react";
import ModernStatsCard from "../../adminDashboard/components/ModernStatsCard";

const InstanceStats = ({ instances }) => {
    const totalInstancesCount = instances.length;
    const runningCount = instances.filter((instance) =>
        ["running", "active"].includes((instance.status || "").toLowerCase())
    ).length;
    const stoppedCount = instances.filter((instance) =>
        ["stopped", "shutoff", "paused", "suspended"].includes(
            (instance.status || "").toLowerCase()
        )
    ).length;
    const provisioningCount = instances.filter((instance) =>
        ["provisioning", "building", "reboot", "hard_reboot"].includes(
            (instance.status || "").toLowerCase()
        )
    ).length;

    const fleetStats = [
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
            description: provisioningCount
                ? `${provisioningCount} provisioning`
                : "All healthy",
            icon: <Play size={24} />,
            color: "success",
        },
        {
            key: "idle",
            title: "Idle / Stopped",
            value: stoppedCount.toLocaleString(),
            description:
                stoppedCount > 0
                    ? `${Math.round(
                        (stoppedCount / Math.max(totalInstancesCount, 1)) * 100
                    )}% of fleet`
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
