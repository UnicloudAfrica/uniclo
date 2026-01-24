import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import AccountSettingsContent from "../../shared/components/settings/AccountSettingsContent";

export default function EnhancedProfileSettings() {
  return (
    <AdminPageShell>
      <AccountSettingsContent context="admin" />
    </AdminPageShell>
  );
}
