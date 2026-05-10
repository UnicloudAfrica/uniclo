import AdminPageShell from "../components/AdminPageShell";
import MigrationDashboard from "@/shared/components/migrations/MigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

/**
 * AdminMigrations — list of every workload migration across every tenant.
 * Wow layer: ResilienceHero gives admins a friendly, plain-English banner
 * over the existing dashboard. The dashboard internals stay untouched.
 */
export default function AdminMigrations() {
  return (
    <AdminPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero
        topic="migrations"
        role="admin"
        primaryCta={{
          label: "Start a migration",
          onClick: () => (window.location.href = "/admin-dashboard/migrations/new"),
        }}
      />
      <MigrationDashboard
        context="admin"
        wizardPath="/admin-dashboard/migrations/new"
      />
    </AdminPageShell>
  );
}
