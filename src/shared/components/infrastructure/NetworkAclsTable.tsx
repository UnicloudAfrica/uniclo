import React from "react";
import { ShieldCheck } from "lucide-react";
import ModernCard from "../ui/ModernCard";

interface NetworkAcl {
  id: string;
  name?: string;
  vpc_id?: string;
  is_default?: boolean;
  entries?: Array<any>;
}

interface NetworkAclsTableProps {
  networkAcls: NetworkAcl[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (acl: NetworkAcl) => void;
  showActions?: boolean;
}

const NetworkAclsTable: React.FC<NetworkAclsTableProps> = ({
  networkAcls,
  isLoading = false,
  emptyMessage = "No network ACLs found",
  onDelete,
  showActions = false,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (networkAcls.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              VPC ID
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Default
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Entries
            </th>
            {showActions && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {networkAcls.map((acl) => (
            <tr key={acl.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{acl.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500 font-mono">{acl.id}</div>
              </td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{acl.vpc_id}</td>
              <td className="py-3 px-4">
                {acl.is_default ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Default
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {acl.entries?.length ?? 0} rules
                </span>
              </td>
              {showActions && !acl.is_default && onDelete && (
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onDelete(acl)}
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

export default NetworkAclsTable;
