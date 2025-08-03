import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ProductSideMenu from "./productsComponents/productssidemenu";
import BandWidth from "./productsComponents/bandwidth";
import OSImages from "./productsComponents/osImages";
import EBSImages from "./productsComponents/ebsImages";
import Vms from "./productsComponents/vms";
import ColocationSetting from "./productsComponents/colocation";
import FloatingIP from "./productsComponents/floatingIP";
import CrossConnect from "./productsComponents/crossConnect";

export default function AdminProducts() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState("os-image"); // Default active tab

  // Define an array of product components for scalability
  const productComponents = [
    { id: "bandwidth", name: "Bandwidth Management", Component: BandWidth },
    { id: "os-image", name: "OS Images Management", Component: OSImages },
    { id: "ebs-volumes", name: "EBS Volumes Management", Component: EBSImages },
    { id: "vms", name: "VMs Management", Component: Vms },
    {
      id: "colocation ",
      name: "Colocation  Management",
      Component: ColocationSetting,
    },
    { id: "ips", name: "Floating IP Management", Component: FloatingIP },
    {
      id: "cross-connect",
      name: "Cross Connect Management",
      Component: CrossConnect,
    },
  ];

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleProductTabChange = (tabId) => {
    setActiveProductTab(tabId);
  };

  // Find the currently active component based on activeProductTab
  const ActiveComponent = productComponents.find(
    (product) => product.id === activeProductTab
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex flex-col lg:flex-row">
        {/* Side Menu */}
        <ProductSideMenu
          activeTab={activeProductTab}
          onTabChange={handleProductTabChange}
        />

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
          {ActiveComponent ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {ActiveComponent.name}
              </h2>
              <ActiveComponent.Component />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>Select a product category from the menu.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
