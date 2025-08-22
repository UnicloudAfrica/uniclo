import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useFetchPricing } from "../../../hooks/pricingHooks";

const ProductSideMenu = ({
  activeTab,
  activeProductType,
  onTabChange,
  onProductTypeChange,
}) => {
  const { data: pricing, isFetching: isPricingFetching } = useFetchPricing();

  const tabs = [{ id: "tenant-pricing", name: "Tenant Pricing" }];

  const productTypes = useMemo(() => {
    if (pricing && activeTab === "tenant-pricing") {
      return Object.keys(pricing);
    }
    return [];
  }, [pricing, activeTab]);

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

      {activeTab === "tenant-pricing" && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Product Types
          </h4>
          {isPricingFetching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-[#288DD1] animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          ) : productTypes.length > 0 ? (
            <nav className="flex flex-col space-y-1">
              {productTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => onProductTypeChange(type)}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-200
                    ${
                      activeProductType === type
                        ? "bg-[#288DD1] text-white"
                        : "text-[#676767] hover:bg-gray-100"
                    }
                  `}
                >
                  {type.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </nav>
          ) : (
            <div className="text-sm text-gray-500 py-2">
              No product types available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSideMenu;
