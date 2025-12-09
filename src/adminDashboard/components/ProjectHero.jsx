import React from "react";
import { FolderOpen, Activity, Settings, Server, Plus } from "lucide-react";
import { ResourceHero } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";

const ProjectHero = ({
  stats = {
    totalProjects: 0,
    activeProjects: 0,
    provisioningProjects: 0,
    totalInstances: 0,
  },
  onNewProject,
  breadcrumbs,
}) => {
  const metrics = [
    {
      label: "Total Projects",
      value: stats.totalProjects,
      icon: <FolderOpen />,
      description: "Tracked across tenants",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: <Activity />,
      description: "Available for workloads",
    },
    {
      label: "Provisioning",
      value: stats.provisioningProjects,
      icon: <Settings />,
      description: "In progress with Zadara",
    },
    {
      label: "Instances",
      value: stats.totalInstances,
      icon: <Server />,
      description: "Instances discovered",
    },
  ];

  return (
    <ResourceHero
      title="Project Management"
      subtitle="Infrastructure"
      description="Manage and track your infrastructure projects across all tenants and regions."
      accent="midnight"
      metrics={metrics}
      breadcrumbs={breadcrumbs}
      rightSlot={
        <ModernButton
          onClick={onNewProject}
          variant="primary"
          size="lg"
          className="shadow-lg shadow-primary-500/20"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </ModernButton>
      }
    />
  );
};

export default ProjectHero;
