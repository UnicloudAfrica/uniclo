import React, { useState, useMemo } from "react";
import {
  Layers,
  Settings2,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  Cpu,
  MemoryStick,
  X,
  Pencil,
  Check,
} from "lucide-react";
import {
  useLaunchConfigurations,
  useCreateLaunchConfiguration,
  useDeleteLaunchConfiguration,
  useAutoScalingGroups,
  useCreateAutoScalingGroup,
  useUpdateAutoScalingGroup,
  useDeleteAutoScalingGroup,
  useScalingPolicies,
  useCreateScalingPolicy,
  useDeleteScalingPolicy,
  usePricedProvisioningOptions,
  type PricedFlavor,
  type PricedImage,
} from "../../../../hooks/autoScalingHooks";
import { useSecurityGroups, useSubnets } from "../../../hooks/vpcInfraHooks";
import { useFetchTenantKeyPairs } from "../../../hooks/keyPairsHooks";

// ==================== Types ====================

interface ProjectAutoScalingTabProps {
  projectId?: string;
  region?: string;
}

interface LaunchConfiguration {
  id: string;
  name: string;
  instance_type?: string;
  image_id?: string;
  key_pair?: string;
  security_groups?: string[];
  description?: string;
  created_at?: string;
}

interface AutoScalingGroup {
  id: string;
  name: string;
  status?: string;
  min_size?: number;
  max_size?: number;
  desired_capacity?: number;
  launch_configuration_id?: string;
  launch_configuration_name?: string;
  subnets?: string[];
  created_at?: string;
}

interface ScalingPolicy {
  id: string;
  name: string;
  group_id?: string;
  group_name?: string;
  metric_type?: string;
  target_value?: string | number;
  status?: string;
  created_at?: string;
}

type SubView = "launch-configs" | "groups" | "policies";

// ==================== Status Colors ====================

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  creating: "bg-yellow-100 text-yellow-700",
  updating: "bg-yellow-100 text-yellow-700",
  deleting: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  deleted: "bg-gray-100 text-gray-500",
  "in-service": "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  enabled: "bg-green-100 text-green-700",
  disabled: "bg-gray-100 text-gray-500",
};

const metricTypeLabels: Record<string, string> = {
  cpu: "CPU Utilization",
  memory: "Memory Utilization",
  custom: "Custom Metric",
};

// ==================== Main Component ====================

