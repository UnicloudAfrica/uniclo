import React from "react";
import { FolderOpen, Activity, Settings, Server } from "lucide-react";
import ModernStatsCard from "../ui/ModernStatsCard";
import Skeleton from "../Skeleton";

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  provisioningProjects: number;
  totalInstances: number;
}

export interface ProjectsStatsBarProps {
  stats?: ProjectStats;
  isLoading?: boolean;
}

/**
 * Statistics bar showing project metrics
 */
const ProjectsStatsBar: React.FC<ProjectsStatsBarProps> = ({ stats, isLoading = false }) => {
  const statsCards: {
    title: string;
    value: number;
    icon: React.ReactElement;
    color: "primary" | "success" | "warning" | "error" | "info";
    description: string;
  }[] = [
    {
      title: "Total Projects",
      value: stats?.totalProjects || 0,
      icon: <FolderOpen size={24} />,
      color: "primary",
      description: "All projects",
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: <Activity size={24} />,
      color: "success",
      description: "Ready for use",
    },
    {
      title: "Provisioning",
      value: stats?.provisioningProjects || 0,
      icon: <Settings size={24} />,
      color: "warning",
      description: "In progress",
    },
    {
      title: "Total Instances",
      value: stats?.totalInstances || 0,
      icon: <Server size={24} />,
      color: "info",
      description: "Across all projects",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <Skeleton width="60%" height={16} className="mb-2" />
            <Skeleton width="40%" height={32} className="mb-2" />
            <Skeleton width="80%" height={14} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((card) => (
        <ModernStatsCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          description={card.description}
        />
      ))}
    </div>
  );
};

export default ProjectsStatsBar;
