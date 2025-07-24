import React from "react";
import { X } from "lucide-react";

const WorkInProgressModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-md mx-4 w-full p-6 text-center shadow-lg">
        <div className="flex justify-end">
          {/* <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button> */}
        </div>
        <div className="my-4">
          <h3 className="text-xl font-semibold text-[#121212] mb-3">
            Feature Under Development
          </h3>
          <p className="text-[#676767] text-sm mb-6">
            This feature is currently under construction. Please check back
            later!
          </p>
          {/* <button
            onClick={onClose}
            className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2"
          >
            Got It
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default WorkInProgressModal;
