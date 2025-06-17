import React from "react";
import { X, Check } from "lucide-react";

const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] font-Outfit">
      <div className="bg-white rounded-[30px] w-full max-w-[650px] mx-4">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[30px]">
          <h2 className="text-lg font-semibold text-[#1C1C1C]">Successful</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#008D4F] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>

          {/* Success Message */}
          <h3 className="text-xl font-semibold text-[#1C1C1C] mb-3">
            Successful!
          </h3>
          <p className="text-[#676767] text-base leading-relaxed max-w-[500px] mx-auto">
            Your module has been successfully provisioned. You can now start
            using your new service right away.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#288DD1] text-white font-semibold text-base rounded-[30px] hover:bg-[#1976D2] transition-colors"
          >
            Go back home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
