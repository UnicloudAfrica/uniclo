// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ModernButton from "../../ui/ModernButton";

interface Vpc {
  id: string;
  name?: string;
  cidr_block?: string;
}

interface CreateSubnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, cidrBlock: string, vpcId: string) => void;
  isCreating?: boolean;
  vpcs: Vpc[];
}

/**
 * Modal for creating a Subnet.
 * Extracted from AdminSubnets for reuse across dashboards.
 */
const CreateSubnetModal: React.FC<CreateSubnetModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
  vpcs,
}) => {
  const [subnetName, setSubnetName] = useState("");
  const [cidrBlock, setCidrBlock] = useState("");
  const [vpcId, setVpcId] = useState("");

  const handleSubmit = () => {
    if (!subnetName || !cidrBlock || !vpcId) return;
    onCreate(subnetName, cidrBlock, vpcId);
  };

  const handleClose = () => {
    setSubnetName("");
    setCidrBlock("");
    setVpcId("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Create New Subnet</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">
              Subnet Name
            </label>
            <input
              type="text"
              value={subnetName}
              onChange={(e) => setSubnetName(e.target.value)}
              placeholder="e.g. production-public-1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
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
              CIDR Block *
            </label>
            <input
              required
              type="text"
              value={cidrBlock}
              onChange={(e) => setCidrBlock(e.target.value)}
              placeholder="10.0.1.0/24"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-mono"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              Must be a subset of the VPC's CIDR range.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <ModernButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!subnetName || !cidrBlock || !vpcId || isCreating}
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Subnet"
            )}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default CreateSubnetModal;
