import React, { useState } from "react";
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleAddTaxType = () => {
    setIsAddTaxTypeModalOpen(true);
  };

  // Handler to open the delete confirmation modal
  const handleDeleteTaxConfig = (taxConfig) => {
    setSelectedTaxConfig(taxConfig);
    setIsDeleteTaxConfigModalOpen(true);
  };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined) return "N/A";
    return `${parseFloat(rate).toFixed(2)}%`;
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
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
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
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
                  {taxConfigurations && taxConfigurations.length > 0 ? (
                    taxConfigurations.map((config) => (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {config.tax_type?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {config.country?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {formatRate(config.rate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDeleteTaxConfig(config)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete Tax Configuration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No tax configurations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden mt-6 space-y-4">
              {taxConfigurations && taxConfigurations.length > 0 ? (
                taxConfigurations.map((config) => (
                  <div
                    key={config.id}
                    className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {config.tax_type?.name || "N/A"}
                      </h3>
                      <button
                        onClick={() => handleDeleteTaxConfig(config)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Tax Configuration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="font-medium">Country:</span>
                        <span>{config.country?.name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="font-medium">Rate:</span>
                        <span>{formatRate(config.rate)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
                  No tax configurations found.
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
      {/*
      <EditTaxTypeModal
        isOpen={isEditTaxTypeModalOpen}
        onClose={() => setIsEditTaxTypeModalOpen(false)}
        taxConfig={selectedTaxConfig}
      />
      */}
      <DeleteTaxConfigModal
        isOpen={isDeleteTaxConfigModalOpen}
        onClose={() => setIsDeleteTaxConfigModalOpen(false)}
        taxConfig={selectedTaxConfig}
      />
    </>
  );
}
