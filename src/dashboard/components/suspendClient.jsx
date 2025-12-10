import { X } from "lucide-react";

const SuspendClient = ({ isOpen, onClose }) => {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] font-Outfit">
        <div className="bg-white rounded-[30px] w-full max-w-[650px] mx-4">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[30px]">
            <h2 className="text-lg font-semibold text-[#1C1C1C]">
              Suspend Client
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8 text-center">
            <p className=" font-semibold text-2xl font-Outfit text-[#272728]">
              Suspend
            </p>

            <p className=" mt-1 text-[#676767] text-base font-normal">
              Are you sure you want to suspend the client client?
            </p>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-3 items-center px-6 py-4 border-t rounded-b-[24px]">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Suspend Client
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuspendClient;
