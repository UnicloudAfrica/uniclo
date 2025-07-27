import React from "react";

const ProductSideMenu = ({ activeTab, onTabChange }) => {
  // Define the tabs as an array of objects
  const tabs = [
    { id: "product-charge", name: "Product Charge" },
    { id: "tenant-pricing", name: "Tenant Pricing" },
  ];

  return (
    <div className="w-full lg:w-[20%] bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col space-y-2 mb-6 lg:mb-0 lg:mr-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Products</h3>
      <nav className="flex flex-col space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-full text-left px-3 py-2 whitespace-nowrap rounded-md transition-colors text-sm duration-200
              ${
                activeTab === tab.id
                  ? "bg-gray-50 text-[#1c1c1c] font-medium"
                  : "text-[#676767] hover:bg-gray-100"
              }
            `}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ProductSideMenu;
