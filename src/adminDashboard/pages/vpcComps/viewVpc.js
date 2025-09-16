import { X } from "lucide-react";

const ViewVpcModal = ({ isOpen, onClose, vpc }) => {
  if (!isOpen || !vpc) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            VPC Details: {vpc.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 max-h-[400px] overflow-y-auto">
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium text-gray-700">ID:</span> {vpc.id}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">UUID:</span>{" "}
              {vpc.uuid}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Provider:</span>{" "}
              {vpc.provider.toUpperCase()}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Region:</span>{" "}
              {vpc.region}
            </p>
            <p className="text-sm break-words">
              <span className="font-medium text-gray-700">CIDR Block:</span>{" "}
              {vpc.cidr_block}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Default:</span>{" "}
              {vpc.is_default ? "Yes" : "No"}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">State:</span>{" "}
              {vpc.state}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Status:</span>{" "}
              {vpc.status}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Created At:</span>{" "}
              {new Date(vpc.created_at).toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Updated At:</span>{" "}
              {new Date(vpc.updated_at).toLocaleString()}
            </p>
            {vpc.description && (
              <p className="text-sm">
                <span className="font-medium text-gray-700">Description:</span>{" "}
                {vpc.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewVpcModal;
