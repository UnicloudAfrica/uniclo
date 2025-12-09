// @ts-nocheck
import React from "react";
import { X } from "lucide-react";

interface ViewIgwModalProps {
  isOpen: boolean;
  onClose: () => void;
  igw: any;
}

const ViewIgwModal: React.FC<ViewIgwModalProps> = ({ isOpen, onClose, igw }: any) => {
  if (!isOpen || !igw) return null;

  const meta = igw.meta || {};
  const tags = Array.isArray(igw.tags) ? igw.tags : [];
  const displayName = igw.name || igw.provider_resource_id || `igw-${igw.id}`;
  const status = igw.status || igw.state || "unknown";
  const attachedVpc = igw.attached_vpc_id || meta.vpc_id || "None";
  const accountId = meta.account_id || "—";
  const createdAt = meta.created_at || igw.created_at || "—";
  const updatedAt = meta.updated_at || igw.updated_at || "—";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[560px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Internet Gateway Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm text-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500">Name</div>
              <div className="text-gray-900">{displayName}</div>
            </div>
            <div>
              <div className="text-gray-500">ID</div>
              <div className="text-gray-900">{igw.id}</div>
            </div>
            <div>
              <div className="text-gray-500">Provider ID</div>
              <div className="text-gray-900 break-all">{igw.provider_resource_id || "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Region</div>
              <div className="text-gray-900">{igw.region || "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">State</div>
              <div className="text-gray-900 capitalize">{status}</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">VPC Attached</div>
              <div className="text-gray-900 break-all">{attachedVpc}</div>
            </div>
            <div>
              <div className="text-gray-500">Account ID</div>
              <div className="text-gray-900 break-all">{accountId}</div>
            </div>
            <div>
              <div className="text-gray-500">Created At</div>
              <div className="text-gray-900">{createdAt}</div>
            </div>
            <div>
              <div className="text-gray-500">Updated At</div>
              <div className="text-gray-900">{updatedAt}</div>
            </div>
            {tags.length > 0 && (
              <div className="col-span-2">
                <div className="text-gray-500">Tags</div>
                <div className="text-gray-900 break-all">{tags.join(", ")}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewIgwModal;
