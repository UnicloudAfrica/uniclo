// @ts-nocheck
import React from "react";
import { X, Copy } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";

interface BadgeProps {
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ text }: any) => {
  const badgeClasses: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    available: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    associated: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };
  const badgeClass = badgeClasses[text?.toLowerCase()] || badgeClasses.default;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${badgeClass}`}>
      {text}
    </span>
  );
};

interface DetailRowProps {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
  isCopyable?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, children, isCopyable = false }) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(String(value));
      ToastUtils.success("Copied to clipboard!");
    }
  };

  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 flex items-center text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <span className="flex-grow break-words">{value || children || "N/A"}</span>

        {isCopyable && value && (
          <button
            onClick={handleCopy}
            className="ml-2 p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-[--theme-color] transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </dd>
    </div>
  );
};

interface ViewSubnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  subnet?: any;
}

const ViewSubnetModal: React.FC<ViewSubnetModalProps> = ({ isOpen, onClose, subnet }: any) => {
  if (!isOpen || !subnet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Subnet Details: {subnet.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 max-h-[400px] overflow-y-auto">
          <div className="space-y-6 text-sm">
            {/* General Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="font-medium text-gray-700">ID:</span> {subnet.id}
              </div>
              <div>
                <span className="font-medium text-gray-700">VPC ID:</span> {subnet.vpc_id || "N/A"}
              </div>
              <div>
                <span className="font-medium text-gray-700">CIDR Block:</span> {subnet.cidr_block}
              </div>
              <div>
                <span className="font-medium text-gray-700">Region:</span> {subnet.region}
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-2">State:</span>{" "}
                <Badge text={subnet.state} />
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-2">Status:</span>{" "}
                <Badge text={subnet.status} />
              </div>

              {subnet.availability_zone && (
                <div>
                  <span className="font-medium text-gray-700">Availability Zone:</span>{" "}
                  {subnet.availability_zone}
                </div>
              )}
              {subnet.available_ip_address_count !== undefined && (
                <div>
                  <span className="font-medium text-gray-700">Available IPs:</span>{" "}
                  {subnet.available_ip_address_count}
                </div>
              )}

              <div>
                <span className="font-medium text-gray-700">Created At:</span>{" "}
                {subnet.created_at ? new Date(subnet.created_at).toLocaleString() : "N/A"}
              </div>

              {subnet.description && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Description:</span>{" "}
                  {subnet.description}
                </div>
              )}
            </div>
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

export default ViewSubnetModal;
