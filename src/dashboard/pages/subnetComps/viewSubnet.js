import { X } from "lucide-react";

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm text-gray-700">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-900">{value ?? "N/A"}</span>
  </div>
);

const ViewSubnetModal = ({ isOpen, onClose, subnet }) => {
  if (!isOpen || !subnet) return null;

  const details = {
    Name: subnet.name,
    "CIDR Block": subnet.cidr_block || subnet.cidr,
    Region: subnet.region,
    "VPC ID":
      subnet.vpc_id ||
      subnet.network_id ||
      subnet.vpc?.provider_resource_id ||
      subnet.vpc?.id,
    State: subnet.state,
    "Provider ID": subnet.provider_resource_id,
    "Availability Zone": subnet.availability_zone,
    "Created At": subnet.created_at,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[540px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Subnet Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-3">
          {Object.entries(details).map(([label, value]) => (
            <Row key={label} label={label} value={value || "—"} />
          ))}
          {subnet.meta && (
            <div className="mt-4">
              <p className="font-medium text-sm text-gray-600 mb-2">Metadata</p>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(subnet.meta, null, 2)}
              </pre>
            </div>
          )}
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

export default ViewSubnetModal;
