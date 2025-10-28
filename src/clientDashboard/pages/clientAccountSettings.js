import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import { Loader2 } from "lucide-react";
import ClientActiveTab from "../components/clientActiveTab";
import UserProfileSettings from "./settingsComp/userProfileSettings";
import TwoFactorAuth from "./settingsComp/twoFactorAuth";

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
      <main className="dashboard-content-shell p-6 md:p-8 pb-20">
        {/* {authLoading ? (
          <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center">
            <Loader2 className="w-12 text-[#288DD1] animate-spin" />
          </div>
        ) : ( */}
        <div className="w-full mx-auto">
          <div className="flex border-b w-full border-[#EAECF0] mb-6 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`font-medium text-sm pb-4 px-4 transition-all ${
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

          <div className="w-full mt-6">
            {tabs.find((tab) => tab.value === activeTab).component}
          </div>
        </div>
        {/* )} */}
      </main>
    </>
  );
}
