import AdminPageShell from "../components/AdminPageShell";
import { ShieldAttackMap } from "@/shared/components/shield";

export default function AdminShieldAttackMap() {
  return (
    <AdminPageShell
      title="Attack Map"
      description="Live DDoS attack visualization and analytics"
      contentClassName="space-y-6"
    >
      <ShieldAttackMap />
    </AdminPageShell>
  );
}
