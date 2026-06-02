import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import EmptyState from "@/shared/components/ui/EmptyState";

const ClientShieldAttacks: React.FC = () => {
  return (
    <ClientPageShell
      title="Attack History"
      description="Recorded attacks for your protected domains"
      contentClassName="space-y-6"
    >
      <EmptyState
        icon={<ShieldAlert size={28} />}
        title="Select a domain to view its attack history"
        description="Attack records are scoped to a single protected domain. Choose a domain from the Domains page to review its detected and mitigated attacks."
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

export default ClientShieldAttacks;
