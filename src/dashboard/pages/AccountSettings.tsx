import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import AccountSettingsContent from "../../shared/components/settings/AccountSettingsContent";

const TenantAccountSettings: React.FC = () => {
  return (
    <TenantPageShell
      title="Account Settings"
      description="Manage your profile, preferences, and notifications in one place."
    >
      <AccountSettingsContent context="tenant" />
    </TenantPageShell>
  );
};

export default TenantAccountSettings;