export default function ProjectAutoScalingTab({ projectId, region }: ProjectAutoScalingTabProps) {
  const [activeView, setActiveView] = useState<SubView>("groups");
  const [showCreateLCForm, setShowCreateLCForm] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [showCreatePolicyForm, setShowCreatePolicyForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    min_size: number;
    max_size: number;
    desired_capacity: number;
  }>({ min_size: 0, max_size: 0, desired_capacity: 0 });

  // Data fetching
  const {
    data: launchConfigs = [],
    isLoading: lcLoading,
    refetch: refetchLC,
  } = useLaunchConfigurations(projectId, region);

  const {
    data: groups = [],
    isLoading: groupsLoading,
    refetch: refetchGroups,
  } = useAutoScalingGroups(projectId, region);

  const {
    data: policies = [],
    isLoading: policiesLoading,
    refetch: refetchPolicies,
  } = useScalingPolicies(projectId || "", region || "");

  // Mutations
  const createLC = useCreateLaunchConfiguration();
  const deleteLC = useDeleteLaunchConfiguration();
  const createGroup = useCreateAutoScalingGroup();
  const updateGroup = useUpdateAutoScalingGroup();
  const deleteGroup = useDeleteAutoScalingGroup();
  const createPolicy = useCreateScalingPolicy();
  const deletePolicy = useDeleteScalingPolicy();

  // Derived data
  const lcArray = Array.isArray(launchConfigs) ? launchConfigs : [];
  const groupsArray = useMemo(() => (Array.isArray(groups) ? groups : []), [groups]);
  const policiesArray = Array.isArray(policies) ? policies : [];

  const totalCapacity = useMemo(
    () =>
      groupsArray.reduce((sum: number, g: AutoScalingGroup) => sum + (g.desired_capacity || 0), 0),
    [groupsArray]
  );

  const isLoading = lcLoading || groupsLoading || policiesLoading;

  const handleRefresh = () => {
    refetchLC();
    refetchGroups();
    refetchPolicies();
  };

  // Inline edit handlers
  const startEditing = (group: AutoScalingGroup) => {
    setEditingGroupId(group.id);
    setEditValues({
      min_size: group.min_size ?? 0,
      max_size: group.max_size ?? 1,
      desired_capacity: group.desired_capacity ?? 0,
    });
  };

  const cancelEditing = () => {
    setEditingGroupId(null);
  };

  const saveEditing = (groupId: string) => {
    if (!projectId || !region) return;
    updateGroup.mutate(
      {
        id: groupId,
        projectId,
        region,
        min_size: editValues.min_size,
        max_size: editValues.max_size,
        desired_capacity: editValues.desired_capacity,
      },
      { onSuccess: () => setEditingGroupId(null) }
    );
  };

  // Sub-view tab config
  const subViewTabs: { key: SubView; label: string; icon: React.ReactNode }[] = [
    {
      key: "groups",
      label: "Auto-Scaling Groups",
      icon: <Layers size={14} />,
    },
    {
      key: "launch-configs",
      label: "Launch Configurations",
      icon: <Settings2 size={14} />,
    },
    {
      key: "policies",
      label: "Scaling Policies",
      icon: <TrendingUp size={14} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Auto-Scaling</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage auto-scaling groups, launch configurations, and scaling policies
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          {activeView === "launch-configs" && (
            <button
              onClick={() => setShowCreateLCForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} />
              Create Configuration
            </button>
          )}
          {activeView === "groups" && (
            <button
              onClick={() => setShowCreateGroupForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} />
              Create Group
            </button>
          )}
          {activeView === "policies" && (
            <button
              onClick={() => setShowCreatePolicyForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} />
              Create Policy
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={Layers} label="Total Groups" value={groupsArray.length} color="blue" />
        <SummaryCard
          icon={Settings2}
          label="Total Launch Configs"
          value={lcArray.length}
          color="green"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total Policies"
          value={policiesArray.length}
          color="purple"
        />
        <SummaryCard
          icon={Activity}
          label="Current Capacity"
          value={totalCapacity}
          color="orange"
        />
      </div>

      {/* Guided Step Flow — shows dependency chain for novices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Setup Flow</p>
          <p className="text-xs text-blue-500">Complete these steps in order</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Step 1 */}
          <button
            onClick={() => setActiveView("launch-configs")}
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left ${
              lcArray.length > 0
                ? "bg-green-50 border-green-300 text-green-800"
                : activeView === "launch-configs"
                  ? "bg-white border-blue-400 text-blue-800 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                lcArray.length > 0 ? "bg-green-200 text-green-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {lcArray.length > 0 ? "✓" : "1"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">Launch Config</p>
              <p className="text-[10px] opacity-70">
                {lcArray.length > 0 ? `${lcArray.length} created` : "Define server template"}
              </p>
            </div>
          </button>

          <span className="text-gray-300 text-lg flex-shrink-0">→</span>

          {/* Step 2 */}
          <button
            onClick={() => (lcArray.length > 0 ? setActiveView("groups") : undefined)}
            disabled={lcArray.length === 0}
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left ${
              lcArray.length === 0
                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                : groupsArray.length > 0
                  ? "bg-green-50 border-green-300 text-green-800"
                  : activeView === "groups"
                    ? "bg-white border-blue-400 text-blue-800 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                groupsArray.length > 0
                  ? "bg-green-200 text-green-700"
                  : lcArray.length === 0
                    ? "bg-gray-200 text-gray-400"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {groupsArray.length > 0 ? "✓" : "2"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">Scaling Group</p>
              <p className="text-[10px] opacity-70">
                {lcArray.length === 0
                  ? "Create a config first"
                  : groupsArray.length > 0
                    ? `${groupsArray.length} groups`
                    : "Group servers together"}
              </p>
            </div>
          </button>

          <span className="text-gray-300 text-lg flex-shrink-0">→</span>

          {/* Step 3 */}
          <button
            onClick={() => (groupsArray.length > 0 ? setActiveView("policies") : undefined)}
            disabled={groupsArray.length === 0}
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left ${
              groupsArray.length === 0
                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                : policiesArray.length > 0
                  ? "bg-green-50 border-green-300 text-green-800"
                  : activeView === "policies"
                    ? "bg-white border-blue-400 text-blue-800 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                policiesArray.length > 0
                  ? "bg-green-200 text-green-700"
                  : groupsArray.length === 0
                    ? "bg-gray-200 text-gray-400"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {policiesArray.length > 0 ? "✓" : "3"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">Scaling Policy</p>
              <p className="text-[10px] opacity-70">
                {groupsArray.length === 0
                  ? "Create a group first"
                  : policiesArray.length > 0
                    ? `${policiesArray.length} policies`
                    : "Set scale rules"}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Sub-view Toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {subViewTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeView === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-view Content */}
      {activeView === "launch-configs" && (
        <LaunchConfigurationsView
          configs={lcArray}
          isLoading={lcLoading}
          onDelete={(id: string) => {
            if (!projectId || !region) return;
            deleteLC.mutate({ id, projectId, region });
          }}
          isDeleting={deleteLC.isPending}
        />
      )}

      {activeView === "groups" && (
        <AutoScalingGroupsView
          groups={groupsArray}
          launchConfigs={lcArray}
          isLoading={groupsLoading}
          editingGroupId={editingGroupId}
          editValues={editValues}
          onEditValuesChange={setEditValues}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSaveEditing={saveEditing}
          onDelete={(id: string) => {
            if (!projectId || !region) return;
            deleteGroup.mutate({ id, projectId, region });
          }}
          isDeleting={deleteGroup.isPending}
          isUpdating={updateGroup.isPending}
        />
      )}

      {activeView === "policies" && (
        <ScalingPoliciesView
          policies={policiesArray}
          groups={groupsArray}
          isLoading={policiesLoading}
          onDelete={(id: string) => {
            if (!projectId || !region) return;
            deletePolicy.mutate({ id, projectId, region });
          }}
          isDeleting={deletePolicy.isPending}
        />
      )}

      {/* Create Launch Configuration Modal */}
      {showCreateLCForm && (
        <CreateLaunchConfigModal
          projectId={projectId}
          region={region}
          onSubmit={(payload) => {
            createLC.mutate(payload, {
              onSuccess: () => setShowCreateLCForm(false),
            });
          }}
          onClose={() => setShowCreateLCForm(false)}
          isSubmitting={createLC.isPending}
        />
      )}

      {/* Create Auto-Scaling Group Modal */}
      {showCreateGroupForm && (
        <CreateGroupModal
          projectId={projectId}
          region={region}
          launchConfigs={lcArray}
          onSubmit={(payload) => {
            createGroup.mutate(payload, {
              onSuccess: () => setShowCreateGroupForm(false),
            });
          }}
          onClose={() => setShowCreateGroupForm(false)}
          isSubmitting={createGroup.isPending}
        />
      )}

      {/* Create Scaling Policy Modal */}
      {showCreatePolicyForm && (
        <CreatePolicyModal
          projectId={projectId}
          region={region}
          groups={groupsArray}
          onSubmit={(payload) => {
            createPolicy.mutate(payload, {
              onSuccess: () => setShowCreatePolicyForm(false),
            });
          }}
          onClose={() => setShowCreatePolicyForm(false)}
          isSubmitting={createPolicy.isPending}
        />
      )}
    </div>
  );
}

// ==================== Launch Configurations View ====================

function LaunchConfigurationsView({
  configs,
  isLoading,
  onDelete,
  isDeleting,
}: {
  configs: LaunchConfiguration[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Instance Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Image ID
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Key Pair
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Security Groups
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Created
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center">
                <RefreshCw className="mx-auto text-gray-300 mb-3 animate-spin" size={32} />
                <p className="text-gray-500 text-sm">Loading launch configurations...</p>
              </td>
            </tr>
          ) : configs.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center">
                <Settings2 className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No launch configurations yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create a launch configuration to define instance templates for your auto-scaling
                  groups
                </p>
              </td>
            </tr>
          ) : (
            configs.map((config: LaunchConfiguration) => (
              <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{config.name}</div>
                  {config.description && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                      {config.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-700">
                    {config.instance_type || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                  {config.image_id
                    ? config.image_id.length > 16
                      ? `${config.image_id.substring(0, 16)}...`
                      : config.image_id
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{config.key_pair || "-"}</td>
                <td className="px-4 py-3">
                  {config.security_groups && config.security_groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {config.security_groups.slice(0, 2).map((sg: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
                        >
                          {sg}
                        </span>
                      ))}
                      {config.security_groups.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{config.security_groups.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {config.created_at ? new Date(config.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(config.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== Auto-Scaling Groups View ====================

function CapacityGauge({ min, max, desired }: { min: number; max: number; desired: number }) {
  const percentage = max > 0 ? (desired / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-[80px]">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-blue-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap font-medium">
        {desired}{" "}
        <span className="text-gray-400">
          / {min}-{max}
        </span>
      </span>
    </div>
  );
}

function AutoScalingGroupsView({
  groups,
  launchConfigs,
  isLoading,
  editingGroupId,
  editValues,
  onEditValuesChange,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
  isDeleting,
  isUpdating,
}: {
  groups: AutoScalingGroup[];
  launchConfigs: LaunchConfiguration[];
  isLoading: boolean;
  editingGroupId: string | null;
  editValues: { min_size: number; max_size: number; desired_capacity: number };
  onEditValuesChange: (vals: {
    min_size: number;
    max_size: number;
    desired_capacity: number;
  }) => void;
  onStartEditing: (group: AutoScalingGroup) => void;
  onCancelEditing: () => void;
  onSaveEditing: (groupId: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}) {
  const getLCName = (lcId?: string) => {
    if (!lcId) return "-";
    const lc = launchConfigs.find((c: LaunchConfiguration) => c.id === lcId);
    return lc ? lc.name : lcId;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[200px]">
              Capacity (Desired / Min-Max)
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Launch Config
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Subnets
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <RefreshCw className="mx-auto text-gray-300 mb-3 animate-spin" size={32} />
                <p className="text-gray-500 text-sm">Loading auto-scaling groups...</p>
              </td>
            </tr>
          ) : groups.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <Layers className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No auto-scaling groups yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create an auto-scaling group to automatically manage your instance fleet
                </p>
              </td>
            </tr>
          ) : (
            groups.map((group: AutoScalingGroup) => {
              const isEditing = editingGroupId === group.id;
              return (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">{group.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[group.status || ""] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {group.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-gray-400">Min</label>
                          <input
                            type="number"
                            value={editValues.min_size}
                            onChange={(e) =>
                              onEditValuesChange({
                                ...editValues,
                                min_size: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min={0}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-gray-400">Max</label>
                          <input
                            type="number"
                            value={editValues.max_size}
                            onChange={(e) =>
                              onEditValuesChange({
                                ...editValues,
                                max_size: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min={0}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-gray-400">Desired</label>
                          <input
                            type="number"
                            value={editValues.desired_capacity}
                            onChange={(e) =>
                              onEditValuesChange({
                                ...editValues,
                                desired_capacity: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min={0}
                          />
                        </div>
                      </div>
                    ) : (
                      <CapacityGauge
                        min={group.min_size ?? 0}
                        max={group.max_size ?? 1}
                        desired={group.desired_capacity ?? 0}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {group.launch_configuration_name || getLCName(group.launch_configuration_id)}
                  </td>
                  <td className="px-4 py-3">
                    {group.subnets && group.subnets.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {group.subnets.slice(0, 2).map((subnet: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono"
                          >
                            {subnet.length > 14 ? `${subnet.substring(0, 14)}...` : subnet}
                          </span>
                        ))}
                        {group.subnets.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{group.subnets.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => onSaveEditing(group.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            <Check size={12} />
                            Save
                          </button>
                          <button
                            onClick={onCancelEditing}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onStartEditing(group)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(group.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== Scaling Policies View ====================

function MetricIcon({ type }: { type?: string }) {
  switch (type) {
    case "cpu":
      return <Cpu size={14} className="text-orange-500" />;
    case "memory":
      return <MemoryStick size={14} className="text-purple-500" />;
    default:
      return <Activity size={14} className="text-gray-500" />;
  }
}

function ScalingPoliciesView({
  policies,
  groups,
  isLoading,
  onDelete,
  isDeleting,
}: {
  policies: ScalingPolicy[];
  groups: AutoScalingGroup[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const getGroupName = (groupId?: string) => {
    if (!groupId) return "-";
    const group = groups.find((g: AutoScalingGroup) => g.id === groupId);
    return group ? group.name : groupId;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Group
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Metric Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Target Value
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <RefreshCw className="mx-auto text-gray-300 mb-3 animate-spin" size={32} />
                <p className="text-gray-500 text-sm">Loading scaling policies...</p>
              </td>
            </tr>
          ) : policies.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <TrendingUp className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No scaling policies yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create a scaling policy to automatically adjust capacity based on metrics
                </p>
              </td>
            </tr>
          ) : (
            policies.map((policy: ScalingPolicy) => (
              <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{policy.name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {policy.group_name || getGroupName(policy.group_id)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <MetricIcon type={policy.metric_type} />
                    <span className="text-sm text-gray-700">
                      {metricTypeLabels[policy.metric_type || ""] || policy.metric_type || "-"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-700">
                    {policy.target_value ?? "-"}
                    {policy.metric_type === "cpu" || policy.metric_type === "memory" ? "%" : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[policy.status || ""] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {policy.status || "unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(policy.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== Create Launch Configuration Modal ====================

function CreateLaunchConfigModal({
  projectId,
  region,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  projectId?: string;
  region?: string;
  onSubmit: (payload: {
    project_id: string;
    region: string;
    name: string;
    instance_type: string;
    image_id?: string;
    key_pair?: string;
    security_groups?: string[];
    description?: string;
  }) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    instance_type: "",
    image_id: "",
    key_pair: "",
    security_groups: [] as string[],
    description: "",
  });

  // Fetch priced options, key pairs, and security groups
  const { flavors, images: pricedImages } = usePricedProvisioningOptions(region);
  const { data: keyPairs = [] } = useFetchTenantKeyPairs(projectId ?? "", region ?? "");
  const { data: securityGroups = [] } = useSecurityGroups(projectId ?? "", region ?? "");

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return `${currency} ${price.toFixed(2)}/mo`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !region) return;
    onSubmit({
      project_id: projectId,
      region,
      name: form.name,
      instance_type: form.instance_type,
      image_id: form.image_id || undefined,
      key_pair: form.key_pair || undefined,
      security_groups: form.security_groups.length > 0 ? form.security_groups : undefined,
      description: form.description || undefined,
    });
  };

  const toggleSecurityGroup = (sgId: string) => {
    setForm((prev) => ({
      ...prev,
      security_groups: prev.security_groups.includes(sgId)
        ? prev.security_groups.filter((id) => id !== sgId)
        : [...prev.security_groups, sgId],
    }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Create Launch Configuration</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <FormField label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., web-server-config"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </FormField>

          <FormField label="Instance Type" required hint="Server size and pricing">
            <select
              value={form.instance_type}
              onChange={(e) => setForm({ ...form, instance_type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select instance type...</option>
              {flavors.map((f: PricedFlavor) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name} — {f.vcpus} vCPU, {f.memory_gib} GB RAM —{" "}
                  {formatPrice(f.unit_local, f.currency)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Machine Image" hint="Only priced images are shown">
            <select
              value={form.image_id}
              onChange={(e) => setForm({ ...form, image_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select image (optional)...</option>
              {pricedImages.map((img: PricedImage) => (
                <option key={img.id} value={String(img.id)}>
                  {img.name} — {formatPrice(img.unit_local, img.currency)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Key Pair" hint="SSH access key">
            <select
              value={form.key_pair}
              onChange={(e) => setForm({ ...form, key_pair: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select key pair (optional)...</option>
              {keyPairs.map((kp: any) => (
                <option key={kp.id || kp.name} value={kp.name}>
                  {kp.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Security Groups" hint="Select one or more firewall rule sets">
            {securityGroups.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No security groups available</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto">
                {securityGroups.map((sg: any) => (
                  <button
                    key={sg.id}
                    type="button"
                    onClick={() => toggleSecurityGroup(sg.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${
                      form.security_groups.includes(sg.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        form.security_groups.includes(sg.id)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {form.security_groups.includes(sg.id) && <Check size={10} />}
                    </div>
                    <span className="font-medium text-gray-900">{sg.name}</span>
                    {sg.description && (
                      <span className="text-xs text-gray-400 truncate">— {sg.description}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name || !form.instance_type}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ==================== Create Auto-Scaling Group Modal ====================

function CreateGroupModal({
  projectId,
  region,
  launchConfigs,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  projectId?: string;
  region?: string;
  launchConfigs: LaunchConfiguration[];
  onSubmit: (payload: {
    project_id: string;
    region: string;
    name: string;
    launch_configuration_id: string;
    min_size: number;
    max_size: number;
    desired_capacity?: number;
    subnets?: string[];
    health_check_type?: "vm_monitor" | "load_balancer";
  }) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    launch_configuration_id: "",
    min_size: "1",
    max_size: "3",
    desired_capacity: "1",
    subnets: [] as string[],
    health_check_type: "vm_monitor" as "vm_monitor" | "load_balancer",
  });

  const { data: subnets = [] } = useSubnets(projectId ?? "", region ?? "");

  const toggleSubnet = (subnetId: string) => {
    setForm((prev) => ({
      ...prev,
      subnets: prev.subnets.includes(subnetId)
        ? prev.subnets.filter((id) => id !== subnetId)
        : [...prev.subnets, subnetId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !region) return;
    onSubmit({
      project_id: projectId,
      region,
      name: form.name,
      launch_configuration_id: form.launch_configuration_id,
      min_size: parseInt(form.min_size) || 0,
      max_size: parseInt(form.max_size) || 1,
      desired_capacity: form.desired_capacity ? parseInt(form.desired_capacity) : undefined,
      subnets: form.subnets.length > 0 ? form.subnets : undefined,
      health_check_type: form.health_check_type,
    });
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Create Auto-Scaling Group</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <FormField label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., web-asg"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </FormField>
          <FormField label="Launch Configuration" required hint="Template for new instances">
            {launchConfigs.length === 0 ? (
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                No launch configurations found. Create one first.
              </p>
            ) : (
              <select
                value={form.launch_configuration_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    launch_configuration_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Select a launch configuration...</option>
                {launchConfigs.map((lc: LaunchConfiguration) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.name} ({lc.instance_type || "unknown type"})
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Min Size" required hint="Safety net">
              <input
                type="number"
                value={form.min_size}
                onChange={(e) => setForm({ ...form, min_size: e.target.value })}
                min={0}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
            <FormField label="Max Size" required hint="Cost cap">
              <input
                type="number"
                value={form.max_size}
                onChange={(e) => setForm({ ...form, max_size: e.target.value })}
                min={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </FormField>
            <FormField label="Desired" hint="Start with">
              <input
                type="number"
                value={form.desired_capacity}
                onChange={(e) => setForm({ ...form, desired_capacity: e.target.value })}
                min={0}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>

          <FormField label="Health Check Type" hint="How to verify instances are healthy">
            <select
              value={form.health_check_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  health_check_type: e.target.value as "vm_monitor" | "load_balancer",
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="vm_monitor">VM Monitor — checks if server is running</option>
              <option value="load_balancer">
                Load Balancer — checks if server responds to traffic
              </option>
            </select>
          </FormField>

          <FormField label="Subnets" hint="Select network segments (optional)">
            {subnets.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No subnets available</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {subnets.map((sub: any) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubnet(sub.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all ${
                      form.subnets.includes(sub.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        form.subnets.includes(sub.id)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {form.subnets.includes(sub.id) && <Check size={10} />}
                    </div>
                    <span className="font-medium text-gray-900">{sub.name || "Unnamed"}</span>
                    <span className="text-xs text-gray-400 font-mono">{sub.cidr}</span>
                  </button>
                ))}
              </div>
            )}
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name || !form.launch_configuration_id}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ==================== Create Scaling Policy Modal ====================

function CreatePolicyModal({
  projectId,
  region,
  groups,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  projectId?: string;
  region?: string;
  groups: AutoScalingGroup[];
  onSubmit: (payload: {
    project_id: string;
    region: string;
    name: string;
    group_id: string;
    metric_type: string;
    target_value: string;
  }) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    group_id: "",
    metric_type: "cpu",
    target_value: "70",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !region) return;
    onSubmit({
      project_id: projectId,
      region,
      name: form.name,
      group_id: form.group_id,
      metric_type: form.metric_type,
      target_value: form.target_value,
    });
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Create Scaling Policy</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <FormField label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., cpu-target-tracking"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </FormField>
          <FormField label="Auto-Scaling Group" required>
            <select
              value={form.group_id}
              onChange={(e) => setForm({ ...form, group_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select a group...</option>
              {groups.map((g: AutoScalingGroup) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Metric Type" required>
            <select
              value={form.metric_type}
              onChange={(e) => setForm({ ...form, metric_type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="cpu">CPU Utilization</option>
              <option value="memory">Memory Utilization</option>
              <option value="custom">Custom Metric</option>
            </select>
          </FormField>
          <FormField
            label="Target Value"
            required
            hint={
              form.metric_type === "cpu" || form.metric_type === "memory"
                ? "Percentage (0-100)"
                : "Numeric target value"
            }
          >
            <input
              type="text"
              value={form.target_value}
              onChange={(e) => setForm({ ...form, target_value: e.target.value })}
              placeholder="e.g., 70"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name || !form.group_id || !form.target_value}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ==================== Shared UI Components ====================

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${bgColors[color] || "bg-gray-50"} flex items-center justify-center`}
        >
          <Icon size={20} className={iconColors[color] || "text-gray-600"} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4">{children}</div>
    </div>
  );
}
