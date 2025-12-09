/**
 * Admin Clients List Page (New Architecture)
 * Migrated to use feature-based structure with TypeScript
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../../../../adminDashboard/components/adminHeadbar";
import AdminSidebar from "../../../../adminDashboard/components/AdminSidebar";
import AdminPageShell from "../../../../adminDashboard/components/AdminPageShell";
import {
  useAdminClients,
  useDeleteAdminClient,
  useSuspendClient,
  useActivateClient,
  useBulkDeleteClients,
} from "../hooks/useAdminClients";
import ToastUtils from "@/utils/toastUtil";
import type { Client } from "@/shared/domains/clients/types/client.types";

const AdminClientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch clients
  const {
    data: clientsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminClients();

  // Mutations
  const deleteClientMutation = useDeleteAdminClient();
  const suspendClientMutation = useSuspendClient();
  const activateClientMutation = useActivateClient();
  const bulkDeleteMutation = useBulkDeleteClients();

  const clients = clientsResponse?.data || [];

  // Navigation handlers
  const handleCreateClient = () => {
    navigate("/admin-dashboard/clients/create");
  };

  const handleViewClient = (client: Client) => {
    navigate(`/admin-dashboard/clients/${client.id}`);
  };

  // Client actions
  const handleSuspendClient = async (client: Client) => {
    const reason = window.prompt("Please provide a reason for suspension:");
    if (!reason) return;

    try {
      await suspendClientMutation.mutateAsync({ clientId: client.id, reason });
      ToastUtils.success(`Client "${client.name}" suspended successfully`);
    } catch (err: any) {
      console.error("Failed to suspend client:", err);
      ToastUtils.error(err?.message || "Failed to suspend client");
    }
  };

  const handleActivateClient = async (client: Client) => {
    try {
      await activateClientMutation.mutateAsync(client.id);
      ToastUtils.success(`Client "${client.name}" activated successfully`);
    } catch (err: any) {
      console.error("Failed to activate client:", err);
      ToastUtils.error(err?.message || "Failed to activate client");
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (
      !window.confirm(
        `Are you sure you want to delete client "${client.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteClientMutation.mutateAsync(client.id);
      ToastUtils.success(`Client "${client.name}" deleted successfully`);
    } catch (err: any) {
      console.error("Failed to delete client:", err);
      ToastUtils.error(err?.message || "Failed to delete client");
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      ToastUtils.warning("Please select clients first");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} clients? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      ToastUtils.success(`Successfully deleted ${selectedIds.length} clients`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Failed to delete clients:", err);
      ToastUtils.error(err?.message || "Failed to delete clients");
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Clients"
        description="Manage customer accounts and relationships"
        contentClassName="space-y-6"
        mainClassName="admin-dashboard-shell"
      >
        <div className="space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Clients</div>
              <div className="text-2xl font-bold">{clients.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-green-600">
                {clients.filter((c: Client) => c.status === "active").length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Suspended</div>
              <div className="text-2xl font-bold text-red-600">
                {clients.filter((c: Client) => c.status === "suspended").length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-blue-600">
                {clients.filter((c: Client) => c.status === "pending").length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleCreateClient}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Client
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
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          )}

          {/* Clients Table - Placeholder */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading clients...</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Error loading clients</div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No clients found</div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  {clients.length} clients loaded. Full UI integration pending...
                </p>
                {/* TODO: Integrate full table component */}
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminClientsListPage;
