import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import LaunchSideMenu from "./launchComps/launchSideMenu";

export default function ClientLaunch() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8">
        <div className="flex flex-col lg:flex-row w-full">
          <LaunchSideMenu />
          <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
            {/* active component goes here  */}
          </div>
        </div>
      </main>
    </>
  );
}
