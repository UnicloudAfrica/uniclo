import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminActiveTab from "../components/adminActiveTab";
import PricingSideMenu from "../components/pricingSideMenu";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchProductPricing } from "../../hooks/adminHooks/adminproductPricingHook";
import { useFetchProducts } from "../../hooks/adminHooks/adminProductHooks";
import { ChevronDown } from "lucide-react";
import AddProductPricing from "./productPricingComps/addProductPricing";

export default function AdminPricing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const {
    isFetching: isPricingFetching,
    data: pricing,
    error,
    refetch,
  } = useFetchProductPricing(selectedCountryCode, selectedProvider, {
    enabled: !isRegionsFetching,
  });
  const { isFetching: isProductsFetching, data: products } = useFetchProducts();

  const [isAddProductPricingOpen, setAddProductPricing] = useState(false);
  const openAddProductPricing = () => setAddProductPricing(true);
  const closeAddProductPricing = () => setAddProductPricing(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
    const region = regions?.find((r) => r.code === regionCode);
    if (region) {
      setSelectedCountryCode(region.country_code);
      setSelectedProvider(region.provider);
    } else {
      setSelectedCountryCode("");
      setSelectedProvider("");
    }
  };

  // Refetch pricing when region changes
  useEffect(() => {
    if (!isRegionsFetching) {
      refetch();
    }
  }, [selectedCountryCode, selectedProvider, isRegionsFetching, refetch]);

  // Map product names to pricing data
  const pricingWithNames = pricing?.map((item) => ({
    ...item,
    name:
      products?.find((p) => p.id === item.productable_id)?.name || "Unnamed",
  }));

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
              <option value="">All Regions</option>
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
        <div className="w-full flex flex-col lg:flex-row">
          <PricingSideMenu />
          <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Pricing</h2>
              <button
                onClick={openAddProductPricing}
                className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
              >
                Add Product Pricing
              </button>
            </div>
            <>
              {isRegionsFetching || isPricingFetching || isProductsFetching ? (
                <div className="text-center text-gray-500 py-10">
                  <p>Loading pricing...</p>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-10">
                  <p>Error loading pricing</p>
                </div>
              ) : pricingWithNames && pricingWithNames.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#F2F2F2] text-gray-700">
                          <th className="text-left p-4 font-medium">
                            Product Name
                          </th>
                          <th className="text-left p-4 font-medium">
                            Price (USD)
                          </th>
                          <th className="text-left p-4 font-medium">Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingWithNames.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="p-4 text-gray-700">
                              {item.product_name}
                            </td>
                            <td className="p-4 text-gray-700">
                              ${parseFloat(item.price_usd).toFixed(2) || "N/A"}
                            </td>
                            <td className="p-4 text-gray-700">{item.region}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {pricingWithNames.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <h3 className="text-lg font-medium text-gray-800">
                          {item.product_name}
                        </h3>
                        <p className="text-gray-600">
                          Price: $
                          {parseFloat(item.price_usd).toFixed(2) || "N/A"}
                        </p>
                        <p className="text-gray-600">Region: {item.region}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  <p>
                    No pricing data found
                    {selectedRegion ? " for this region" : ""}.
                  </p>
                </div>
              )}
            </>
          </div>
        </div>
      </main>
      <AddProductPricing
        isOpen={isAddProductPricingOpen}
        onClose={closeAddProductPricing}
      />
    </>
  );
}
