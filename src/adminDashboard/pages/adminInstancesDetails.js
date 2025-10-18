import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, AlertTriangle, Copy } from "lucide-react";

import { useFetchInstanceRequestById } from "../../hooks/adminHooks/instancesHook";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ToastUtils from "../../utils/toastUtil";
import {
  useFetchInstanceConsoleById,
  useFetchInstanceConsoles,
} from "../../hooks/adminHooks/moreinstanceHooks";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Badge = ({ text }) => {
  const badgeClasses = {
    running: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    stopped: "bg-red-100 text-red-800",
    spawning: "bg-blue-100 text-blue-800",
    payment_pending: "bg-orange-100 text-orange-800",
    pending: "bg-yellow-100 text-yellow-800",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  };
  const badgeClass =
    badgeClasses[text?.toLowerCase().replace(/ /g, "_")] ||
    badgeClasses.default;

  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${badgeClass}`}
    >
      {text}
    </span>
  );
};

const DetailRow = ({ label, value, children, isCopyable = false }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    ToastUtils.success("Copied to clipboard!");
  };

  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 flex items-center text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <span className="flex-grow break-words">
          {value || children || "N/A"}
        </span>
        {isCopyable && value && (
          <button
            onClick={handleCopy}
            className="ml-2 p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </dd>
    </div>
  );
};

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
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
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
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex flex-col items-center justify-center text-center">
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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#1E1E1EB2] mb-6">
          {instanceDetails.name ||
            `Instance created on ${formatDate(instanceDetails.created_at)}` ||
            "N/A"}
        </h1>

        {/* Instance Overview Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Column 1 */}
            <div>
              <DetailRow
                label="Instance Name"
                value={instanceDetails.name || "N/A"}
              />
              <DetailRow
                label="Identifier"
                value={instanceDetails.identifier}
                isCopyable
              />
              <DetailRow
                label="Status"
                children={
                  <Badge text={instanceDetails.status?.replace(/_/g, " ")} />
                }
              />
              <DetailRow label="Provider" value={instanceDetails.provider} />
              <DetailRow label="Region" value={instanceDetails.region} />
              <DetailRow
                label="Description"
                value={instanceDetails.description}
              />
            </div>
            {/* Column 2 */}
            <div>
              <DetailRow
                label="Project"
                value={instanceDetails.project?.name || "N/A"}
              />
              <DetailRow
                label="Created At"
                value={new Date(instanceDetails.created_at).toLocaleString()}
              />
              <DetailRow
                label="Expires At"
                value={
                  instanceDetails.expires_at
                    ? new Date(instanceDetails.expires_at).toLocaleString()
                    : "N/A"
                }
              />
              <DetailRow
                label="Term"
                value={`${instanceDetails.months} month(s)`}
              />
              <DetailRow
                label="Tags"
                children={
                  <div className="flex flex-wrap gap-2">
                    {instanceDetails.tags && instanceDetails.tags.length > 0 ? (
                      instanceDetails.tags.map((tag, index) => (
                        <Badge key={index} text={tag} />
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                }
              />
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-sm">
            <DetailRow label="Compute" value={instanceDetails.compute?.name} />
            <DetailRow label="vCPUs" value={instanceDetails.compute?.vcpus} />
            <DetailRow
              label="Memory"
              value={
                instanceDetails.compute?.memory_mb
                  ? `${instanceDetails.compute.memory_mb / 1024} GiB`
                  : "N/A"
              }
            />
            <DetailRow
              label="Disk Size"
              value={
                instanceDetails.storage_size_gb
                  ? `${instanceDetails.storage_size_gb} GiB`
                  : "N/A"
              }
            />
            <DetailRow
              label="Volume Type"
              value={instanceDetails.volume_type?.name}
            />
            <DetailRow
              label="Operating System"
              value={instanceDetails.os_image?.name}
            />
            <DetailRow
              label="Bandwidth"
              value={instanceDetails.bandwidth?.name}
            />
            <DetailRow
              label="Key Pair"
              value={instanceDetails.metadata?.key_name}
            />
            <DetailRow
              label="Security Groups"
              value={
                instanceDetails.metadata?.security_groups?.join(", ") || "N/A"
              }
            />
            <DetailRow label="Subnet ID" value={instanceDetails.subnet_id} />
            <DetailRow label="Network ID" value={instanceDetails.network_id} />
          </div>
        </div>

        {/* Billing Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">Billing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-sm">
            {totalCost !== undefined && totalCost !== null && (
              <DetailRow
                label="Total Cost"
                value={`${currency} ${totalCost.toLocaleString()}`}
              />
            )}
            <DetailRow
              label="Next Billing Date"
              value={
                instanceDetails.next_billing_date
                  ? new Date(instanceDetails.next_billing_date).toLocaleString()
                  : "N/A"
              }
            />
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
                        <Badge text={tx.status?.replace(/_/g, " ")} />
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
