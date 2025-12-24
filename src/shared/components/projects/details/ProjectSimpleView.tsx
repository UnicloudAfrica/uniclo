import React from "react";
import { Server, MapPin, Clock, CheckCircle, AlertCircle, Users } from "lucide-react";

interface ProjectSimpleViewProps {
  project: {
    id: string | number;
    identifier: string;
    name: string;
    region?: string;
    region_name?: string;
    status: string;
    created_at?: string;
    instances?: any[];
    users?: { local?: any[] };
  };
  onViewInstances?: () => void;
  onViewMembers?: () => void;
}

const ProjectSimpleView: React.FC<ProjectSimpleViewProps> = ({
  project,
  onViewInstances,
  onViewMembers,
}) => {
  const instanceCount = project.instances?.length || 0;
  const memberCount = project.users?.local?.length || 0;
  const isActive = project.status?.toLowerCase() === "active";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={`rounded-xl p-6 ${isActive ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-sm text-gray-600">
                {project.region_name || project.region || "No region"} • Created{" "}
                {formatDate(project.created_at)}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {project.status}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instances Card */}
        <button
          onClick={onViewInstances}
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Server className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{instanceCount}</span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            Instances
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {instanceCount === 0
              ? "No instances yet"
              : `${instanceCount} running instance${instanceCount === 1 ? "" : "s"}`}
          </p>
        </button>

        {/* Members Card */}
        <button
          onClick={onViewMembers}
          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{memberCount}</span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
            Team Members
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {memberCount === 0
              ? "No members assigned"
              : `${memberCount} member${memberCount === 1 ? "" : "s"} with access`}
          </p>
        </button>
      </div>

      {/* Region Info */}
      <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
        <MapPin className="w-4 h-4" />
        <span>Region: {project.region_name || project.region || "Not specified"}</span>
        <span className="mx-2">•</span>
        <Clock className="w-4 h-4" />
        <span>ID: {project.identifier}</span>
      </div>
    </div>
  );
};

export default ProjectSimpleView;
