import React, { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchEbsVolumes } from "../../../hooks/adminHooks/ebsHooks";
import AddEBSModal from "./ebsSubs/addEbs";
import EditEBSModal from "./ebsSubs/editEbs";
import DeleteEBSModal from "./ebsSubs/deleteEbs";

const EBSVolumes = ({ selectedRegion }) => {
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes(selectedRegion);
  const [isAddEBSModalOpen, setIsAddEBSModalOpen] = useState(false);
  const [isEditEBSModalOpen, setIsEditEBSModalOpen] = useState(false);
  const [isDeleteEBSModalOpen, setIsDeleteEBSModalOpen] = useState(false);
  const [selectedEBSVolume, setSelectedEBSVolume] = useState(null);

  const handleAddEBSVolume = () => {
    setIsAddEBSModalOpen(true);
  };

  const handleEditEBSVolume = (volume) => {
    setSelectedEBSVolume(volume);
    setIsEditEBSModalOpen(true);
  };

  const handleDeleteEBSVolume = (volume) => {
    setSelectedEBSVolume(volume);
    setIsDeleteEBSModalOpen(true);
  };

  const formatIOPS = (value) => {
    return value !== null && value !== undefined ? `${value} IOPS` : "N/A";
  };

  const formatBandwidth = (value) => {
    return value !== null && value !== undefined ? `${value} MB/s` : "N/A";
  };

  if (isEbsVolumesFetching || !selectedRegion) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">
          {!selectedRegion
            ? "Waiting for region selection..."
            : "Loading EBS volumes..."}
        </p>
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
                Read IOPS Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Write IOPS Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Read Bandwidth Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Write Bandwidth Limit
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
                    {volume.region || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatIOPS(volume.read_iops_limit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatIOPS(volume.write_iops_limit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatBandwidth(volume.read_bandwidth_limit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatBandwidth(volume.write_bandwidth_limit)}
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
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No EBS volumes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                  <span className="font-medium">Region:</span>
                  <span>{volume.region || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Read IOPS Limit:</span>
                  <span>{formatIOPS(volume.read_iops_limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Write IOPS Limit:</span>
                  <span>{formatIOPS(volume.write_iops_limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Read Bandwidth Limit:</span>
                  <span>{formatBandwidth(volume.read_bandwidth_limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Write Bandwidth Limit:</span>
                  <span>{formatBandwidth(volume.write_bandwidth_limit)}</span>
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
    </>
  );
};

export default EBSVolumes;
