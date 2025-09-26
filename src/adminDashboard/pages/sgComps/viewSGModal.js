import { X, Copy } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";

const DetailRow = ({ label, value, children, isCopyable = false }) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      ToastUtils.success("Copied to clipboard!");
    }
  };

  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 flex items-center text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <span className="flex-grow break-words">
          {value || children || "N/A"}
        </span>
        {isCopyable && value && (
          <button
            onClick={handleCopy}
            className="ml-2 p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </dd>
    </div>
  );
};

const ViewSGModal = ({ isOpen, onClose, securityGroup }) => {
  if (!isOpen || !securityGroup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Security Group Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          <dl className="divide-y divide-gray-200">
            <DetailRow label="Name" value={securityGroup.name} />
            <DetailRow label="ID" value={securityGroup.id} />
            <DetailRow
              label="Provider Resource ID"
              value={securityGroup.provider_resource_id}
              isCopyable
            />
            <DetailRow label="Description" value={securityGroup.description} />
            <DetailRow
              label="Provider"
              value={securityGroup.provider?.toUpperCase()}
            />
            <DetailRow label="Region" value={securityGroup.region} />
            <DetailRow label="Project ID" value={securityGroup.project_id} />
            <DetailRow label="Tenant ID" value={securityGroup.tenant_id} />

            {/* Rules Section */}
            <DetailRow label="Rules">
              {securityGroup.rules && securityGroup.rules.length > 0 ? (
                <ul className="space-y-2">
                  {securityGroup.rules.map((rule, index) => (
                    <li key={index} className="text-xs bg-gray-100 p-2 rounded">
                      {/* Customize rule display as needed */}
                      <pre>{JSON.stringify(rule, null, 2)}</pre>
                    </li>
                  ))}
                </ul>
              ) : (
                "No rules defined."
              )}
            </DetailRow>
          </dl>
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

export default ViewSGModal;
