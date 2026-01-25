// @ts-nocheck
import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { SupportThreadsPanel } from "../../shared/components/support";
import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const ClientSupport: React.FC = () => {
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
        />
      </ClientPageShell>
    </>
  );
};

export default ClientSupport;
