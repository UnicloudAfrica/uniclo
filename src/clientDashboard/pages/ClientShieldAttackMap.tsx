import ClientPageShell from "../components/ClientPageShell";
import { ShieldAttackMap } from "@/shared/components/shield";

const ClientShieldAttackMap: React.FC = () => {
  return (
    <ClientPageShell
      title="Attack Map"
      description="Live DDoS attack visualization and analytics"
      contentClassName="space-y-6"
    >
      <ShieldAttackMap />
    </ClientPageShell>
  );
};

export default ClientShieldAttackMap;
