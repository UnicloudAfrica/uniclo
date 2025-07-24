import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VerifyAccountPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateToSettings = () => {
    navigate("/dashboard/account-settings");
    onClose(); // Close the modal after navigating
  };

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
          <h3 className="text-xl font-semibold text-[#121212] mb-3">
            Account Verification Required
          </h3>
          <p className="text-[#676767] text-sm mb-6">
            Please update your account information and complete the verification
            process to access all features.
          </p>
          <button
            onClick={handleNavigateToSettings}
            className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2"
          >
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountPromptModal;
