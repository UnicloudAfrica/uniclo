// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";

interface Vpc {
  id: string;
  name?: string;
  cidr_block?: string;
}

interface CreateSecurityGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, vpcId: string) => void;
  isCreating?: boolean;
  vpcs: Vpc[];
}

/**
 * Modal for creating a Security Group.
 * Extracted from AdminSecurityGroups for reuse across dashboards.
 */
const CreateSecurityGroupModal: React.FC<CreateSecurityGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
  vpcs,
}) => {
  const [sgName, setSgName] = useState("");
  const [sgDesc, setSgDesc] = useState("");
  const [vpcId, setVpcId] = useState("");

  const handleSubmit = () => {
    if (!sgName || !vpcId) return;
    onCreate(sgName, sgDesc, vpcId);
  };

  const handleClose = () => {
    setSgName("");
    setSgDesc("");
    setVpcId("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Create Security Group</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              SG Name *
            </label>
            <input
              type="text"
              value={sgName}
              onChange={(e) => setSgName(e.target.value)}
              placeholder="e.g. web-server-sg"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              VPC *
            </label>
            <select
              required
              value={vpcId}
              onChange={(e) => setVpcId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
            >
              <option value="">Select a VPC</option>
              {vpcs.map((vpc) => (
                <option key={vpc.id} value={vpc.id}>
                  {vpc.name || vpc.id} ({vpc.cidr_block})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              Description
            </label>
            <textarea
              value={sgDesc}
              onChange={(e) => setSgDesc(e.target.value)}
              placeholder="Allow public web traffic"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <ModernButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!sgName || !vpcId || isCreating}
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Security Group"
            )}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default CreateSecurityGroupModal;
