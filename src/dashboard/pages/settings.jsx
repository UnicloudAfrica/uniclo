import React from "react";
import TenantPageShell from "../components/TenantPageShell";

const Settings = () => {
  return (
    <TenantPageShell
      title="Account Settings"
      description="Manage your profile, business information, and security preferences."
    >
      {/* Settings content will be added here */}
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        <p>Settings page content coming soon.</p>
      </div>
    </TenantPageShell>
  );
};

export default Settings;
