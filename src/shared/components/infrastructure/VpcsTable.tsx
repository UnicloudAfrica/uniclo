// @ts-nocheck
import React from "react";
import { Trash2, Network } from "lucide-react";
import ModernCard from "../ui/ModernCard";

export interface Vpc {
  id: string;
  name?: string;
  cidr_block?: string;
  cidr?: string;
  state?: string;
  status?: string;
  is_default?: boolean;
  region?: string;
}

interface VpcsTableProps {
  vpcs: Vpc[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (vpc: Vpc) => void;
  showDefaultBadge?: boolean;
  showActions?: boolean;
}

/**
 * Shared VPCs table component with permission-based action gating.
 */
const VpcsTable: React.FC<VpcsTableProps> = ({
  vpcs,
  isLoading = false,
  emptyMessage = "No VPCs found for this project",
  onDelete,
  showDefaultBadge = true,
  showActions = true,
}) => {
  if (isLoading) {
    return (
      <ModernCard className="p-12">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-gray-500 text-sm">Loading VPCs...</div>
        </div>
      </ModernCard>
    );
  }

  if (vpcs.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <div className="text-gray-500">{emptyMessage}</div>
      </ModernCard>
    );
  }

  const getStatusColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case "available":
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
      case "creating":
        return "bg-yellow-100 text-yellow-700";
      case "deleting":
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

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
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Status
            </th>
            {showDefaultBadge && (
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Default
              </th>
            )}
            {showActions && onDelete && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vpcs.map((vpc) => (
            <tr key={vpc.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{vpc.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500 font-mono">{vpc.id}</div>
              </td>
              <td className="py-3 px-4 font-mono text-sm">{vpc.cidr_block || vpc.cidr || "—"}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    vpc.state || vpc.status
                  )}`}
                >
                  {vpc.state || vpc.status || "unknown"}
                </span>
              </td>
              {showDefaultBadge && (
                <td className="py-3 px-4">
                  {vpc.is_default ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Default
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              )}
              {showActions && onDelete && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onDelete(vpc)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                    title="Delete VPC"
                  >
                    <Trash2 className="w-4 h-4" />
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

export default VpcsTable;
