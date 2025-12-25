import React from "react";
import { Shield } from "lucide-react";
import ModernCard from "../ui/ModernCard";

interface SecurityGroup {
  id: string;
  name?: string;
  description?: string;
  vpc_id?: string;
  inbound_rules_count?: number;
  outbound_rules_count?: number;
}

interface SecurityGroupsTableProps {
  securityGroups: SecurityGroup[];
  isLoading?: boolean;
  emptyMessage?: string;
  onViewRules?: (sg: SecurityGroup) => void;
  showActions?: boolean;
}

const SecurityGroupsTable: React.FC<SecurityGroupsTableProps> = ({
  securityGroups,
  isLoading = false,
  emptyMessage = "No security groups found",
  onViewRules,
  showActions = false,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (securityGroups.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              Description
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Inbound
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Outbound
            </th>
            {showActions && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {securityGroups.map((sg) => (
            <tr key={sg.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{sg.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500 font-mono">{sg.id}</div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">{sg.description || "-"}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  {sg.inbound_rules_count ?? 0} rules
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {sg.outbound_rules_count ?? 0} rules
                </span>
              </td>
              {showActions && onViewRules && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onViewRules(sg)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Rules
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

export default SecurityGroupsTable;
