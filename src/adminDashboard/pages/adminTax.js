import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { Loader2, Pencil, PlusCircle } from "lucide-react"; // Removed Trash2 as it's handled in EditTaxTypeModal
import ToastUtils from "../../utils/toastUtil";
import AddTaxTypeModal from "./taxComponents/addTax";
import EditTaxTypeModal from "./taxComponents/editTax";
import { useFetchTaxConfigurations } from "../../hooks/adminHooks/taxConfigurationHooks";

export default function AdminTax() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: taxConfigurations, isFetching: isTaxFetching } =
    useFetchTaxConfigurations();

  const [isAddTaxTypeModalOpen, setIsAddTaxTypeModalOpen] = useState(false);
  const [isEditTaxTypeModalOpen, setIsEditTaxTypeModalOpen] = useState(false); // Renamed state for new modal
  // const [isDeleteTaxRateModalOpen, setIsDeleteTaxRateModalOpen] = useState(false); // No longer needed

  const [selectedTaxType, setSelectedTaxType] = useState(null);
  // const [selectedCountryRate, setSelectedCountryRate] = useState(null); // No longer needed for direct modal opening

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleAddTaxType = () => {
    setIsAddTaxTypeModalOpen(true);
  };

  // New handler for editing a Tax Type (opens the new EditTaxTypeModal)
  const handleEditTaxType = (taxType) => {
    setSelectedTaxType(taxType);
    setIsEditTaxTypeModalOpen(true);
  };

  // handleDeleteTaxRate is no longer directly used by the main table
  // as rate deletion is handled within EditTaxTypeModal.
  // If you still need a separate delete modal for individual rates, you'd re-add this.
  // const handleDeleteTaxRate = (taxType, countryRate) => {
  //   setSelectedTaxType(taxType);
  //   setSelectedCountryRate(countryRate);
  //   setIsDeleteTaxRateModalOpen(true);
  // };

  const formatRate = (rate) => {
    if (rate === null || rate === undefined) return "N/A";
    return `${(parseFloat(rate) * 100).toFixed(2)}%`;
  };

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
          <button
            onClick={handleAddTaxType}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> Add Tax Type
          </button>
        </div>

        {isTaxFetching ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <p className="ml-2 text-gray-700">Loading tax configurations...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Tax Type
                    </th>
                    {/* Removed Slug column */}
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
                    taxConfigurations.map((taxType) =>
                      taxType.country_rates &&
                      taxType.country_rates.length > 0 ? (
                        taxType.country_rates.map((rate, index) => (
                          <tr
                            key={`${taxType.id}-${rate.id}`}
                            className="hover:bg-gray-50"
                          >
                            {index === 0 && ( // Only render tax type name once per group of rates
                              <td
                                rowSpan={taxType.country_rates.length}
                                className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal align-top"
                              >
                                {taxType.name || "N/A"}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                              {rate.country?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                              {formatRate(rate.rate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                              <div className="flex items-center space-x-3">
                                {/* Edit Tax Type button for the entire tax type */}
                                {index === 0 && ( // Show only once per tax type
                                  <button
                                    onClick={() => handleEditTaxType(taxType)}
                                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                                    title="Edit Tax Type"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {/* Removed individual rate delete button, as it's now handled in EditTaxTypeModal */}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Case where a tax type exists but has no country rates
                        <tr key={taxType.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {taxType.name || "N/A"}
                          </td>
                          <td
                            colSpan="2"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            {" "}
                            {/* Adjusted colspan */}
                            No rates configured for this tax type.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                            <button
                              onClick={() => handleEditTaxType(taxType)}
                              className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                              title="Edit Tax Type"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="4" // Adjusted colspan for no data
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No tax configurations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden mt-6 space-y-4">
              {taxConfigurations && taxConfigurations.length > 0 ? (
                taxConfigurations.map((taxType) => (
                  <div
                    key={taxType.id}
                    className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {taxType.name || "N/A"}
                      </h3>
                      <button
                        onClick={() => handleEditTaxType(taxType)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit Tax Type"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    {taxType.country_rates &&
                    taxType.country_rates.length > 0 ? (
                      taxType.country_rates.map((rate) => (
                        <div
                          key={rate.id}
                          className="border-t border-gray-100 pt-2 mt-2"
                        >
                          <div className="flex justify-between text-sm text-gray-600">
                            <span className="font-medium">Country:</span>
                            <span>{rate.country?.name || "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span className="font-medium">Rate:</span>
                            <span>{formatRate(rate.rate)}</span>
                          </div>
                          {/* Removed individual rate delete button from mobile card */}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        No rates configured for this tax type.
                      </p>
                    )}
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
      <EditTaxTypeModal
        isOpen={isEditTaxTypeModalOpen}
        onClose={() => setIsEditTaxTypeModalOpen(false)}
        taxType={selectedTaxType}
      />
      {/* DeleteTaxRateModal is no longer directly used */}
      {/* <DeleteTaxRateModal
        isOpen={isDeleteTaxRateModalOpen}
        onClose={() => setIsDeleteTaxRateModalOpen(false)}
        taxType={selectedTaxType}
        countryRate={selectedCountryRate}
      /> */}
    </>
  );
}
