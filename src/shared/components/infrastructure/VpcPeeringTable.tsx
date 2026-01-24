import React from "react";
import { GitMerge } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import type { VpcPeeringConnection } from "./types";

interface VpcPeeringTableProps {
  peeringConnections: VpcPeeringConnection[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAccept?: (pc: VpcPeeringConnection) => void;
  onReject?: (pc: VpcPeeringConnection) => void;
  onDelete?: (pc: VpcPeeringConnection) => void;
  showActions?: boolean;
}

const VpcPeeringTable: React.FC<VpcPeeringTableProps> = ({
  peeringConnections,
  isLoading = false,
  emptyMessage = "No VPC peering connections found",
  onAccept,
  onReject,
  onDelete,
  showActions = false,
}) => {
  const resolveStatus = (status?: string | { code?: string }) =>
    typeof status === "string" ? status : status?.code;

  const getStatusColor = (status?: string | { code?: string }) => {
    const statusValue = resolveStatus(status);
    switch (statusValue?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending-acceptance":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (peeringConnections.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <GitMerge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              Requester VPC
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Accepter VPC
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Status
            </th>
            {showActions && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {peeringConnections.map((pc) => (
            <tr key={pc.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{pc.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500 font-mono">{pc.id}</div>
              </td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{pc.requester_vpc_id}</td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{pc.accepter_vpc_id}</td>
              <td className="py-3 px-4">
                {(() => {
                  const statusValue = resolveStatus(pc.status);
                  return (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        pc.status
                      )}`}
                    >
                      {statusValue || "unknown"}
                    </span>
                  );
                })()}
              </td>
              {showActions && (
                <td className="py-3 px-4 text-right space-x-2">
                  {resolveStatus(pc.status)?.toLowerCase() === "pending-acceptance" && (
                    <>
                      {onAccept && (
                        <button
                          onClick={() => onAccept(pc)}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Accept
                        </button>
                      )}
                      {onReject && (
                        <button
                          onClick={() => onReject(pc)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Reject
                        </button>
                      )}
                    </>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(pc)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ModernCard>
  );
};

export default VpcPeeringTable;
