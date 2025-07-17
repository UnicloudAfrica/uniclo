import React, { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchBandwidthProducts } from "../../../hooks/adminHooks/bandwidthHooks";
import AddBandwidthModal from "./bandwidthSubs/addBandWidth";
import EditBandwidthModal from "./bandwidthSubs/editBandwidth";
import DeleteBandwidthModal from "./bandwidthSubs/deleteBandWidth";

const BandWidth = () => {
  const { data: bandwidths, isFetching: isBandWidthsFetching } =
    useFetchBandwidthProducts();

  const [isAddBandwidthModalOpen, setIsAddBandwidthModalOpen] = useState(false);
  const [isEditBandwidthModalOpen, setIsEditBandwidthModalOpen] =
    useState(false);
  const [isDeleteBandwidthModalOpen, setIsDeleteBandwidthModalOpen] =
    useState(false);
  const [selectedBandwidth, setSelectedBandwidth] = useState(null); // To pass data to modals

  const handleAddBandwidth = () => {
    setIsAddBandwidthModalOpen(true);
  };

  const handleEditBandwidth = (bandwidth) => {
    setSelectedBandwidth(bandwidth);
    setIsEditBandwidthModalOpen(true);
  };

  const handleDeleteBandwidth = (bandwidth) => {
    setSelectedBandwidth(bandwidth);
    setIsDeleteBandwidthModalOpen(true);
  };

  // Function to format currency to USD
  const formatCurrency = (amount, currency = "USD") => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  if (isBandWidthsFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading bandwidth products...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddBandwidth}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add Bandwidth
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
        <table className="w-full">
          <thead className="bg-[#F5F5F5]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Identifier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E8E6EA]">
            {bandwidths && bandwidths.length > 0 ? (
              bandwidths.map((bandwidth) => (
                <tr key={bandwidth.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {bandwidth.identifier || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {bandwidth.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatCurrency(bandwidth.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditBandwidth(bandwidth)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit Bandwidth"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBandwidth(bandwidth)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Bandwidth"
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
                  No bandwidth products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-6 space-y-4">
        {bandwidths && bandwidths.length > 0 ? (
          bandwidths.map((bandwidth) => (
            <div
              key={bandwidth.id}
              className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {bandwidth.name || "N/A"}
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditBandwidth(bandwidth)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    title="Edit Bandwidth"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBandwidth(bandwidth)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Bandwidth"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Identifier:</span>
                  <span>{bandwidth.identifier || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price:</span>
                  <span>{formatCurrency(bandwidth.price)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
            No bandwidth products found.
          </div>
        )}
      </div>

      {/* Modals (place your Add/Edit/Delete Bandwidth modals here) */}
      <AddBandwidthModal
        isOpen={isAddBandwidthModalOpen}
        onClose={() => setIsAddBandwidthModalOpen(false)}
      />
      <EditBandwidthModal
        isOpen={isEditBandwidthModalOpen}
        onClose={() => setIsEditBandwidthModalOpen(false)}
        bandwidth={selectedBandwidth}
      />

      <DeleteBandwidthModal
        isOpen={isDeleteBandwidthModalOpen}
        onClose={() => setIsDeleteBandwidthModalOpen(false)}
        bandwidth={selectedBandwidth}
      />
    </>
  );
};

export default BandWidth;
