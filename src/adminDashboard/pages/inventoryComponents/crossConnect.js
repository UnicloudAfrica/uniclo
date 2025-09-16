import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchCrossConnects } from "../../../hooks/adminHooks/crossConnectHooks";
import EditCrossConnect from "./crossConnectSubs/editCC";
import DeleteCrossConnect from "./crossConnectSubs/deleteCC";
import AddCrossConnect from "./crossConnectSubs/addCC";

const CrossConnect = ({ selectedRegion }) => {
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchCrossConnects(selectedRegion);
  const [isAddCrossConnectModalOpen, setIsAddCrossConnectModalOpen] =
    useState(false);
  const [isEditCrossConnectModalOpen, setIsEditCrossConnectModalOpen] =
    useState(false);
  const [isDeleteCrossConnectModalOpen, setIsDeleteCrossConnectModalOpen] =
    useState(false);
  const [selectedCrossConnect, setSelectedCrossConnect] = useState(null);

  const handleAddCrossConnect = () => {
    setIsAddCrossConnectModalOpen(true);
  };

  const handleEditCrossConnect = (crossConnect) => {
    setSelectedCrossConnect(crossConnect);
    setIsEditCrossConnectModalOpen(true);
  };

  const handleDeleteCrossConnect = (crossConnect) => {
    setSelectedCrossConnect(crossConnect);
    setIsDeleteCrossConnectModalOpen(true);
  };

  const formatCurrency = (amount, currency = "USD") => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  if (isCrossConnectsFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading Cross Connects...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddCrossConnect}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add Cross Connect
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
                Price
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
            {crossConnects && crossConnects.length > 0 ? (
              crossConnects.map((cc) => (
                <tr key={cc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {cc.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {cc.identifier || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatCurrency(cc.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatDate(cc.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditCrossConnect(cc)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit Cross Connect"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCrossConnect(cc)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Cross Connect"
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
                  No Cross Connects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-6 space-y-4">
        {crossConnects && crossConnects.length > 0 ? (
          crossConnects.map((cc) => (
            <div
              key={cc.id}
              className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {cc.name || "N/A"}
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditCrossConnect(cc)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    title="Edit Cross Connect"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCrossConnect(cc)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Cross Connect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Identifier:</span>
                  <span>{cc.identifier || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price:</span>
                  <span>{formatCurrency(cc.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created At:</span>
                  <span>{formatDate(cc.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
            No Cross Connects found.
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCrossConnect
        isOpen={isAddCrossConnectModalOpen}
        onClose={() => setIsAddCrossConnectModalOpen(false)}
      />
      <EditCrossConnect
        isOpen={isEditCrossConnectModalOpen}
        onClose={() => setIsEditCrossConnectModalOpen(false)}
        crossConnect={selectedCrossConnect}
      />
      <DeleteCrossConnect
        isOpen={isDeleteCrossConnectModalOpen}
        onClose={() => setIsDeleteCrossConnectModalOpen(false)}
        crossConnect={selectedCrossConnect}
      />
    </>
  );
};

export default CrossConnect;
