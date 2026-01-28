import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import SharedInstanceList from "../../shared/components/instances/SharedInstanceList";

export default function AdminInstances() {
  return (
    <AdminPageShell
      title="Instance Management"
      description="Manage and monitor your cloud instances"
      contentClassName="space-y-6 lg:space-y-8"
    >
      <SharedInstanceList context="admin" />
    </AdminPageShell>
  );
}
