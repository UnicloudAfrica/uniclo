/**
 * TenantAccounting — Thin wrapper around AdminAccounting that swaps the
 * admin shell for the tenant shell. The hooks themselves auto-select the
 * tenant URL prefix from `apiRegistry`, so the same component renders
 * tenant-scoped reports without any special-casing here.
 */
import AdminAccounting from "../../adminDashboard/pages/AdminAccounting";

const TenantAccounting: React.FC = () => {
  return <AdminAccounting mode="tenant" />;
};

export default TenantAccounting;
