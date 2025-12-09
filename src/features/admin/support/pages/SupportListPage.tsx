/**
 * Admin Support List Page (New Architecture)
 * Migrated to use feature-based structure with TypeScript
 */

import React, { useState } from "react";
import AdminHeadbar from "../../../../adminDashboard/components/adminHeadbar";
import AdminSidebar from "../../../../adminDashboard/components/AdminSidebar";
import AdminPageShell from "../../../../adminDashboard/components/AdminPageShell";
import {
  useAdminTickets,
  useDeleteAdminTicket,
  useCloseTicket,
  useReopenTicket,
  useAssignTicket,
  useBulkCloseTickets,
} from "../hooks/useAdminSupport";
import ToastUtils from "@/utils/toastUtil";
import type { Ticket } from "@/shared/domains/support/types/ticket.types";

const AdminSupportListPage: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Fetch tickets
  const {
    data: ticketsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminTickets();

  // Mutations
  const deleteTicketMutation = useDeleteAdminTicket();
  const closeTicketMutation = useCloseTicket();
  const reopenTicketMutation = useReopenTicket();
  const assignTicketMutation = useAssignTicket();
  const bulkCloseMutation = useBulkCloseTickets();

  const tickets = ticketsResponse?.data || [];

  // Ticket actions
  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // TODO: Open ticket drawer/modal
  };

  const handleCloseTicket = async (ticket: Ticket) => {
    try {
      await closeTicketMutation.mutateAsync(ticket.id);
      ToastUtils.success(`Ticket #${ticket.identifier} closed successfully`);
    } catch (err: any) {
      console.error("Failed to close ticket:", err);
      ToastUtils.error(err?.message || "Failed to close ticket");
    }
  };

  const handleReopenTicket = async (ticket: Ticket) => {
    try {
      await reopenTicketMutation.mutateAsync(ticket.id);
      ToastUtils.success(`Ticket #${ticket.identifier} reopened successfully`);
    } catch (err: any) {
      console.error("Failed to reopen ticket:", err);
      ToastUtils.error(err?.message || "Failed to reopen ticket");
    }
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    if (!window.confirm(`Are you sure you want to delete ticket #${ticket.identifier}?`)) {
      return;
    }

    try {
      await deleteTicketMutation.mutateAsync(ticket.id);
      ToastUtils.success(`Ticket deleted successfully`);
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
      ToastUtils.error(err?.message || "Failed to delete ticket");
    }
  };

  // Bulk actions
  const handleBulkClose = async () => {
    if (selectedIds.length === 0) {
      ToastUtils.warning("Please select tickets first");
      return;
    }

    try {
      await bulkCloseMutation.mutateAsync(selectedIds);
      ToastUtils.success(`Successfully closed ${selectedIds.length} tickets`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error("Failed to close tickets:", err);
      ToastUtils.error(err?.message || "Failed to close tickets");
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Support Tickets"
        description="Manage and respond to customer support requests"
        contentClassName="space-y-6"
        mainClassName="admin-dashboard-shell"
      >
        <div className="space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Tickets</div>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Open</div>
              <div className="text-2xl font-bold text-blue-600">
                {tickets.filter((t: Ticket) => t.status === "open").length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-amber-600">
                {tickets.filter((t: Ticket) => t.status === "pending").length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Ticket
              </button>
            </div>
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
                onClick={handleBulkClose}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Close Selected
              </button>
            </div>
          )}

          {/* Tickets Table - Placeholder */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading tickets...</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Error loading tickets</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tickets found</div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  {tickets.length} tickets loaded. Full UI integration pending...
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

export default AdminSupportListPage;
