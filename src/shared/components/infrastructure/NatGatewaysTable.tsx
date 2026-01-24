import React from "react";
import { Globe } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import type { NatGateway } from "./types";

interface NatGatewaysTableProps {
  natGateways: NatGateway[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (nat: NatGateway) => void;
  showActions?: boolean;
}

const NatGatewaysTable: React.FC<NatGatewaysTableProps> = ({
  natGateways,
  isLoading = false,
  emptyMessage = "No NAT gateways found",
  onDelete,
  showActions = false,
}) => {
  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "deleting":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (natGateways.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <div className="text-gray-500">{emptyMessage}</div>
      </ModernCard>
    );
  }

  return (
    <ModernCard className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Name
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Subnet ID
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Public IP
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              State
            </th>
            {showActions && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {natGateways.map((nat) => (
            <tr key={nat.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{nat.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500 font-mono">{nat.id}</div>
              </td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{nat.subnet_id}</td>
              <td className="py-3 px-4 font-mono text-sm">{nat.public_ip || "-"}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(nat.state)}`}
                >
                  {nat.state || "unknown"}
                </span>
              </td>
              {showActions && onDelete && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onDelete(nat)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ModernCard>
  );
};

export default NatGatewaysTable;
