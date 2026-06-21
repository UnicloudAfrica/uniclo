import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import { MoveMyEmailPanel } from "@/shared/components/integrations/mail-migration";

const AdminMoveMyEmail: React.FC = () => (
  <AdminPageShell
    title="Move My Email"
    description="Move email from one provider to another — Gmail, Microsoft 365, or any other email. We copy everything over and the old mailbox stays untouched."
  >
    <MoveMyEmailPanel />
  </AdminPageShell>
);

export default AdminMoveMyEmail;
