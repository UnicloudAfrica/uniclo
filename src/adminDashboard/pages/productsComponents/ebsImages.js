import React, { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchEbsVolumes } from "../../../hooks/adminHooks/ebsHooks"; // Ensure this path is correct

const EBSImages = () => {
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const [isAddEBSModalOpen, setIsAddEBSModalOpen] = useState(false);
  // You would typically have states for edit/delete modals here too
  const [isEditEBSModalOpen, setIsEditEBSModalOpen] = useState(false);
  const [isDeleteEBSModalOpen, setIsDeleteEBSModalOpen] = useState(false);
  const [selectedEBSVolume, setSelectedEBSVolume] = useState(null); // To pass data to modals

  const handleAddEBSVolume = () => {
    setIsAddEBSModalOpen(true);
    // Logic to open Add EBS Volume modal
  };

  const handleEditEBSVolume = (volume) => {
    setSelectedEBSVolume(volume);
    setIsEditEBSModalOpen(true);
    // Logic to open Edit EBS Volume modal
  };

  const handleDeleteEBSVolume = (volume) => {
    setSelectedEBSVolume(volume);
    setIsDeleteEBSModalOpen(true);
    // Logic to open Delete EBS Volume confirmation modal
  };

  const formatCurrency = (amount, currency = "NGN") => {
    // Assuming NGN based on previous context, adjust if needed
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0, // Prices seem to be whole numbers
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  if (isEbsVolumesFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading EBS volumes...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddEBSVolume}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add EBS Volume
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
        <table className="w-full">
          <thead className="bg-[#F5F5F5]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Identifier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Media Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Price/Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                IOPS Read
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                IOPS Write
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E8E6EA]">
            {ebsVolumes && ebsVolumes.length > 0 ? (
              ebsVolumes.map((volume) => (
                <tr key={volume.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {volume.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {volume.identifier || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {volume.media_type || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatCurrency(volume.price_per_month)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {volume.iops_read || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {volume.iops_write || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatDate(volume.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditEBSVolume(volume)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit EBS Volume"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEBSVolume(volume)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete EBS Volume"
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
                  colSpan="8"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No EBS volumes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-6 space-y-4">
        {ebsVolumes && ebsVolumes.length > 0 ? (
          ebsVolumes.map((volume) => (
            <div
              key={volume.id}
              className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {volume.name || "N/A"}
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditEBSVolume(volume)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    title="Edit EBS Volume"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEBSVolume(volume)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete EBS Volume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Identifier:</span>
                  <span>{volume.identifier || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Media Type:</span>
                  <span>{volume.media_type || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price/Month:</span>
                  <span>{formatCurrency(volume.price_per_month)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">IOPS Read:</span>
                  <span>{volume.iops_read || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">IOPS Write:</span>
                  <span>{volume.iops_write || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created At:</span>
                  <span>{formatDate(volume.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
            No EBS volumes found.
          </div>
        )}
      </div>

      {/* Modals (place your Add/Edit/Delete EBS Volume modals here) */}
      {/* Example:
      <AddEBSModal
        isOpen={isAddEBSModalOpen}
        onClose={() => setIsAddEBSModalOpen(false)}
      />
      <EditEBSModal
        isOpen={isEditEBSModalOpen}
        onClose={() => setIsEditEBSModalOpen(false)}
        ebsVolume={selectedEBSVolume}
      />
      <DeleteEBSModal
        isOpen={isDeleteEBSModalOpen}
        onClose={() => setIsDeleteEBSModalOpen(false)}
        ebsVolume={selectedEBSVolume}
      />
      */}
    </>
  );
};

export default EBSImages;
