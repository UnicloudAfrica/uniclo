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

interface ViewVpcModalProps {
  isOpen: boolean;
  onClose: () => void;
  vpc?: any;
}

const ViewVpcModal: React.FC<ViewVpcModalProps> = ({ isOpen, onClose, vpc }: any) => {
  if (!isOpen || !vpc) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">VPC Details: {vpc.name}</h2>
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
                <span className="font-medium text-gray-700">ID:</span> {vpc.id}
              </div>
              <div>
                <span className="font-medium text-gray-700">Provider:</span>{" "}
                {typeof vpc.provider === "string" && vpc.provider.trim() !== ""
                  ? vpc.provider.toUpperCase()
                  : "N/A"}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">UUID:</span> {vpc.uuid}
              </div>
              <div>
                <span className="font-medium text-gray-700">Region:</span> {vpc.region}
              </div>
              <div>
                <span className="font-medium text-gray-700">CIDR Block:</span> {vpc.cidr_block}
              </div>
              <div>
                <span className="font-medium text-gray-700">Default:</span>{" "}
                {vpc.is_default ? "Yes" : "No"}
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-2">State:</span>{" "}
                <Badge text={vpc.state} />
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 mr-2">Status:</span>{" "}
                <Badge text={vpc.status} />
              </div>
              <div>
                <span className="font-medium text-gray-700">Created At:</span>{" "}
                {new Date(vpc.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-700">Updated At:</span>{" "}
                {new Date(vpc.updated_at).toLocaleString()}
              </div>
              {vpc.description && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Description:</span> {vpc.description}
                </div>
              )}
            </div>

            {/* Metadata Section */}
            {vpc.metadata && (
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Metadata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Enable DNS Support:</span>{" "}
                    {vpc.metadata.enable_dns_support ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Enable DNS Hostnames:</span>{" "}
                    {vpc.metadata.enable_dns_hostnames ? "Yes" : "No"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">DHCP Options ID:</span>{" "}
                    {vpc.metadata.dhcp_options_id}
                  </div>

                  {/* CIDR Associations */}
                  {vpc.metadata.cidr_assocs_set?.length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-medium text-gray-700 mt-2 mb-1">CIDR Associations:</h4>
                      <ul className="list-disc list-inside pl-2 space-y-1">
                        {vpc.metadata.cidr_assocs_set.map((assoc: any) => (
                          <li key={assoc.cidr_assoc_id}>
                            {assoc.cidr_block} - <Badge text={assoc.state} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Service VMs */}
                  {vpc.metadata.service_vms?.length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-medium text-gray-700 mt-2 mb-1">Service VMs:</h4>
                      <ul className="list-disc list-inside pl-2 space-y-1">
                        {vpc.metadata.service_vms.map((vm: any) => (
                          <li key={vm.id}>
                            {vm.vm_type} ({vm.id.substring(0, 8)}...) - <Badge text={vm.status} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
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
