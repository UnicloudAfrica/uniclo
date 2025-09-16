import React, { useState, useEffect } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ProductSideMenu from "./inventoryComponents/productssidemenu";
import BandWidth from "./inventoryComponents/bandwidth";
import OSImages from "./inventoryComponents/osImages";
import EBSImages from "./inventoryComponents/ebsImages";
import Vms from "./inventoryComponents/vms";
// import ColocationSetting from "./productsComponents/colocation";
import FloatingIP from "./inventoryComponents/floatingIP";
import CrossConnect from "./inventoryComponents/crossConnect";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { ChevronDown } from "lucide-react";
import ColocationSetting from "./inventoryComponents/colocation";
// import ColocationSetting from "./productsComponents/colocation";

export default function AdminInventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState("os-image");
  const [selectedRegion, setSelectedRegion] = useState("");
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();

  useEffect(() => {
    if (
      !isRegionsFetching &&
      regions &&
      regions.length > 0 &&
      !selectedRegion
    ) {
      setSelectedRegion(regions[0].code);
    }
  }, [isRegionsFetching, regions, selectedRegion]);

  const productComponents = [
    { id: "bandwidth", name: "Bandwidth Management", Component: BandWidth },
    { id: "os-image", name: "OS Images Management", Component: OSImages },
    { id: "ebs-volumes", name: "EBS Volumes Management", Component: EBSImages },
    { id: "vms", name: "VMs Management", Component: Vms },
    {
      id: "colocation",
      name: "Colocation Management",
      Component: ColocationSetting,
    },
    { id: "ips", name: "Floating IP Management", Component: FloatingIP },
    {
      id: "cross-connect",
      name: "Cross Connect Management",
      Component: CrossConnect,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleProductTabChange = (tabId) => {
    setActiveProductTab(tabId);
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
  };

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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="flex justify-end mb-4">
          <div className="relative w-full max-w-[200px]">
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-[#288DD1] focus:border-[#288DD1] text-sm"
              disabled={isRegionsFetching}
            >
              {isRegionsFetching ? (
                <option value="" disabled>
                  Loading regions...
                </option>
              ) : (
                regions?.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row w-full">
          <ProductSideMenu
            activeTab={activeProductTab}
            onTabChange={handleProductTabChange}
          />
          <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
            {ActiveComponent && !isRegionsFetching ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {ActiveComponent.name}
                </h2>
                <ActiveComponent.Component selectedRegion={selectedRegion} />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>
                  {isRegionsFetching
                    ? "Loading regions..."
                    : "Select a product category from the menu."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
