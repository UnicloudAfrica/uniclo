import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import EmptyState from "@/shared/components/ui/EmptyState";

const ClientShieldSsl: React.FC = () => {
  return (
    <ClientPageShell
      title="SSL Certificates"
      description="SSL certificate management for your protected domains"
      contentClassName="space-y-6"
    >
      <EmptyState
        icon={<Lock size={28} />}
        title="Select a domain to manage its SSL certificate"
        description="SSL certificates are managed per protected domain. Choose a domain from the Domains page to provision or upload a certificate."
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

export default ClientShieldSsl;
