import React, { useState, useMemo, useEffect } from "react";
import { Loader2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
} from "../../../hooks/resource";
import {
  useFetchPricing,
  useDeletePricing,
  useSyncPricing,
  useResyncPricing,
} from "../../../hooks/pricingHooks";
import AddPricing from "./addPricing";
import ToastUtils from "../../../utils/toastUtil";
// import DeletePricingModal from "./pricingComps/deletePricing"; // Commented out as per request

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </td>
  </tr>
);

const PricingCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="flex justify-between items-center mb-2">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
);

const Pricing = () => {
  const [isAddPricingModalOpen, setIsAddPricingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: pricing,
    isFetching: isPricingFetching,
    refetch,
  } = useFetchPricing();
  const { mutate: deletePricing, isPending: isDeleting } = useDeletePricing();
  const { mutate: syncPricing, isPending: isSyncing } = useSyncPricing();
  const { mutate: resyncPricing, isPending: isResyncing } = useResyncPricing();

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();

  const openAddPricingModal = () => setIsAddPricingModalOpen(true);
  const closeAddPricingModal = () => setIsAddPricingModalOpen(false);

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deletePricing(itemToDelete.id, {
        onSuccess: () => {
          ToastUtils.success("Pricing deleted successfully!");
          closeDeleteModal();
          refetch();
        },
        onError: (err) => {
          console.error("Failed to delete pricing:", err);
          ToastUtils.error(
            err.message || "Failed to delete pricing. Please try again."
          );
        },
      });
    }
  };

  const handleSyncPricing = () => {
    syncPricing(null, {
      onSuccess: () => {
        ToastUtils.success("Pricing synced successfully!");
        refetch();
      },
      onError: (err) => {
        // console.error("Failed to sync pricing:", err);
        // ToastUtils.error(err.message || "Failed to sync pricing. Please try again.");
      },
    });
  };

  const handleResyncPricing = () => {
    resyncPricing(null, {
      onSuccess: () => {
        ToastUtils.success("Pricing resynced successfully!");
        refetch();
      },
      onError: (err) => {
        // console.error("Failed to resync pricing:", err);
        // ToastUtils.error(err.message || "Failed to resync pricing. Please try again.");
      },
    });
  };

  const productTypes = useMemo(() => {
    if (pricing) {
      return Object.keys(pricing);
    }
    return [];
  }, [pricing]);

  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (productTypes.length > 0 && !activeTab) {
      setActiveTab(productTypes[0]);
    }
  }, [productTypes, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const currentTabItems = useMemo(() => {
    return pricing && pricing[activeTab] ? pricing[activeTab] : [];
  }, [pricing, activeTab]);

  const totalPages = Math.ceil(currentTabItems.length / itemsPerPage);
  const currentItems = currentTabItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-end gap-3 mb-4">
        <button
          onClick={handleSyncPricing}
          disabled={isSyncing || isResyncing}
          className="px-6 py-3 bg-[#6C757D] text-white font-medium rounded-full hover:bg-[#5A6268] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            "Sync Pricing"
          )}
        </button>

        <button
          onClick={handleResyncPricing}
          disabled={isSyncing || isResyncing}
          className="px-6 py-3 bg-[#007BFF] text-white font-medium rounded-full hover:bg-[#0056B3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isResyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resyncing...
            </>
          ) : (
            "Resync Pricing"
          )}
        </button>

        <button
          onClick={openAddPricingModal}
          className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors flex items-center justify-center"
        >
          Add New Pricing
        </button>
      </div>

      <div className="w-full">
        {isPricingFetching ? (
          <div className="w-full text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto text-[#288DD1] animate-spin" />
            <p className="text-gray-600 mt-2">Loading pricing data...</p>
          </div>
        ) : productTypes.length === 0 ? (
          <div className="w-full text-center py-8 text-gray-600">
            No pricing data available. Add new pricing to get started.
          </div>
        ) : (
          <>
            <div className="flex border-b w-full border-[#EAECF0] mb-6 overflow-x-auto whitespace-nowrap">
              {productTypes.map((type) => (
                <button
                  key={type}
                  className={`font-medium text-sm pb-4 px-4 transition-all ${
                    activeTab === type
                      ? "border-b-2 border-[#288DD1] text-[#288DD1]"
                      : "text-[#1C1C1C] hover:text-[#288DD1]"
                  }`}
                  onClick={() => setActiveTab(type)}
                >
                  {type.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </div>

            {/* Table for desktop */}
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-[#E8E6EA]">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      Product Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      Original Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      Set Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E8E6EA]">
                  {isPricingFetching ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  ) : currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.productable.name ||
                            item.productable.identifier ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.productable_type.split("\\").pop()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {formatCurrency(
                            item.productable.local_price,
                            item.productable.local_currency
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {formatCurrency(
                            item.local_price,
                            item.local_currency
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                            title="Delete Pricing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-600"
                      >
                        No pricing data available for{" "}
                        {activeTab.replace(/([A-Z])/g, " $1").trim()}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for desktop table */}
            {totalPages > 1 && (
              <div className="hidden md:flex items-center justify-center px-4 mt-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Cards for mobile */}
            <div className="md:hidden mt-6 space-y-4">
              {isPricingFetching ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <PricingCardSkeleton key={i} />
                ))
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {item.productable.name ||
                        item.productable.identifier ||
                        "N/A"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Product Type:</span>{" "}
                      {item.productable_type.split("\\").pop()}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Original Price:</span>{" "}
                      {formatCurrency(
                        item.productable.local_price,
                        item.productable.local_currency
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Set Price:</span>{" "}
                      {formatCurrency(item.local_price, item.local_currency)}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Delete Pricing"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No pricing data available for{" "}
                  {activeTab.replace(/([A-Z])/g, " $1").trim()}.
                </div>
              )}
            </div>

            {/* Pagination for mobile cards */}
            {totalPages > 1 && (
              <div className="md:hidden flex items-center justify-center px-4 mt-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddPricing
        isOpen={isAddPricingModalOpen}
        onClose={closeAddPricingModal}
        computerInstances={computerInstances}
        isComputerInstancesFetching={isComputerInstancesFetching}
        osImages={osImages}
        isOsImagesFetching={isOsImagesFetching}
        bandwidths={bandwidths}
        isBandwidthsFetching={isBandwidthsFetching}
        ebsVolumes={ebsVolumes}
        isEbsVolumesFetching={isEbsVolumesFetching}
      />

      {/* DeletePricingModal is commented out as requested */}
      {/* <DeletePricingModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        item={itemToDelete}
        onDeleteConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      /> */}
    </>
  );
};

export default Pricing;
