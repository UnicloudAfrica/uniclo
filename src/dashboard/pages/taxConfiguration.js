import React, { useState, useMemo, useEffect } from "react";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { useFetchTaxConfigurations } from "../../hooks/taxHooks";
import AddTaxTypeModal from "./taxComps/addTax";
import DeleteTaxConfigModal from "./taxComps/deleteTax";

export default function DashboardTaxConfigurations() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: taxConfigurations, isFetching: isTaxFetching } =
    useFetchTaxConfigurations();

  const [isAddTaxTypeModalOpen, setIsAddTaxTypeModalOpen] = useState(false);
  const [isDeleteTaxConfigModalOpen, setIsDeleteTaxConfigModalOpen] =
    useState(false);
  const [selectedTaxConfig, setSelectedTaxConfig] = useState(null);
  const [activeCountryTab, setActiveCountryTab] = useState("");

  const groupedTaxConfigurations = useMemo(() => {
    if (!taxConfigurations) return {};
    const grouped = {};
    taxConfigurations.forEach((countryData) => {
      const countryName = countryData.country || "Unknown Country";
      grouped[countryName] = countryData;
    });
    return grouped;
  }, [taxConfigurations]);

  useEffect(() => {
    if (Object.keys(groupedTaxConfigurations).length > 0) {
      setActiveCountryTab(Object.keys(groupedTaxConfigurations)[0]);
    } else {
      setActiveCountryTab("");
    }
  }, [groupedTaxConfigurations]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleAddTaxType = () => {
    setIsAddTaxTypeModalOpen(true);
  };

  const handleDeleteTaxConfig = (taxConfig) => {
    setSelectedTaxConfig(taxConfig);
    setIsDeleteTaxConfigModalOpen(true);
  };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined) return "N/A";
    const numericRate = parseFloat(String(rate).replace("%", ""));
    return `${numericRate.toFixed(2)}%`;
  };

  const currentCountryTaxes = useMemo(() => {
    const selectedCountryData = groupedTaxConfigurations[activeCountryTab];
    return selectedCountryData ? selectedCountryData.taxes : [];
  }, [groupedTaxConfigurations, activeCountryTab]);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleAddTaxType}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> Add Tax Rate
          </button>
        </div>

        {isTaxFetching ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <p className="ml-2 text-gray-700">Loading tax configurations...</p>
          </div>
        ) : !taxConfigurations || taxConfigurations.length === 0 ? (
          <div className="w-full text-center py-8 text-gray-600">
            No configurations found.
          </div>
        ) : (
          <>
            {Object.keys(groupedTaxConfigurations).length > 0 && (
              <div className="flex border-b w-full border-[#EAECF0] mb-6 overflow-x-auto whitespace-nowrap">
                {Object.keys(groupedTaxConfigurations).map((countryName) => (
                  <button
                    key={countryName}
                    className={`font-medium text-sm pb-4 px-4 transition-all ${
                      activeCountryTab === countryName
                        ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                        : "text-[#1C1C1C] hover:text-[#288DD1]"
                    }`}
                    onClick={() => setActiveCountryTab(countryName)}
                  >
                    {countryName}
                  </button>
                ))}
              </div>
            )}

            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
              {currentCountryTaxes.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-[#F5F5F5]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        Tax Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E8E6EA]">
                    {currentCountryTaxes.map((tax) => (
                      <tr
                        key={`${activeCountryTab}-${tax.slug}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {tax.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {activeCountryTab || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {formatRate(tax.rate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDeleteTaxConfig(tax)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete Tax Configuration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-4 text-center text-sm text-gray-500 bg-white">
                  No tax configurations found for {activeCountryTab}.
                </div>
              )}
            </div>

            <div className="md:hidden mt-6 space-y-4">
              {currentCountryTaxes.length > 0 ? (
                currentCountryTaxes.map((tax) => (
                  <div
                    key={`${activeCountryTab}-${tax.slug}`}
                    className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {tax.name || "N/A"}
                      </h3>
                      <button
                        onClick={() => handleDeleteTaxConfig(tax)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Tax Configuration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="font-medium">Country:</span>
                        <span>{activeCountryTab || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="font-medium">Rate:</span>
                        <span>{formatRate(tax.rate)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
                  No tax configurations found for {activeCountryTab}.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <AddTaxTypeModal
        isOpen={isAddTaxTypeModalOpen}
        onClose={() => setIsAddTaxTypeModalOpen(false)}
      />
      <DeleteTaxConfigModal
        isOpen={isDeleteTaxConfigModalOpen}
        onClose={() => setIsDeleteTaxConfigModalOpen(false)}
        taxConfig={selectedTaxConfig}
      />
    </>
  );
}
