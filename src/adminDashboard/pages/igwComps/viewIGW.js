import { X } from "lucide-react";

const ViewIgwModal = ({ isOpen, onClose, igw }) => {
  if (!isOpen || !igw) return null;
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
              <div className="text-gray-900">{igw.name || `igw-${igw.id}`}</div>
            </div>
            <div>
              <div className="text-gray-500">ID</div>
              <div className="text-gray-900">{igw.id}</div>
            </div>
            <div>
              <div className="text-gray-500">Region</div>
              <div className="text-gray-900">{igw.region}</div>
            </div>
            <div>
              <div className="text-gray-500">State</div>
              <div className="text-gray-900 capitalize">{igw.state}</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">VPC Attached</div>
              <div className="text-gray-900">{igw.attachments?.[0]?.vpc_id || "None"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewIgwModal;