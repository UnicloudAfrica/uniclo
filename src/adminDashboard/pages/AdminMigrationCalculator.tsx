import AdminPageShell from "../components/AdminPageShell";
import MigrationCalculator from "@/shared/components/anycloudflow/MigrationCalculator";
import { ResilienceHero } from "@/shared/components/orbit";

const AdminMigrationCalculator = () => (
  <AdminPageShell title="" description="" contentClassName="space-y-6">
    <ResilienceHero topic="migration-calculator" role="admin" />
    <MigrationCalculator context="admin" />
  </AdminPageShell>
);

export default AdminMigrationCalculator;
