import React, { useState } from "react";
import { Plus, Trash2, Zap, Settings, RefreshCw, TrendingUp, Server } from "lucide-react";
import {
  useAutoScalingGroups,
  useDeleteAutoScalingGroup,
  useLaunchConfigurations,
  useScalingPolicies,
} from "../../../../hooks/autoScalingHooks";
import ModernTable from "../../ui/ModernTable";
import ModernCard from "../../ui/ModernCard";
import StatusPill from "../../ui/StatusPill";
import { ResourceEmptyState } from "../../ui/ResourceEmptyState";

export interface AutoScalingGroup {
  id: string;
  name: string;
  status: string;
  min_size: number;
  max_size: number;
  desired_capacity: number;
  instance_count: number;
  launch_configuration_id?: string;
  created_at: string;
}

export interface LaunchConfiguration {
  id: string;
  name: string;
  instance_type: string;
  image_id?: string;
  key_pair?: string;
  created_at: string;
}

interface AutoScalingManagementContainerProps {
  projectId?: string;
  region?: string;
  onCreateGroup?: () => void;
  onCreateLaunchConfig?: () => void;
}

/**
 * AutoScalingManagementContainer - manages auto-scaling groups and launch configurations
 * Works at tenant level (no project required) for listing
 * Creating new resources still requires project context
 */
const AutoScalingManagementContainer: React.FC<AutoScalingManagementContainerProps> = ({
  projectId,
  region,
  onCreateGroup,
  onCreateLaunchConfig,
}) => {
  const [activeTab, setActiveTab] = useState<"groups" | "configs">("configs");

  // Auto-scaling groups - works at tenant level
  const { data: groups = [], isLoading: isLoadingGroups } = useAutoScalingGroups(projectId, region);
  const { mutate: deleteGroup } = useDeleteAutoScalingGroup();

  // Launch configurations - works at tenant level
  const { data: launchConfigs = [], isLoading: isLoadingConfigs } = useLaunchConfigurations(
    projectId,
    region
  );

  const tabs = [
    { id: "configs", label: "Launch Configurations", icon: Settings, count: launchConfigs.length },

    { id: "groups", label: "Auto-scaling Groups", icon: TrendingUp, count: groups.length },
  ];

  const groupColumns = [
    {
      key: "name",
      header: "Name",
      accessor: "name",
      render: (name: string, row: AutoScalingGroup) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name || "Unnamed Group"}</div>
            <div className="text-xs text-gray-500 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      render: (status: string) => <StatusPill status={status} />,
    },
    {
      key: "capacity",
      header: "Capacity",
      accessor: "desired_capacity",
      render: (_: number, row: AutoScalingGroup) => (
        <div className="text-sm">
          <div className="flex items-center space-x-2">
            <Server className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">{row.instance_count}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{row.desired_capacity}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Min: {row.min_size} | Max: {row.max_size}
          </div>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      accessor: "created_at",
      render: (date: string) => (
        <div className="text-sm text-gray-500">{new Date(date).toLocaleString()}</div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: "id",
      align: "right" as const,
      render: (id: string) => (
        <button
          onClick={() => {
            if (!projectId || !region) {
              alert("Cannot delete: project context required");
              return;
            }
            if (window.confirm("Are you sure you want to delete this auto-scaling group?")) {
              deleteGroup({ id, projectId, region });
            }
          }}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Group"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const configColumns = [
    {
      key: "name",
      header: "Name",
      accessor: "name",
      render: (name: string, row: LaunchConfiguration) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name || "Unnamed Config"}</div>
            <div className="text-xs text-gray-500 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "instance_type",
      header: "Instance Type",
      accessor: "instance_type",
      render: (type: string) => (
        <div className="text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-xs">
            {type}
          </span>
        </div>
      ),
    },
    {
      key: "image_id",
      header: "Image",
      accessor: "image_id",
      render: (imageId: string) => (
        <div className="text-xs text-gray-500 font-mono">{imageId || "Not specified"}</div>
      ),
    },
    {
      key: "key_pair",
      header: "Key Pair",
      accessor: "key_pair",
      render: (keyPair: string) => <div className="text-sm text-gray-600">{keyPair || "—"}</div>,
    },
    {
      key: "created_at",
      header: "Created",
      accessor: "created_at",
      render: (date: string) => (
        <div className="text-sm text-gray-500">{new Date(date).toLocaleString()}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auto-scaling</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage launch configurations and auto-scaling groups for dynamic capacity.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab === "configs" && onCreateLaunchConfig && (
            <button
              onClick={onCreateLaunchConfig}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Launch Config</span>
            </button>
          )}
          {activeTab === "groups" && onCreateGroup && (
            <button
              onClick={onCreateGroup}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Auto-scaling Group</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                                flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${
                                  isActive
                                    ? "bg-white text-primary-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }
                            `}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`
                                    ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] 
                                    ${isActive ? "bg-primary-100 text-primary-600" : "bg-gray-200 text-gray-500"}
                                `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ModernCard padding="none" className="overflow-hidden border-gray-200 shadow-sm">
        {activeTab === "groups" ? (
          !isLoadingGroups && groups.length === 0 ? (
            <ResourceEmptyState
              icon={<TrendingUp className="w-12 h-12 text-gray-300" />}
              title="No auto-scaling groups"
              message="Create an auto-scaling group to automatically scale your compute capacity."
            />
          ) : (
            <ModernTable columns={groupColumns} data={groups} loading={isLoadingGroups} />
          )
        ) : !isLoadingConfigs && launchConfigs.length === 0 ? (
          <ResourceEmptyState
            icon={<Settings className="w-12 h-12 text-gray-300" />}
            title="No launch configurations"
            message="Create a launch configuration to define how instances are launched in an auto-scaling group."
          />
        ) : (
          <ModernTable columns={configColumns} data={launchConfigs} loading={isLoadingConfigs} />
        )}
      </ModernCard>
    </div>
  );
};

export default AutoScalingManagementContainer;
