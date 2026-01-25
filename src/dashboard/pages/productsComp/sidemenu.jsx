import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useFetchPricing } from "../../../hooks/pricingHooks";

const ProductSideMenu = ({ activeTab, activeProductType, onTabChange, onProductTypeChange }) => {
  const { data: pricing, isFetching: isPricingFetching } = useFetchPricing();

  const tabs = [{ id: "tenant-pricing", name: "Tenant Pricing" }];

  const productTypes = useMemo(() => {
    if (pricing && activeTab === "tenant-pricing") {
      return Object.keys(pricing);
    }
    return [];
  }, [pricing, activeTab]);

  return (
    <div className="w-full lg:w-[20%] bg-[--theme-card-bg] rounded-lg shadow-sm p-4 lg:p-6 flex flex-col space-y-2 mb-6 lg:mb-0 lg:mr-6">
      <h3 className="text-lg font-semibold text-[--theme-heading-color] mb-2">Products</h3>
      <nav className="flex flex-col space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-full text-left px-3 py-2 whitespace-nowrap rounded-md transition-colors text-sm duration-200
              ${
                activeTab === tab.id
                  ? "bg-[--theme-color-10] text-[--theme-heading-color] font-medium"
                  : "text-[--theme-muted-color] hover:bg-[--theme-color-10] hover:text-[--theme-heading-color]"
              }
            `}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {activeTab === "tenant-pricing" && (
        <div className="mt-4 pt-4 border-t border-[--theme-border-color]">
          <h4 className="text-sm font-medium text-[--theme-text-color] mb-2">Product Types</h4>
          {isPricingFetching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-[--theme-color] animate-spin" />
              <span className="ml-2 text-sm text-[--theme-muted-color]">Loading...</span>
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
                        ? "bg-[--theme-color] text-white"
                        : "text-[--theme-muted-color] hover:bg-[--theme-color-10] hover:text-[--theme-heading-color]"
                    }
                  `}
                >
                  {type.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </nav>
          ) : (
            <div className="text-sm text-[--theme-muted-color] py-2">
              No product types available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSideMenu;
