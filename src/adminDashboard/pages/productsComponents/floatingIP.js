import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useFetchFloatingIPs } from "../../../hooks/adminHooks/floatingIPHooks";
import AddFloatingIP from "./ipSubs/addFloatingIP";
import EditFloatingIP from "./ipSubs/editFloatingIP";
import DeleteFloatingIP from "./ipSubs/deleteFloatingIP";

const FloatingIP = () => {
  const { data: ips, isFetching: isIPsFetching } = useFetchFloatingIPs();
  const [isAddIPsModalOpen, setIsAddIPsModalOpen] = useState(false);
  const [isEditIPsModalOpen, setIsEditIPsModalOpen] = useState(false);
  const [isDeleteIPsModalOpen, setIsDeleteIPsModalOpen] = useState(false);
  const [selectedIPs, setSelectedIPs] = useState(null);

  const handleAddIPs = () => {
    setIsAddIPsModalOpen(true);
  };

  const handleEditIPs = (ip) => {
    setSelectedIPs(ip);
    setIsEditIPsModalOpen(true);
  };

  const handleDeleteIPs = (ip) => {
    setSelectedIPs(ip);
    setIsDeleteIPsModalOpen(true);
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

  if (isIPsFetching) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
        <p className="ml-2 text-gray-700">Loading Floating IPs...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddIPs}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add Floating IP
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
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Local Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Local Currency
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E8E6EA]">
            {ips && ips.length > 0 ? (
              ips.map((ip) => (
                <tr key={ip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {ip.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {ip.identifier || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatCurrency(ip.price)}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatCurrency(ip.local_price, ip.local_currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {ip.local_currency || "N/A"}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {formatDate(ip.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditIPs(ip)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        title="Edit Floating IP"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIPs(ip)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Floating IP"
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
                  No Floating IPs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-6 space-y-4">
        {ips && ips.length > 0 ? (
          ips.map((ip) => (
            <div
              key={ip.id}
              className="bg-white rounded-[12px] shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {ip.name || "N/A"}
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleEditIPs(ip)}
                    className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                    title="Edit Floating IP"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteIPs(ip)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Floating IP"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Identifier:</span>
                  <span>{ip.identifier || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price:</span>
                  <span>{formatCurrency(ip.price)}</span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="font-medium">Local Price:</span>
                  <span>
                    {formatCurrency(ip.local_price, ip.local_currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Local Currency:</span>
                  <span>{ip.local_currency || "N/A"}</span>
                </div> */}
                <div className="flex justify-between">
                  <span className="font-medium">Created At:</span>
                  <span>{formatDate(ip.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
            No Floating IPs found.
          </div>
        )}
      </div>

      {/* Modals */}
      <AddFloatingIP
        isOpen={isAddIPsModalOpen}
        onClose={() => setIsAddIPsModalOpen(false)}
      />
      <EditFloatingIP
        isOpen={isEditIPsModalOpen}
        onClose={() => setIsEditIPsModalOpen(false)}
        floatingIP={selectedIPs}
      />
      <DeleteFloatingIP
        isOpen={isDeleteIPsModalOpen}
        onClose={() => setIsDeleteIPsModalOpen(false)}
        floatingIP={selectedIPs}
      />
    </>
  );
};

export default FloatingIP;
