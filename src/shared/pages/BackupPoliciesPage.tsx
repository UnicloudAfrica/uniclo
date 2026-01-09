import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Play,
  Trash2,
  Clock,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { toastUtil } from "../../utils/toastUtil";

interface BackupPolicy {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  project?: { name: string; identifier: string };
  recurrence: string;
  start_time: string;
  enabled: boolean;
  local_retention_days: number;
  remote_retention_days?: number;
  state: "ready" | "creating" | "updating" | "error";
  health: "healthy" | "degraded" | "absent";
  last_triggered_at?: string;
  snapshots_count?: number;
  resources?: BackupResource[];
  created_at: string;
}

interface BackupResource {
  id: string;
  resource_type: "instance" | "volume";
  resource_id: string;
  state: string;
  last_backup_at?: string;
}

interface BackupPoliciesPageProps {
  apiBaseUrl: string;
  getHeaders: () => Record<string, string>;
  projectId?: string;
}

export const BackupPoliciesPage: React.FC<BackupPoliciesPageProps> = ({
  apiBaseUrl,
  getHeaders,
  projectId,
}) => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<BackupPolicy | null>(null);

  // Fetch backup policies
  const {
    data: policies = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["backup-policies", projectId],
    queryFn: async () => {
      const params = projectId ? `?project_id=${projectId}` : "";
      const response = await fetch(`${apiBaseUrl}/backup-policies${params}`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch backup policies");
      const json = await response.json();
      return json.data?.data || json.data || [];
    },
  });

  // Trigger backup mutation
  const triggerMutation = useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch(`${apiBaseUrl}/backup-policies/${policyId}/trigger`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to trigger backup");
      return response.json();
    },
    onSuccess: () => {
      toastUtil.success("Backup triggered successfully");
      queryClient.invalidateQueries({ queryKey: ["backup-policies"] });
    },
    onError: (error: Error) => {
      toastUtil.error(error.message);
    },
  });

  // Delete policy mutation
  const deleteMutation = useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch(`${apiBaseUrl}/backup-policies/${policyId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete backup policy");
      return response.json();
    },
    onSuccess: () => {
      toastUtil.success("Backup policy deleted");
      queryClient.invalidateQueries({ queryKey: ["backup-policies"] });
    },
    onError: (error: Error) => {
      toastUtil.error(error.message);
    },
  });

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getRecurrenceLabel = (recurrence: string) => {
    if (recurrence.includes("HOURLY")) return "Hourly";
    if (recurrence.includes("DAILY")) return "Daily";
    if (recurrence.includes("WEEKLY")) return "Weekly";
    if (recurrence.includes("MONTHLY")) return "Monthly";
    return "Custom";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backup Policies</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage automated backups and disaster recovery for your instances
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Policy
          </button>
        </div>
      </div>

      {/* Policies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Backup Policies
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first backup policy to protect your instances and volumes with automated
            backups.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Policy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((policy: BackupPolicy) => (
            <div
              key={policy.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getHealthIcon(policy.health)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{policy.name}</h3>
                    {policy.project && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {policy.project.name}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    policy.enabled
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {policy.enabled ? "Active" : "Paused"}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{getRecurrenceLabel(policy.recurrence)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{policy.start_time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <HardDrive className="w-4 h-4" />
                  <span>{policy.local_retention_days}d retention</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>{policy.snapshots_count || 0} snapshots</span>
                </div>
              </div>

              {/* Resources */}
              {policy.resources && policy.resources.length > 0 && (
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{policy.resources.length}</span> protected resources
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => triggerMutation.mutate(policy.identifier)}
                  disabled={triggerMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Backup Now
                </button>
                <button
                  onClick={() => setSelectedPolicy(policy)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this backup policy?")) {
                      deleteMutation.mutate(policy.identifier);
                    }
                  }}
                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal placeholder - implement as needed */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Backup Policy</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create modal implementation - form fields for name, schedule, retention, etc.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPoliciesPage;
