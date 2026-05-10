import TenantPageShell from "../components/TenantPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";
import { ResilienceHero } from "@/shared/components/orbit";
import type React from "react";

const TenantProtection: React.FC = () => {
  const HeroShell: React.ComponentType<{
    title: string;
    description?: string;
    children?: React.ReactNode;
  }> = ({ children }) => (
    <TenantPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="replication-policies" role="tenant" />
      {children}
    </TenantPageShell>
  );

  return (
    <ProtectionLanding
      PageShell={HeroShell}
      context="tenant"
      basePath="/dashboard"
      description=""
    />
  );
};

export default TenantProtection;
