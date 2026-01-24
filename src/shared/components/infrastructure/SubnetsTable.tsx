import React from "react";
import { Network } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import type { Subnet } from "./types";

interface SubnetsTableProps {
  subnets: Subnet[];
  isLoading?: boolean;
  showVpcColumn?: boolean;
  showDefaultBadge?: boolean;
  emptyMessage?: string;
  onDelete?: (subnet: Subnet) => void;
  showActions?: boolean;
}

const SubnetsTable: React.FC<SubnetsTableProps> = ({
  subnets,
  isLoading = false,
  showVpcColumn = true,
  showDefaultBadge = false,
  emptyMessage = "No subnets found",
  onDelete,
  showActions = false,
}) => {
  const getStateColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (subnets.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              CIDR Block
            </th>
            {showVpcColumn && (
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                VPC ID
              </th>
            )}
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              State
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Available IPs
            </th>
            {showActions && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {subnets.map((subnet) => (
            <tr key={subnet.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{subnet.name || "Unnamed"}</span>
                  {showDefaultBadge && subnet.is_default && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded">
                      DEFAULT
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono">{subnet.id}</div>
              </td>
              <td className="py-3 px-4 font-mono text-sm">{subnet.cidr_block || subnet.cidr}</td>
              {showVpcColumn && (
                <td className="py-3 px-4 font-mono text-xs text-gray-500">{subnet.vpc_id}</td>
              )}
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(subnet.state)}`}
                >
                  {subnet.state || "unknown"}
                </span>
              </td>
              <td className="py-3 px-4 text-sm">{subnet.available_ips ?? "-"}</td>
              {showActions && onDelete && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onDelete(subnet)}
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

export default SubnetsTable;
