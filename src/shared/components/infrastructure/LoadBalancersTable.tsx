import React from "react";
import { Globe, Layers, Shield, Trash2, Zap } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import ModernButton from "../ui/ModernButton";
import type { LoadBalancer } from "./types";

interface LoadBalancersTableProps {
  loadBalancers: LoadBalancer[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (lb: LoadBalancer) => void;
  onManage?: (lb: LoadBalancer) => void;
  showActions?: boolean;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700";
    case "pending":
    case "creating":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
    case "error":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const LoadBalancersTable: React.FC<LoadBalancersTableProps> = ({
  loadBalancers,
  isLoading = false,
  emptyMessage = "No Load Balancers found for this project",
  onDelete,
  onManage,
  showActions,
}) => {
  const shouldShowActions = showActions ?? Boolean(onDelete || onManage);

  if (isLoading) {
    return (
      <ModernCard className="p-12">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-gray-500 text-sm">Loading Load Balancers...</div>
        </div>
      </ModernCard>
    );
  }

  if (loadBalancers.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              Name & DNS
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Type
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Networking
            </th>
            {shouldShowActions && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loadBalancers.map((lb) => (
            <tr key={lb.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{lb.name || "Unnamed"}</div>
                <div
                  className="text-xs text-gray-500 font-mono truncate max-w-xs"
                  title={lb.dns_name || "Assigning..."}
                >
                  {lb.dns_name || "Pending DNS assignment"}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {lb.lb_type === "network" ? (
                    <Layers className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Globe className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-sm capitalize font-medium">
                    {lb.lb_type || "Application"}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    lb.status || lb.state
                  )}`}
                >
                  {lb.status || lb.state || "Unknown"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm text-gray-900 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-gray-400" />
                  {lb.is_external ? "Internet-facing" : "Internal"}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  VPC: {lb.vpc_id ? `${lb.vpc_id.substring(0, 8)}...` : "N/A"}
                </div>
              </td>
              {shouldShowActions && (
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    {onManage && (
                      <ModernButton variant="secondary" size="sm" onClick={() => onManage(lb)}>
                        Manage
                      </ModernButton>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(lb)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Load Balancer"
                      >
                        <span className="sr-only">Delete</span>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ModernCard>
  );
};

export default LoadBalancersTable;
