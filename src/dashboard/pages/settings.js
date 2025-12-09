import React, { useState } from "react";
import TenantPageShell from "../components/TenantPageShell";
import NotificationPreferencesSection from "../../shared/components/NotificationPreferencesSection";
// @ts-ignore
import UserProfileSettings from "./settingsComp/userProfileSettings";
// @ts-ignore
import TenantProfileSettings from "./settingsComp/tenantProfileSettings";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user-profile");

  const tabs = [
    {
      label: "User Profile",
      value: "user-profile",
      component: <UserProfileSettings />,
    },
    {
      label: "Business Profile",
      value: "business-profile",
      component: <TenantProfileSettings />,
    },
    {
      label: "Notifications",
      value: "notifications",
      component: <NotificationPreferencesSection className="mt-4" />,
    },
  ];

  return (
    <TenantPageShell
      title="Account Settings"
      description="Manage your profile, business information, and security preferences."
    >
      <div className="mx-auto w-full">
        <div className="mb-6 flex w-full overflow-x-auto whitespace-nowrap border-b border-[#EAECF0]">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`px-4 pb-4 text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? "border-b-2 border-[--theme-color] text-[--theme-color]"
                  : "text-[#1C1C1C] hover:text-[--theme-color]"
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 w-full">{tabs.find((tab) => tab.value === activeTab)?.component}</div>
      </div>
    </TenantPageShell>
  );
};

export default Settings;
