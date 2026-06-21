import React from "react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import { MoveMyEmailPanel } from "@/shared/components/integrations/mail-migration";

const TenantMoveMyEmail: React.FC = () => (
  <TenantPageShell
    title="Move My Email"
    description="Move email from one provider to another — Gmail, Microsoft 365, or any other email. We copy everything over and the old mailbox stays untouched."
  >
    <MoveMyEmailPanel />
  </TenantPageShell>
);

export default TenantMoveMyEmail;
