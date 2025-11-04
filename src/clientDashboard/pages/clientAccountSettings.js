import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import { Loader2 } from "lucide-react";
import ClientActiveTab from "../components/clientActiveTab";
import UserProfileSettings from "./settingsComp/userProfileSettings";
import TwoFactorAuth from "./settingsComp/twoFactorAuth";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientSettings() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("user-profile");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    {
      label: "User Profile",
      value: "user-profile",
      component: <UserProfileSettings />,
    },

    {
      label: "Two Factor Authentication",
      value: "2fa",
      component: <TwoFactorAuth />,
    },
  ];

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Account Settings"
        description="Manage your profile, authentication, and security preferences."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Settings" },
        ]}
        contentWrapper="div"
        contentClassName="pb-20 space-y-6"
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

          <div className="mt-6 w-full">
            {tabs.find((tab) => tab.value === activeTab).component}
          </div>
        </div>
      </ClientPageShell>
    </>
  );
}
