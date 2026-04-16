import AdminPageShell from "../components/AdminPageShell";
import MigrationCalculator from "@/shared/components/anycloudflow/MigrationCalculator";

const AdminMigrationCalculator = () => (
  <AdminPageShell title="Migration Calculator" description="Estimate costs for AnyCloudFlow migration, replication, and backup services.">
    <MigrationCalculator context="admin" />
  </AdminPageShell>
);

export default AdminMigrationCalculator;
