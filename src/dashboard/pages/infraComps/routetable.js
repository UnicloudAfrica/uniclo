import { useState } from "react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantRouteTables,
  useSyncTenantRouteTables,
} from "../../../hooks/routeTable";

const RouteTables = ({ projectId = "", region = "" }) => {
  const { data: routeTables, isFetching } = useFetchTenantRouteTables(
    projectId,
    region
  );
  const { mutate: syncRouteTables, isPending: isSyncing } =
    useSyncTenantRouteTables();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const items = routeTables || [];
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync route tables.");
      return;
    }

    syncRouteTables(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Route tables synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync route tables:", err);
          ToastUtils.error(err?.message || "Failed to sync route tables.");
        },
      }
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Route Tables...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-[10px] font-Outfit">
      <div className="flex justify-end items-center gap-3 mb-6">
        <button
          onClick={handleSync}
          disabled={isSyncing || !projectId}
          className="rounded-[30px] py-3 px-6 border border-[#288DD1] text-[#288DD1] bg-white font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync Route Tables"}
        </button>
      </div>

      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((rt) => (
              <div
                key={rt.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow space-y-1 text-sm text-gray-500">
                  <h3
                    className="font-medium text-gray-800 truncate"
                    title={rt.name || rt.provider_resource_id}
                  >
                    {rt.name || rt.provider_resource_id || "Unnamed Route Table"}
                  </h3>
                  <p>Provider: {rt.provider?.toUpperCase() || "N/A"}</p>
                  <p>Region: {rt.region || "N/A"}</p>
                  <p>Routes: {Array.isArray(rt.routes) ? rt.routes.length : 0}</p>
                  <p>
                    Associations:{" "}
                    {Array.isArray(rt.associations) ? rt.associations.length : 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
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
        <p className="text-gray-500 text-sm">
          No Route Tables found for this project.
        </p>
      )}
    </div>
  );
};

export default RouteTables;
