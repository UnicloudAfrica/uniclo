// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { SupportThreadsPanel } from "../../shared/components/support";
import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  params.set("per_page", "15");
  const query = params.toString();
  return query ? `?${query}` : "";
};

const ClientSupport: React.FC = () => {
  const navigate = useNavigate();

  const fetchThreads = (filters) =>
    clientSilentApi("GET", `/business/support${buildQuery(filters)}`);

  const fetchThread = (id) => clientSilentApi("GET", `/business/support/${id}`);

  const createThread = (payload) => clientApi("POST", "/business/support", payload);

  const replyThread = (id, payload) => clientApi("POST", `/business/support/${id}/reply`, payload);

  const resolveThread = (id) => clientApi("PUT", `/business/support/${id}`, { status: "resolved" });

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Support"
        description="Get help from our support team whenever you need it."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Support" }]}
      >
        <SupportThreadsPanel
          queryKey={["client", "support"]}
          fetchThreads={fetchThreads}
          fetchThread={fetchThread}
          createThread={createThread}
          replyThread={replyThread}
          resolveThread={resolveThread}
          canCreate
          canResolve
          showUser
          showEscalation
          emptyMessage="No support tickets yet."
          onView={(thread) => navigate(`/client-dashboard/support/${thread.uuid || thread.id}`)}
        />
      </ClientPageShell>
    </>
  );
};

export default ClientSupport;
