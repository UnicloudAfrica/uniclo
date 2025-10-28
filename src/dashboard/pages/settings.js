import React, { useState } from "react";
import useAuthRedirect from "../../utils/authRedirect";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import { Loader2 } from "lucide-react";
import UserProfileSettings from "./settingsComp/userProfileSettings";
import TenantProfileSettings from "./settingsComp/tenantProfileSettings";
import DomainManagementSettings from "./settingsComp/domainManagementSettings";

export default function Settings() {
  const { isLoading: authLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("user-profile"); // Default to 'user-profile'

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
      label: "Tenant Profile",
      value: "tenant-profile",
      component: <TenantProfileSettings />,
    },
    {
      label: "Domain Management",
      value: "domain-management",
      component: <DomainManagementSettings />,
    },
  ];

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8 pb-20">
        {authLoading ? (
          <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center">
            <Loader2 className="w-12 text-[#288DD1] animate-spin" />
          </div>
        ) : (
          <div className="w-full mx-auto">
            <div className="flex border-b w-full border-[#EAECF0] mb-6 overflow-x-auto whitespace-nowrap">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`font-medium text-sm pb-4 px-4 transition-all ${
                    activeTab === tab.value
                      ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                      : "text-[#1C1C1C] hover:text-[#288DD1]"
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
        )}
      </main>
    </>
  );
}
