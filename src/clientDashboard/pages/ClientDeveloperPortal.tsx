import ClientPageShell from "../components/ClientPageShell";
import { DeveloperPortalContent } from "@/shared/components/developer";

const ClientDeveloperPortal = () => {
  return (
    <ClientPageShell title="Developer Portal">
      <DeveloperPortalContent context="client" />
    </ClientPageShell>
  );
};

export default ClientDeveloperPortal;
