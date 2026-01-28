import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import { SupportThreadsPanel } from "../../shared/components/support";
import tenantApi from "../../index/tenant/tenantApi";
import silentTenantApi from "../../index/tenant/silentTenant";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  params.set("per_page", "15");
  const query = params.toString();
  return query ? `?${query}` : "";
};

import { useNavigate } from "react-router-dom";

export default function SupportTicket() {
  const navigate = useNavigate();
  const fetchThreads = (filters) => silentTenantApi("GET", `/admin/support${buildQuery(filters)}`);

  const fetchThread = (id) => silentTenantApi("GET", `/admin/support/${id}`);

  const createThread = (payload) => tenantApi("POST", "/admin/support", payload);

  const replyThread = (id, payload) => tenantApi("POST", `/admin/support/${id}/reply`, payload);

  const resolveThread = (id) => tenantApi("PUT", `/admin/support/${id}`, { status: "resolved" });

  return (
    <TenantPageShell
      title="Support Ticket"
      description="Raise and track support requests for your team and customers."
    >
      <SupportThreadsPanel
        queryKey={["tenant", "support"]}
        fetchThreads={fetchThreads}
        fetchThread={fetchThread}
        createThread={createThread}
        replyThread={replyThread}
        resolveThread={resolveThread}
        canCreate
        canResolve
        showUser
        showEscalation
        emptyMessage="No support tickets found for your tenant."
        onView={(thread) => navigate(`/dashboard/support/${thread.uuid || thread.id}`)}
      />
    </TenantPageShell>
  );
}
