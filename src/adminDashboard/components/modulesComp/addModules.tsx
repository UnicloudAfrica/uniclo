// @ts-nocheck
import { X } from "lucide-react";

const AddModules = ({ isOpen, onClose }: any) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
              <h2 className="text-lg font-semibold text-[#575758]">Add Modules</h2>
              <button
                //   onClick={handleClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[400px] w-full overflow-y-auto">
              <div className=" space-y-4 w-full">
                <div>
                  <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">
                    Module Name
                  </label>
                  <input
                    id=""
                    type="text"
                    placeholder="Enter name"
                    className="w-full input-field transition-all border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    id=""
                    type="text"
                    placeholder="Write...."
                    className="w-full input-field transition-all border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    id=""
                    type="text"
                    placeholder="Enter Price"
                    className="w-full input-field transition-all border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">
                    CPU
                  </label>
                  <input
                    id=""
                    type="text"
                    placeholder="Enter CPU"
                    className="w-full input-field transition-all border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">
                    Memory
                  </label>
                  <input
                    id=""
                    type="text"
                    placeholder="Enter Memory"
                    className="w-full input-field transition-all border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    id=""
                    type="text"
                    placeholder="Enter Memory"
                    className="w-full input-field transition-all border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className=" grid grid-cols-2 gap-3 items-center px-6 py-4 border-t  rounded-b-[24px]">
              <button
                onClick={onClose}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddModules;
