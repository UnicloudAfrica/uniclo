import React from "react";
import { Globe2 } from "lucide-react";
import ModernCard from "../ui/ModernCard";

interface ElasticIp {
  id: string;
  public_ip?: string;
  instance_id?: string;
  network_interface_id?: string;
  association_id?: string;
  domain?: string;
}

interface ElasticIpsTableProps {
  elasticIps: ElasticIp[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAssociate?: (eip: ElasticIp) => void;
  onDisassociate?: (eip: ElasticIp) => void;
  onRelease?: (eip: ElasticIp) => void;
  showActions?: boolean;
}

const ElasticIpsTable: React.FC<ElasticIpsTableProps> = ({
  elasticIps,
  isLoading = false,
  emptyMessage = "No elastic IPs found",
  onAssociate,
  onDisassociate,
  onRelease,
  showActions = false,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (elasticIps.length === 0) {
    return (
      <ModernCard className="p-12 text-center">
        <Globe2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              Public IP
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Instance ID
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
              Network Interface
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
          {elasticIps.map((eip) => (
            <tr key={eip.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-mono font-medium text-gray-900">{eip.public_ip}</div>
                <div className="text-xs text-gray-500">{eip.id}</div>
              </td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">
                {eip.instance_id || "-"}
              </td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">
                {eip.network_interface_id || "-"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    eip.association_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {eip.association_id ? "Associated" : "Available"}
                </span>
              </td>
              {showActions && (
                <td className="py-3 px-4 text-right space-x-2">
                  {!eip.association_id && onAssociate && (
                    <button
                      onClick={() => onAssociate(eip)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Associate
                    </button>
                  )}
                  {eip.association_id && onDisassociate && (
                    <button
                      onClick={() => onDisassociate(eip)}
                      className="text-xs text-yellow-600 hover:text-yellow-800"
                    >
                      Disassociate
                    </button>
                  )}
                  {!eip.association_id && onRelease && (
                    <button
                      onClick={() => onRelease(eip)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Release
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

export default ElasticIpsTable;
