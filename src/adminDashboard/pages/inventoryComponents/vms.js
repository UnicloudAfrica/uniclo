import React, { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchVmInstances } from "../../../hooks/adminHooks/vmHooks";
import AddVMModal from "./vmSubs/addVms";
import EditVMModal from "./vmSubs/editVms";
import DeleteVMModal from "./vmSubs/deleteVms";

const Vms = ({ selectedRegion }) => {
  const { data: vms, isFetching: isVmsFetching } =
    useFetchVmInstances(selectedRegion);
  const [isAddVMModalOpen, setIsAddVMModalOpen] = useState(false);
  const [isEditVMModalOpen, setIsEditVMModalOpen] = useState(false);
  const [isDeleteVMModalOpen, setIsDeleteVMModalOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState(null);

  const handleAddVM = () => {
    setIsAddVMModalOpen(true);
  };

  const handleEditVM = (vm) => {
    setSelectedVM(vm);
    setIsEditVMModalOpen(true);
  };

  const handleDeleteVM = (vm) => {
    setSelectedVM(vm);
    setIsDeleteVMModalOpen(true);
  };

  const formatMemory = (memory_mb) => {
    if (memory_mb === null || memory_mb === undefined) return "N/A";
    const memory_gib = (memory_mb / 1024).toFixed(0); // Convert MB to GiB
    return `${memory_gib} GiB`;
  };

  if (isVmsFetching || !selectedRegion) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">
          {!selectedRegion
            ? "Waiting for region selection..."
            : "Loading VM instances..."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddVM}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add VM
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
                Memory (GiB)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                vCPUs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Cores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Sockets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Threads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E8E6EA]">
            {vms && vms.length > 0 ? (
              vms.map((vm) => (
                <tr key={vm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {vm.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {vm.region || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatMemory(vm.memory_mb)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {vm.vcpus || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {vm.cores || "0"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {vm.sockets || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {vm.threads || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditVM(vm)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit VM"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVM(vm)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete VM"
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
                  No VM instances found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden mt-6 space-y-4">
        {vms && vms.length > 0 ? (
          vms.map((vm) => (
            <div
              key={vm.id}
              className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {vm.name || "N/A"}
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditVM(vm)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    title="Edit VM"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVM(vm)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete VM"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Region:</span>
                  <span>{vm.region || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Memory (GiB):</span>
                  <span>{formatMemory(vm.memory_mb)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">vCPUs:</span>
                  <span>{vm.vcpus || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cores:</span>
                  <span>{vm.cores || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sockets:</span>
                  <span>{vm.sockets || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Threads:</span>
                  <span>{vm.threads || "N/A"}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
            No VM instances found.
          </div>
        )}
      </div>

      <AddVMModal
        isOpen={isAddVMModalOpen}
        onClose={() => setIsAddVMModalOpen(false)}
      />
      <EditVMModal
        isOpen={isEditVMModalOpen}
        onClose={() => setIsEditVMModalOpen(false)}
        vm={selectedVM}
      />
      <DeleteVMModal
        isOpen={isDeleteVMModalOpen}
        onClose={() => setIsDeleteVMModalOpen(false)}
        vm={selectedVM}
      />
    </>
  );
};

export default Vms;
