import React from "react";
import { FolderOpen, Calendar, Eye, MoreVertical } from "lucide-react";
import { designTokens } from "../../styles/designTokens";
import { TableActionButtons } from "../../shared/components/tables";

const getStatusDisplayConfig = (status) => {
  switch (status) {
    case "active":
      return {
        color: designTokens.colors.success[700],
        backgroundColor: designTokens.colors.success[50],
        label: "Active",
        icon: <span className="w-2 h-2 rounded-full bg-green-500" />,
      };
    case "inactive":
      return {
        color: designTokens.colors.neutral[600],
        backgroundColor: designTokens.colors.neutral[100],
        label: "Inactive",
        icon: <span className="w-2 h-2 rounded-full bg-gray-400" />,
      };
    case "provisioning":
      return {
        color: designTokens.colors.primary[700],
        backgroundColor: designTokens.colors.primary[50],
        label: "Provisioning",
        icon: <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />,
      };
    case "failed":
      return {
        color: designTokens.colors.danger[700],
        backgroundColor: designTokens.colors.danger[50],
        label: "Failed",
        icon: <span className="w-2 h-2 rounded-full bg-red-500" />,
      };
    default:
      return {
        color: designTokens.colors.warning[700],
        backgroundColor: designTokens.colors.warning[50],
        label: status || "Pending",
        icon: <span className="w-2 h-2 rounded-full bg-yellow-500" />,
      };
  }
};

const ProjectRow = ({ project, isSelected, onSelect, onView, onArchive, onActivate, onDelete }) => {
  const statusConfig = getStatusDisplayConfig(project.status);

  const actions = [
    {
      label: "View Details",
      onClick: () => onView(project),
      icon: <Eye size={14} />,
    },
    project.status === "active"
      ? {
          label: "Archive Project",
          onClick: () => onArchive(project),
          className: "text-yellow-600 hover:bg-yellow-50",
        }
      : {
          label: "Activate Project",
          onClick: () => onActivate(project),
          className: "text-green-600 hover:bg-green-50",
        },
    {
      label: "Delete Project",
      onClick: () => onDelete(project),
      className: "text-red-600 hover:bg-red-50",
    },
  ];

  return (
    <tr className={`group hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={isSelected}
            onChange={() => onSelect(project.identifier)}
          />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FolderOpen size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{project.name}</div>
            <div className="text-xs text-gray-500">{project.identifier}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500 line-clamp-2" title={project.description}>
          {project.description || "-"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit"
          style={{
            backgroundColor: statusConfig.backgroundColor,
            color: statusConfig.color,
          }}
        >
          {statusConfig.icon}
          <span className="capitalize">{statusConfig.label}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {project.type || "VPC"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-gray-900">
            {project.resources_count?.instances || 0}
          </span>
          <span className="text-xs">instances</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.region || "-"}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {project.provider || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          {new Date(project.created_at).toLocaleDateString()}
        </div>
      </td>
      <td
        className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isSelected ? "bg-blue-50" : "bg-white group-hover:bg-gray-50"}`}
      >
        <TableActionButtons actions={actions} />
      </td>
    </tr>
  );
};

export default ProjectRow;
