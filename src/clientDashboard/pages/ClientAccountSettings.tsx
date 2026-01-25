import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import AccountSettingsContent from "../../shared/components/settings/AccountSettingsContent";

const ClientAccountSettings: React.FC = () => {
  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Account Settings"
        description="Manage your profile, preferences, and notifications in one place."
      >
        <AccountSettingsContent context="client" />
      </ClientPageShell>
    </>
  );
};

export default ClientAccountSettings;
