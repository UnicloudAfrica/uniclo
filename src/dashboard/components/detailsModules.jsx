import { X } from "lucide-react";

const DetailedModules = ({ selectedItem, isModalOpen, closeModal }) => {
  const StatusBadge = ({ status }) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize";

    const statusStyles = {
      successful: "bg-[#00BF6B14] text-[#00BF6B]", // green
      failed: "bg-[#EB417833] text-[#EB4178]", // red
      pending: "bg-[#F5A62333] text-[#F5A623]", // amber/orange
    };

    const styleClass = statusStyles[status] || "bg-gray-100 text-gray-600";

    return <span className={`${baseClass} ${styleClass}`}>{status}</span>;
  };

  const CredentialsBadge = ({ credentials }) => {
    const isReady = credentials !== null;
    const displayText = isReady ? "Ready" : "Not Ready";

    return (
      <span
        className={`inline-flex items-center px-2.5 capitalize py-1 rounded-full text-xs font-medium ${
          isReady
            ? "bg-[#00BF6B14] text-[#00BF6B]"
            : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {displayText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(isDateOnly
        ? {}
        : { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    return date
      .toLocaleString("en-US", options)
      .replace(/,([^,]*)$/, isDateOnly ? "$1" : " -$1");
  };

  return (
    <>
      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-4 font-Outfit">
          <div className="bg-white rounded-[30px] shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#F2F2F2] border-b rounded-t-[30px] border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Details</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Module:
                </span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.productable?.name || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Status:
                </span>
                <StatusBadge status={selectedItem.status} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Credentials:
                </span>
                <CredentialsBadge credentials={selectedItem.credentials} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">Plan:</span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.productable?.name || "N/A"} (
                  {selectedItem.productable?.vcpus || 0} vCPUs,{" "}
                  {selectedItem.productable?.memory_gib || 0} GiB Memory)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Start Date:
                </span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.subscription_item?.subscription?.created_at
                    ? formatDate(
                        selectedItem.subscription_item.subscription.created_at
                      )
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Next Billing Date:
                </span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.subscription_item?.subscription
                    ?.next_billing_date
                    ? formatDate(
                        selectedItem.subscription_item.subscription
                          .next_billing_date
                      )
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Footer */}
            {selectedItem.status === "failed" && (
              <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Repurchase
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DetailedModules;
