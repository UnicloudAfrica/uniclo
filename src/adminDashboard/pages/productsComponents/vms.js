import React, { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchVmInstances } from "../../../hooks/adminHooks/vmHooks"; // Ensure this path is correct
import AddVMModal from "./vmSubs/addVms";
import EditVMModal from "./vmSubs/editVms";
import DeleteVMModal from "./vmSubs/deleteVms";

const Vms = () => {
  const { data: vms, isFetching: isVmsFetching } = useFetchVmInstances();
  const [isAddVMModalOpen, setIsAddVMModalOpen] = useState(false);
  const [isEditVMModalOpen, setIsEditVMModalOpen] = useState(false);
  const [isDeleteVMModalOpen, setIsDeleteVMModalOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState(null); // To pass data to modals

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

  // Updated formatCurrency to use "USD" as the default currency
  const formatCurrency = (amount, currency = "USD") => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2, // Changed to 2 for typical currency display
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  const formatMemory = (memory_gib) => {
    if (memory_gib === null || memory_gib === undefined) return "N/A";
    return `${memory_gib} GiB`;
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

  if (isVmsFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading VM instances...</p>
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

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
        <table className="w-full">
          <thead className="bg-[#F5F5F5]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                vCPUs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Memory (GiB)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Price
              </th>{" "}
              {/* Changed from Price/Hour */}
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
                    {vm.vcpus || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatMemory(vm.memory_gib)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatCurrency(vm.price)} {/* Using vm.price */}
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
                  colSpan="5"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No VM instances found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
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
                  <span className="font-medium">vCPUs:</span>
                  <span>{vm.vcpus || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Memory (GiB):</span>
                  <span>{formatMemory(vm.memory_gib)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price:</span>{" "}
                  {/* Changed from Price/Hour */}
                  <span>{formatCurrency(vm.price)}</span> {/* Using vm.price */}
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

      {/* Modals (place your Add/Edit/Delete VM modals here) */}
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
