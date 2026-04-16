import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldAttackMap } from "@/shared/components/shield";

const TenantShieldAttackMap: React.FC = () => {
  return (
    <TenantPageShell
      title="Attack Map"
      description="Live DDoS attack visualization and analytics"
      contentClassName="space-y-6"
    >
      <ShieldAttackMap />
    </TenantPageShell>
  );
};

export default TenantShieldAttackMap;
