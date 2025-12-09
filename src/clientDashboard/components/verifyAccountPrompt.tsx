// @ts-nocheck
// src/components/VerifyAccountPromptModal.jsx
import { X } from "lucide-react";

const VerifyAccountPromptModal = ({ isOpen, onClose }: any) => {
  const isActivated = false;

  if (!isOpen || isActivated) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-md mx-4 w-full p-6 text-center shadow-lg">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="my-4">
          <h3 className="text-xl font-semibold text-[#000] mb-3">Account Awaiting Approval</h3>
          <p className="text-[#676767] text-sm mb-6">
            We're thrilled to have you! Your account is currently{" "}
            <span className="text-[#FCA5A5] font-medium">under review</span> by our team. You'll be
            able to access the dashboard soon. For updates,{" "}
            <span className="text-[#FCA5A5] font-medium">contact support</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountPromptModal;
