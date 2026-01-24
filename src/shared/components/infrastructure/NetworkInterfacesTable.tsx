// @ts-nocheck
import React from "react";
import { RefreshCw, Cable, Server, Globe2 } from "lucide-react";
import ModernCard from "../ui/ModernCard";

export interface NetworkInterface {
  id: string;
  network_interface_id?: string;
  description?: string;
  subnet_id?: string;
  vpc_id?: string;
  private_ip_address?: string;
  public_ip?: string;
  mac_address?: string;
  status?: string;
  attachment?: {
    instance_id?: string;
    device_index?: number;
    status?: string;
    attach_time?: string;
    delete_on_termination?: boolean;
  };
  security_groups?: Array<{ id?: string; name?: string }>;
}

interface NetworkInterfacesTableProps {
  networkInterfaces: NetworkInterface[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Shared Network Interfaces table component.
 * Pure presentation component for listing ENIs.
 */
const NetworkInterfacesTable: React.FC<NetworkInterfacesTableProps> = ({
  networkInterfaces = [],
  isLoading = false,
  emptyMessage = "No Network Interfaces found",
}) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "in-use":
        return "bg-green-100 text-green-700";
      case "available":
        return "bg-blue-100 text-blue-700";
      case "attaching":
      case "detaching":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <ModernCard className="p-12">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-gray-500 text-sm">Loading Network Interfaces...</div>
        </div>
      </ModernCard>
    );
  }

  if (networkInterfaces.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Cable className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <div className="text-gray-500 mb-1">{emptyMessage}</div>
        <div className="text-sm text-gray-400">
          Network interfaces are created automatically with instances
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Interface ID
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Private IP
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Public IP
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Attached To
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Subnet
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {networkInterfaces.map((eni) => (
              <tr key={eni.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-mono text-sm text-gray-900">
                    {eni.network_interface_id || eni.id}
                  </div>
                  {eni.description && (
                    <div
                      className="text-xs text-gray-400 truncate max-w-[200px]"
                      title={eni.description}
                    >
                      {eni.description}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-gray-600">
                    {eni.private_ip_address || "-"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {eni.public_ip ? (
                    <span className="font-mono text-sm text-gray-600 flex items-center gap-1">
                      <Globe2 className="w-3 h-3 text-green-500" />
                      {eni.public_ip}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {eni.attachment?.instance_id ? (
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-mono">{eni.attachment.instance_id}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not attached</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-gray-500 font-mono">{eni.subnet_id || "-"}</span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(eni.status)}`}
                  >
                    {eni.status || "Unknown"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModernCard>
  );
};

export default NetworkInterfacesTable;
