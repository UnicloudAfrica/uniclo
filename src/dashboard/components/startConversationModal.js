import { X } from "lucide-react";

const StartModalConversation = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-4 font-Outfit">
          <div className="bg-white rounded-[30px] shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#F2F2F2] border-b rounded-t-[30px] border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Start new conversation
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder="Enter subject "
                  className="w-full input-field"
                />
              </div>
            </div>

            {/* footer */}
            <div className=" grid grid-cols-2 gap-3 items-center px-6 py-4 border-t  rounded-b-[24px]">
              <button
                onClick={onClose}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StartModalConversation;
