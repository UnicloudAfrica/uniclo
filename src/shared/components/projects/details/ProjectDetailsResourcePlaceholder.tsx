import React from "react";
import type { LucideIcon } from "lucide-react";
import { ResourceCanvas } from "./ResourceLayout";

interface ProjectDetailsResourcePlaceholderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  message?: string;
}

const ProjectDetailsResourcePlaceholder: React.FC<ProjectDetailsResourcePlaceholderProps> = ({
  title,
  description,
  icon,
  message,
}) => {
  return (
    <ResourceCanvas icon={icon} title={title} description={description}>
      <div className="py-16 text-center text-gray-500">
        {message || "This resource is not available yet."}
      </div>
    </ResourceCanvas>
  );
};

export default ProjectDetailsResourcePlaceholder;
