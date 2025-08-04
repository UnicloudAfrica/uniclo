import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

import { useFetchInstanceRequestById } from "../../hooks/adminHooks/instancesHook";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";

export default function AdminInstancesDetails() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instanceId, setInstanceId] = useState(null);
  const [instanceNameFromUrl, setInstanceNameFromUrl] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // State for success modal
  const [transactionReferenceForSuccess, setTransactionReferenceForSuccess] =
    useState(null); // To pass to success modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // State for PaymentModal
  const [selectedTransactionForPayment, setSelectedTransactionForPayment] =
    useState(null); // To pass to PaymentModal

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedId = params.get("id");
    const nameFromUrl = params.get("name");

    if (encodedId) {
      try {
        const decodedId = atob(decodeURIComponent(encodedId));
        setInstanceId(decodedId);
      } catch (error) {
        console.error("Failed to decode instance ID:", error);
        setInstanceId(null);
      }
    }
    if (nameFromUrl) {
      setInstanceNameFromUrl(nameFromUrl);
    }
  }, []);

  const {
    data: instanceDetails,
    isFetching,
    isError,
    error,
  } = useFetchInstanceRequestById(instanceId);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleGoBack = () => {
    window.location.href = "/admin-dashboard/instances";
  };

  const handleOpenPaymentModal = (transaction) => {
    setSelectedTransactionForPayment(transaction);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedTransactionForPayment(null);
  };

  const handlePaymentInitiated = (reference, saveCard) => {
    setTransactionReferenceForSuccess(reference);
    setIsSuccessModalOpen(true);
    // Optionally, you might want to refetch instance details here to update its status
    // queryClient.invalidateQueries(["instanceRequest", instanceId]);
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    // Optionally, refetch instance details here to update its status
    // queryClient.invalidateQueries(["instanceRequest", instanceId]);
  };

  if (isFetching || instanceId === null) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700">Loading instance details...</p>
        </main>
      </>
    );
  }

  if (isError || !instanceDetails) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-4">
            This instance couldn't be found.
          </p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go back
          </button>
        </main>
      </>
    );
  }

  const totalCost = instanceDetails.metadata?.pricing_breakdown?.total;
  const currency =
    instanceDetails.metadata?.pricing_breakdown?.currency || "NGN";

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <h1 className="text-2xl font-bold text-[#1E1E1EB2] mb-6">
          {instanceDetails.name || instanceNameFromUrl || "N/A"}
        </h1>

        {/* Instance Overview Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Instance Name:</span>
              <span className="text-gray-900">
                {instanceDetails.name || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Identifier:</span>
              <span className="text-gray-900">
                {instanceDetails.identifier || "N/A"}
              </span>
            </div>
            {/* <div className="flex flex-col">
              <span className="font-medium text-gray-600">Compute Type:</span>
              <span className="text-gray-900">
                {instanceDetails.compute?.name || "N/A"}
              </span>
            </div> */}
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">vCPUs:</span>
              <span className="text-gray-900">
                {instanceDetails.compute?.vcpus || "N/A"}
              </span>
            </div>
            {/* <div className="flex flex-col">
              <span className="font-medium text-gray-600">Memory:</span>
              <span className="text-gray-900">
                {instanceDetails.compute?.memory_gib
                  ? `${instanceDetails.compute.memory_gib} GiB`
                  : "N/A"}
              </span>
            </div> */}
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Disk Size:</span>
              <span className="text-gray-900">
                {instanceDetails.storage_size_gb
                  ? `${instanceDetails.storage_size_gb} GiB`
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">
                EBS Volume Name:
              </span>
              <span className="text-gray-900">
                {instanceDetails.ebs_volume?.name || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">EBS Media Type:</span>
              <span className="text-gray-900">
                {instanceDetails.ebs_volume?.media_type || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">EBS IOPS Read:</span>
              <span className="text-gray-900">
                {instanceDetails.ebs_volume?.iops_read || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">EBS IOPS Write:</span>
              <span className="text-gray-900">
                {instanceDetails.ebs_volume?.iops_write || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">
                Operating System:
              </span>
              <span className="text-gray-900">
                {instanceDetails.os_image?.name || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Bandwidth:</span>
              <span className="text-gray-900">
                {instanceDetails.bandwidth?.name || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Term (Months):</span>
              <span className="text-gray-900">
                {instanceDetails.months || "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Creation Date:</span>
              <span className="text-gray-900">
                {instanceDetails.created_at
                  ? new Date(instanceDetails.created_at).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col md:col-span-2">
              <span className="font-medium text-gray-600">Description:</span>
              <span className="text-gray-900">
                {instanceDetails.description || "N/A"}
              </span>
            </div>
            <div className="flex flex-col md:col-span-2">
              <span className="font-medium text-gray-600">Tags:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {instanceDetails.tags && instanceDetails.tags.length > 0 ? (
                  instanceDetails.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-600">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium capitalize ${
                  instanceDetails.status === "Running"
                    ? "bg-green-100 text-green-800"
                    : instanceDetails.status === "Stopped"
                    ? "bg-red-100 text-red-800"
                    : instanceDetails.status === "spawning"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {instanceDetails.status?.replace(/_/g, " ") || "N/A"}
              </span>
            </div>
            {totalCost !== undefined && totalCost !== null && (
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-600">Total Cost:</span>
                <span className="text-gray-900 font-semibold">
                  {currency} {totalCost.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Transactions
          </h2>
          <div className="overflow-x-auto">
            {instanceDetails.transactions &&
            instanceDetails.transactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instanceDetails.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.identifier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.type?.replace(/_/g, " ") || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.currency} {tx.amount?.toLocaleString() || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            tx.status === "success"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.payment_gateway || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {tx.status === "pending" &&
                          tx.action === "initiate" && (
                            <button
                              onClick={() => handleOpenPaymentModal(tx)}
                              className="text-[#288DD1] hover:underline"
                            >
                              Make Payment
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No transactions found for this instance.
              </p>
            )}
          </div>
        </div>

        {/* Actions Section (Instance Management) */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Instance Management Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-colors">
              Start Instance
            </button>
            <button className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors">
              Stop Instance
            </button>
            <button className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors">
              Reboot Instance
            </button>
            <button className="px-6 py-3 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition-colors">
              Delete Instance
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
