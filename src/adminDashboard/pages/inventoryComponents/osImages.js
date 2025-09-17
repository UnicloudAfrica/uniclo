import React, { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchOsImages } from "../../../hooks/adminHooks/os-imageHooks";
import AddOSImageModal from "./osSubs/addOs";
import DeleteOS from "./osSubs/deleteOS";
import EditOS from "./osSubs/editOs";

const OSImages = ({ selectedRegion }) => {
  const { data: osImages, isFetching: isOSimagesFetching } =
    useFetchOsImages(selectedRegion);
  const [isAddOSImageModalOpen, setIsAddOSImageModalOpen] = useState(false);
  const [isEditOSImageModalOpen, setIsEditOSImageModalOpen] = useState(false);
  const [isDeleteOSImageModalOpen, setIsDeleteOSImageModalOpen] =
    useState(false);
  const [selectedOSImage, setSelectedOSImage] = useState(null);

  const handleAddOSImage = () => {
    setIsAddOSImageModalOpen(true);
  };

  const handleEditOSImage = (image) => {
    setSelectedOSImage(image);
    setIsEditOSImageModalOpen(true);
  };

  const handleDeleteOSImage = (image) => {
    setSelectedOSImage(image);
    setIsDeleteOSImageModalOpen(true);
  };

  const formatLicenseStatus = (isLicensed) => {
    return isLicensed ? "Licensed" : "Not Licensed";
  };

  if (isOSimagesFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading OS images...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4 w-full">
        <button
          onClick={handleAddOSImage}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add OS Image
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
        <table className="w-full">
          <thead className="bg-[#F5F5F5]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                License Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E8E6EA]">
            {osImages && osImages.length > 0 ? (
              osImages.map((image) => (
                <tr key={image.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {image.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {image.region || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatLicenseStatus(image.is_licenced)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditOSImage(image)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit OS Image"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOSImage(image)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete OS Image"
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
                  No OS images found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden mt-6 space-y-4">
        {osImages && osImages.length > 0 ? (
          osImages.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {image.name || "N/A"}
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditOSImage(image)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    title="Edit OS Image"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOSImage(image)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete OS Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Region:</span>
                  <span>{image.region || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">License Status:</span>
                  <span>{formatLicenseStatus(image.is_licenced)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
            No OS images found.
          </div>
        )}
      </div>

      <AddOSImageModal
        isOpen={isAddOSImageModalOpen}
        onClose={() => setIsAddOSImageModalOpen(false)}
      />

      <EditOS
        isOpen={isEditOSImageModalOpen}
        onClose={() => setIsEditOSImageModalOpen(false)}
        osImage={selectedOSImage}
      />

      <DeleteOS
        isOpen={isDeleteOSImageModalOpen}
        onClose={() => setIsDeleteOSImageModalOpen(false)}
        osImage={selectedOSImage}
      />
    </>
  );
};

export default OSImages;
