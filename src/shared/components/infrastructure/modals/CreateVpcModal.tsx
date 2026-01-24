// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";

interface CreateVpcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, cidr: string, isDefault: boolean) => void;
  isCreating?: boolean;
}

/**
 * Modal for creating a VPC.
 * Extracted from AdminVpcs for reuse across dashboards.
 */
const CreateVpcModal: React.FC<CreateVpcModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}) => {
  const [name, setName] = useState("");
  const [cidr, setCidr] = useState("10.0.0.0/16");
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = () => {
    if (!name || !cidr) return;
    onCreate(name, cidr, isDefault);
  };

  const handleClose = () => {
    setName("");
    setCidr("10.0.0.0/16");
    setIsDefault(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Create New VPC</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              VPC Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production VPC"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              CIDR Block *
            </label>
            <input
              type="text"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              placeholder="10.0.0.0/16"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-mono"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              Valid range: /16 to /28. Example: 10.0.0.0/16, 172.16.0.0/16
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Set as default VPC</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <ModernButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!name || !cidr || isCreating}
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create VPC"
            )}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default CreateVpcModal;
