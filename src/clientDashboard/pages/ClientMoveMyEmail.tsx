import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import { MoveMyEmailPanel } from "@/shared/components/integrations/mail-migration";

const ClientMoveMyEmail: React.FC = () => (
  <ClientPageShell
    title="Move My Email"
    description="Move your email from one provider to another — Gmail, Microsoft 365, or any other email. We copy everything over and your old mailbox stays untouched."
    contentClassName="space-y-6"
  >
    <MoveMyEmailPanel />
  </ClientPageShell>
);

export default ClientMoveMyEmail;
