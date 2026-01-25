// @ts-nocheck
import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import { SupportThreadsPanel } from "../../shared/components/support";
import adminApi, { adminSilentApi } from "../../index/admin/api";

const buildQuery = (filters: { status?: string; search?: string }) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const TicketsDashboard: React.FC = () => {
  const fetchThreads = (filters: { status?: string; search?: string }) =>
    adminSilentApi("GET", `/support${buildQuery(filters)}`);

  const fetchThread = (id: string | number) => adminSilentApi("GET", `/support/${id}`);

  const createThread = (payload: Record<string, any>) => adminApi("POST", "/support", payload);

  const replyThread = (id: string | number, payload: Record<string, any>) =>
    adminApi("POST", `/support/${id}/reply`, payload);

  const resolveThread = (id: string | number) =>
    adminApi("PUT", `/support/${id}`, { status: "resolved" });

  return (
    <AdminPageShell
      title="Support Tickets"
      description="Track and respond to customer support requests"
      contentClassName="space-y-6"
      mainClassName="admin-dashboard-shell"
    >
      <SupportThreadsPanel
        queryKey={["admin", "support"]}
        fetchThreads={fetchThreads}
        fetchThread={fetchThread}
        createThread={createThread}
        replyThread={replyThread}
        resolveThread={resolveThread}
        canCreate
        canResolve
        showTenant
        showUser
        showEscalation
        adminFields
      />
    </AdminPageShell>
  );
};

export default TicketsDashboard;
