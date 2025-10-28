import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import Pricing from "./productsComp/pricing";
import ProductCharge from "./productsComp/productCharge";
import ProductSideMenu from "./productsComp/sidemenu";

export default function Products() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const [activeProductTab, setActiveProductTab] = useState("tenant-pricing");
  const [activeProductType, setActiveProductType] = useState("");

  const productComponents = [
    {
      id: "tenant-pricing",
      name: "Tenant Pricing",
      Component: Pricing,
    },
  ];

  const handleProductTabChange = (tabId) => {
    setActiveProductTab(tabId);
    setActiveProductType(""); // Reset product type when switching tabs
  };

  const handleProductTypeChange = (productType) => {
    setActiveProductType(productType);
  };

  const ActiveComponent = productComponents.find(
    (product) => product.id === activeProductTab
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8 flex flex-col lg:flex-row">
        <ProductSideMenu
          activeTab={activeProductTab}
          activeProductType={activeProductType}
          onTabChange={handleProductTabChange}
          onProductTypeChange={handleProductTypeChange}
        />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
          <div className="bg-[#288DD10D] text-[#288DD1] p-3 rounded-md mb-4 text-sm">
            Some prices have changed. Please resync to view the latest pricing.
          </div>
          {ActiveComponent ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {ActiveComponent.name}
                {activeProductType && (
                  <span className="text-base font-normal text-gray-600 ml-2">
                    - {activeProductType.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                )}
              </h2>
              <ActiveComponent.Component
                activeProductType={activeProductType}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>Select a category from the menu.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
