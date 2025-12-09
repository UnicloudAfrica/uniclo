/**
 * Admin Instances List Page (New Architecture)
 * Migrated to use feature-based structure with TypeScript
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../../../../adminDashboard/components/adminHeadbar";
import AdminSidebar from "../../../../adminDashboard/components/AdminSidebar";
import AdminPageShell from "../../../../adminDashboard/components/AdminPageShell";
import {
  useAdminInstances,
  useDeleteAdminInstance,
  useInstanceAction,
  useBulkInstanceAction,
} from "../hooks/useAdminInstances";
import ToastUtils from "@/utils/toastUtil";
import type { Instance } from "@/shared/domains/instances/types/instance.types";

const AdminInstancesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch instances
  const {
    data: instancesResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminInstances();

  // Mutations
  const deleteInstanceMutation = useDeleteAdminInstance();
  const instanceActionMutation = useInstanceAction();
  const bulkActionMutation = useBulkInstanceAction();

  const instances = instancesResponse?.data || [];

  // Navigation handlers
  const handleCreateInstance = () => {
    navigate("/admin-dashboard/instances/create");
  };

  const handleViewInstance = (instance: Instance) => {
    navigate(`/admin-dashboard/instances/${instance.id}`);
  };

  // Instance actions
  const handleInstanceAction = async (instance: Instance, action: string) => {
    try {
      await instanceActionMutation.mutateAsync({ instanceId: String(instance.id), action });
      ToastUtils.success(`Instance "${instance.name}" ${action} initiated successfully`);
    } catch (err: any) {
      console.error(`Failed to ${action} instance:`, err);
      ToastUtils.error(err?.message || `Failed to ${action} instance`);
    }
  };

  const handleDeleteInstance = async (instance: Instance) => {
    if (
      !window.confirm(
        `Are you sure you want to delete instance "${instance.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteInstanceMutation.mutateAsync(String(instance.id));
      ToastUtils.success(`Instance "${instance.name}" deleted successfully`);
    } catch (err: any) {
      console.error("Failed to delete instance:", err);
      ToastUtils.error(err?.message || "Failed to delete instance");
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      ToastUtils.warning("Please select instances first");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.length} instances?`)) {
      return;
    }

    try {
      await bulkActionMutation.mutateAsync({ instanceIds: selectedIds, action });
      ToastUtils.success(`Successfully ${action} ${selectedIds.length} instances`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(`Failed to ${action} instances:`, err);
      ToastUtils.error(err?.message || `Failed to ${action} instances`);
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Instances"
        description="Manage and monitor all virtual machine instances"
        contentClassName="space-y-6"
        mainClassName="admin-dashboard-shell"
      >
        <div className="space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Instances</div>
              <div className="text-2xl font-bold">{instances.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Running</div>
              <div className="text-2xl font-bold text-green-600">
                {instances.filter((i: Instance) => i.status === "running").length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Stopped</div>
              <div className="text-2xl font-bold text-gray-600">
                {instances.filter((i: Instance) => i.status === "stopped").length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-blue-600">
                {instances.filter((i: Instance) => i.status === "pending").length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleCreateInstance}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Instance
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex gap-2 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">{selectedIds.length} selected</span>
              <button
                onClick={() => handleBulkAction("start" as const)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start
              </button>
              <button
                onClick={() => handleBulkAction("stop" as const)}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Stop
              </button>
              <button
                onClick={() => handleBulkAction("reboot" as const)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reboot
              </button>
            </div>
          )}

          {/* Instances Table - Placeholder for now */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading instances...</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Error loading instances</div>
            ) : instances.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No instances found</div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  {instances.length} instances loaded. Full UI integration pending...
                </p>
                {/* TODO: Integrate full DataTable component */}
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminInstancesListPage;
