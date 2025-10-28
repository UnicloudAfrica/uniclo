import { useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchNetworks, syncNetworksFromProvider } from "../../../hooks/adminHooks/networkHooks";
import { useQueryClient } from "@tanstack/react-query";

const Badge = ({ text }) => {
  const badgeClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    available: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  };
  const badgeClass = badgeClasses[text?.toLowerCase()] || badgeClasses.default;

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${badgeClass}`}
    >
      {text}
    </span>
  );
};

const Networks = ({ projectId = "", region = "", provider = "" }) => {
  const queryClient = useQueryClient();
  const { data: networks, isFetching } = useFetchNetworks(projectId, region);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewModal, setViewModal] = useState(null); // network object or null
  const itemsPerPage = 6; // Number of networks per page

  const openViewModal = (network) => setViewModal(network);
  const closeViewModal = () => setViewModal(null);

  // Pagination logic
  const filteredNetworks = (networks || []).filter((net) => (net.type || net?.meta?.network_type) === "vpc_network");

  const totalItems = filteredNetworks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNetworks = filteredNetworks.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSyncNetworks = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Project ID and region are required to sync networks");
      return;
    }

    setIsSyncing(true);
    try {
      await syncNetworksFromProvider({ project_id: projectId, region });
      // Invalidate and refetch the networks list
      await queryClient.invalidateQueries({ queryKey: ["networks", { projectId, region }] });
      ToastUtils.success("Networks synced successfully!");
    } catch (error) {
      console.error("Failed to sync networks:", error);
      ToastUtils.error("Failed to sync networks. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Networks...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-[10px] font-Outfit">
      <div className="flex justify-end items-center gap-3 mb-6">
        <button
          onClick={handleSyncNetworks}
          disabled={isSyncing || !projectId || !region}
          className="rounded-[30px] py-3 px-6 bg-white border border-[#288DD1] text-[#288DD1] font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Sync networks from cloud provider"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Networks'}
        </button>
      </div>

      {filteredNetworks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentNetworks.map((network) => (
              <div
                key={network.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-medium text-gray-800 truncate pr-2"
                      title={network.name}
                    >
                      {network.name}
                    </h3>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(network)}
                        className="text-gray-400 hover:text-[#288DD1] transition-colors"
                        title="View Network Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    {network.provider_resource_id && (
                      <p title={network.provider_resource_id} className="truncate">
                        Resource ID: {network.provider_resource_id}
                      </p>
                    )}
                    {network.cidr && (
                      <p title={network.cidr}>CIDR: {network.cidr}</p>
                    )}
                    {network.type && (
                      <p>Type: <span className="capitalize">{network.type}</span></p>
                    )}
                    {network.vpc_id && (
                      <p title={network.vpc_id} className="truncate">
                        VPC: {network.vpc_id.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge text={network.status || "unknown"} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No networks found for this project.</p>
          <p className="text-gray-400 text-xs mt-2">
            Click "Sync Networks" to fetch networks from your cloud provider.
          </p>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeViewModal}
        >
          <div
            className="bg-white rounded-[10px] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Network Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Name</p>
                  <p className="text-sm font-medium text-gray-800">{viewModal.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <Badge text={viewModal.status || "unknown"} />
                </div>
                {viewModal.provider_resource_id && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Resource ID (Net ID)</p>
                    <p className="text-sm font-medium text-gray-800 break-all">
                      {viewModal.provider_resource_id}
                    </p>
                  </div>
                )}
                {viewModal.vpc_id && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">VPC ID</p>
                    <p className="text-sm font-medium text-gray-800 break-all">
                      {viewModal.vpc_id}
                    </p>
                  </div>
                )}
                {viewModal.cidr && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">CIDR Block</p>
                    <p className="text-sm font-medium text-gray-800">{viewModal.cidr}</p>
                  </div>
                )}
                {viewModal.gateway && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Gateway</p>
                    <p className="text-sm font-medium text-gray-800">{viewModal.gateway}</p>
                  </div>
                )}
                {viewModal.type && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Type</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{viewModal.type}</p>
                  </div>
                )}
                {viewModal.is_default !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Default Network</p>
                    <p className="text-sm font-medium text-gray-800">{viewModal.is_default ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-6 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium hover:bg-[#1976D2] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Networks;
