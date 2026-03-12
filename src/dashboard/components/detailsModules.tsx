import { X } from "lucide-react";

const DetailedModules = ({
  selectedItem,
  isModalOpen,
  closeModal,
}: {
  selectedItem: Record<string, any>;
  isModalOpen: boolean;
  closeModal: () => void;
}) => {
  const StatusBadge = ({ status }: { status: string }) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize";

    const statusStyles = {
      successful: "bg-[rgb(var(--theme-success-500) / 0.08)] text-[rgb(var(--theme-success-500))]", // green
      failed: "bg-[rgb(var(--theme-danger-500) / 0.2)] text-[rgb(var(--theme-danger-500))]", // red
      pending: "bg-[rgb(var(--theme-warning-500) / 0.2)] text-[rgb(var(--theme-warning-500))]", // amber/orange
    };

    const styleClass =
      statusStyles[status as keyof typeof statusStyles] || "bg-gray-100 text-gray-600";

    return <span className={`${baseClass} ${styleClass}`}>{status}</span>;
  };

  const CredentialsBadge = ({ credentials }: { credentials: unknown }) => {
    const isReady = credentials !== null;
    const displayText = isReady ? "Ready" : "Not Ready";

    return (
      <span
        className={`inline-flex items-center px-2.5 capitalize py-1 rounded-full text-xs font-medium ${
          isReady
            ? "bg-[rgb(var(--theme-success-500) / 0.08)] text-[rgb(var(--theme-success-500))]"
            : "bg-[rgb(var(--theme-danger-500) / 0.2)] text-[rgb(var(--theme-danger-500))]"
        }`}
      >
        {displayText}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(isDateOnly ? {} : { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    return date
      .toLocaleString("en-US", options as Intl.DateTimeFormatOptions)
      .replace(/,([^,]*)$/, isDateOnly ? "$1" : " -$1");
  };

  return (
    <>
      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-4 font-Outfit">
          <div className="bg-white rounded-[30px] shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[var(--theme-surface-alt)] border-b rounded-t-[30px] border-gray-200">
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
                <span className="text-sm font-light text-[var(--theme-text-color)]">Module:</span>
                <span className="text-sm text-[var(--theme-text-color)]">
                  {selectedItem.productable?.name || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[var(--theme-text-color)]">Status:</span>
                <StatusBadge status={selectedItem.status} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[var(--theme-text-color)]">
                  Credentials:
                </span>
                <CredentialsBadge credentials={selectedItem.credentials} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[var(--theme-text-color)]">Plan:</span>
                <span className="text-sm text-[var(--theme-text-color)]">
                  {selectedItem.productable?.name || "N/A"} ({selectedItem.productable?.vcpus || 0}{" "}
                  vCPUs, {selectedItem.productable?.memory_gib || 0} GiB Memory)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[var(--theme-text-color)]">
                  Start Date:
                </span>
                <span className="text-sm text-[var(--theme-text-color)]">
                  {selectedItem.subscription_item?.subscription?.created_at
                    ? formatDate(selectedItem.subscription_item.subscription.created_at)
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[var(--theme-text-color)]">
                  Next Billing Date:
                </span>
                <span className="text-sm text-[var(--theme-text-color)]">
                  {selectedItem.subscription_item?.subscription?.next_billing_date
                    ? formatDate(selectedItem.subscription_item.subscription.next_billing_date)
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Footer */}
            {selectedItem.status === "failed" && (
              <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-[var(--theme-text-color)] bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button className="px-8 py-3 bg-[var(--theme-color)] text-white font-medium rounded-full hover:bg-[var(--theme-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
