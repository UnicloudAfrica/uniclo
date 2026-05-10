import ClientPageShell from "../components/ClientPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";
import { ResilienceHero } from "@/shared/components/orbit";
import type React from "react";

const ClientProtection: React.FC = () => {
  const HeroShell: React.ComponentType<{
    title: string;
    description?: string;
    children?: React.ReactNode;
  }> = ({ children }) => (
    <ClientPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="replication-policies" role="client" />
      {children}
    </ClientPageShell>
  );

  return (
    <ProtectionLanding
      PageShell={HeroShell}
      context="client"
      basePath="/client-dashboard"
      description=""
    />
  );
};

export default ClientProtection;
