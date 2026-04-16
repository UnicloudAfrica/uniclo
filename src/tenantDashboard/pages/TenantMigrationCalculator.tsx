import TenantPageShell from "@/shared/layouts/TenantPageShell";
import MigrationCalculator from "@/shared/components/anycloudflow/MigrationCalculator";

const TenantMigrationCalculator = () => (
  <TenantPageShell title="Migration Calculator" description="Estimate costs for migration, replication, and backup services.">
    <MigrationCalculator context="tenant" />
  </TenantPageShell>
);

export default TenantMigrationCalculator;
