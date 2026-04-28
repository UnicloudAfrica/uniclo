import TenantPageShell from "../components/TenantPageShell";
import { SupportThreadsPanel } from "@/shared/components/support";
import tenantApi from "../../index/tenant/tenantApi";
import silentTenantApi from "../../index/tenant/silentTenant";

interface SupportFilters {
  status?: string;
  search?: string;
  page?: number;
}

const buildQuery = (filters: SupportFilters = {}) => {
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
  const fetchThreads = (filters: SupportFilters) =>
    silentTenantApi("GET", `/admin/support${buildQuery(filters)}`) as Promise<
      Record<string, unknown> & { data?: unknown }
    >;

  const fetchThread = (id: string | number) =>
    silentTenantApi("GET", `/admin/support/${id}`) as Promise<
      Record<string, unknown> & { data?: unknown }
    >;

  const createThread = (payload: Record<string, unknown>) =>
    tenantApi("POST", "/admin/support", payload);

  const replyThread = (id: string | number, payload: Record<string, unknown>) =>
    tenantApi("POST", `/admin/support/${id}/reply`, payload);

  const resolveThread = (id: string | number) =>
    tenantApi("PUT", `/admin/support/${id}`, { status: "resolved" });

  return (
    <TenantPageShell
      title="Support Ticket"
      description="Raise and track support requests for your team and customers."
    >
      <SupportThreadsPanel
        queryKey={["tenant", "support"]}
        fetchThreads={fetchThreads as never}
        fetchThread={fetchThread as never}
        createThread={createThread as never}
        replyThread={replyThread as never}
        resolveThread={resolveThread as never}
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
