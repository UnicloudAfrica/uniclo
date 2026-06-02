import React from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import EmptyState from "@/shared/components/ui/EmptyState";

const ClientShieldAnalytics: React.FC = () => {
  return (
    <ClientPageShell
      title="Traffic Analytics"
      description="Traffic statistics for your protected domains"
      contentClassName="space-y-6"
    >
      <EmptyState
        icon={<BarChart3 size={28} />}
        title="Select a domain to view its analytics"
        description="Traffic analytics are scoped to a single protected domain. Choose a domain from the Domains page to see its request, bandwidth, and threat statistics."
        action={
          <Link
            to="/client-dashboard/shield/domains"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-color)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Go to Domains
          </Link>
        }
      />
    </ClientPageShell>
  );
};

export default ClientShieldAnalytics;
