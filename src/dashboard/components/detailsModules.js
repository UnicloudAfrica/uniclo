import { X } from "lucide-react";

const DetailedModules = ({ selectedItem, isModalOpen, closeModal }) => {
  const StatusBadge = ({ status }) => {
    const isActive = status === "Active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-[#00BF6B14] text-[#00BF6B]"
            : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {status}
      </span>
    );
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
                  {selectedItem.module}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Status:
                </span>
                <StatusBadge status={selectedItem.status} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">Plan:</span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.plan} (Up to 20 Extensions)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  Start Date:
                </span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.startDate}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-[#575758]">
                  End Date:
                </span>
                <span className="text-sm text-[#575758]">
                  {selectedItem.endDate}
                </span>
              </div>
            </div>

            {/* Footer */}
            {selectedItem.status === "Inactive" && (
              <div className=" grid grid-cols-2 gap-3 items-center px-6 py-4 border-t  rounded-b-[24px]">
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
