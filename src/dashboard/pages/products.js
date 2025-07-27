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

  const [activeProductTab, setActiveProductTab] = useState("product-charge"); // Default active tab

  // Define an array of product components for scalability
  const productComponents = [
    { id: "product-charge", name: "Product Charge", Component: ProductCharge },
    {
      id: "tenant-pricing",
      name: "Tenant Pricing",
      Component: Pricing,
    },
  ];

  const handleProductTabChange = (tabId) => {
    setActiveProductTab(tabId);
  };

  // Find the currently active component based on activeProductTab
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
              <p>Select a category from the menu.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
