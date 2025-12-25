import React from "react";
import { RefreshCw, Cable, Server, Globe2, Network } from "lucide-react";
import ModernButton from "../ui/ModernButton";
import ModernCard from "../ui/ModernCard";

interface NetworkInterface {
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
  };
  security_groups?: Array<{ id?: string; name?: string }>;
}

interface NetworkInterfacesTableProps {
  networkInterfaces: NetworkInterface[];
  isLoading?: boolean;
  onRefresh?: () => void;
  showHeader?: boolean;
  title?: string;
  description?: string;
}

const NetworkInterfacesTable: React.FC<NetworkInterfacesTableProps> = ({
  networkInterfaces = [],
  isLoading = false,
  onRefresh,
  showHeader = true,
  title = "Network Interfaces",
  description = "Virtual network cards attached to your instances",
}) => {
  const attachedCount = networkInterfaces.filter((eni) => eni.attachment?.instance_id).length;
  const availableCount = networkInterfaces.length - attachedCount;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Cable className="w-6 h-6 text-orange-600" />
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          {onRefresh && (
            <ModernButton variant="secondary" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </ModernButton>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Cable className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{networkInterfaces.length}</div>
              <div className="text-sm text-gray-500">Total Interfaces</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{attachedCount}</div>
              <div className="text-sm text-gray-500">Attached</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{availableCount}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Table */}
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading Network Interfaces...
                  </td>
                </tr>
              ) : networkInterfaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Cable className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 mb-1">No Network Interfaces</div>
                    <div className="text-sm text-gray-400">
                      Network interfaces are created automatically with instances
                    </div>
                  </td>
                </tr>
              ) : (
                networkInterfaces.map((eni) => (
                  <tr key={eni.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm text-gray-900">
                        {eni.network_interface_id || eni.id}
                      </div>
                      {eni.description && (
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">
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
                      <span className="text-xs text-gray-500 font-mono">
                        {eni.subnet_id || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(eni.status)}`}
                      >
                        {eni.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {/* Info Note */}
      <ModernCard className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Cable className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Network Interfaces</h4>
            <p className="text-sm text-blue-700 mt-1">
              Network interfaces (ENIs) are automatically created when you launch instances for the
              primary network connection. You can attach additional ENIs for multi-homed instances,
              failover capabilities, or to separate management and data traffic.
            </p>
          </div>
        </div>
      </ModernCard>
    </div>
  );
};

export default NetworkInterfacesTable;
