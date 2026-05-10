import AdminPageShell from "../components/AdminPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";
import { ResilienceHero } from "@/shared/components/orbit";
import type React from "react";

/**
 * AdminProtection — replication policies surface (Resilience > Replication
 * Policies in the sidebar). Wraps ProtectionLanding with the friendly
 * Orbit hero so admins land on plain-English context first.
 */
export default function AdminProtection() {
  // Page-shell adapter that injects the hero ahead of ProtectionLanding's body.
  const HeroShell: React.ComponentType<{
    title: string;
    description?: string;
    children?: React.ReactNode;
  }> = ({ children }) => (
    <AdminPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="replication-policies" role="admin" />
      {children}
    </AdminPageShell>
  );

  return (
    <ProtectionLanding
      PageShell={HeroShell}
      context="admin"
      basePath="/admin-dashboard"
      description=""
    />
  );
}
