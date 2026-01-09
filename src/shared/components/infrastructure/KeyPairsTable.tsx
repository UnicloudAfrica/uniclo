import React, { useState } from "react";
import { Plus, Trash2, RefreshCw, Key, Download, Copy, Check } from "lucide-react";
import ModernButton from "../ui/ModernButton";
import ModernCard from "../ui/ModernCard";

interface KeyPair {
  id: string;
  name: string;
  fingerprint?: string;
  created_at?: string;
  type?: string;
}

interface KeyPairsTableProps {
  keyPairs: KeyPair[];
  isLoading?: boolean;
  onCreate?: (name?: string) => void | Promise<{ private_key?: string } | void>;
  onDelete?: (keyPairId: string, keyPairName: string) => void;
  onRefresh?: () => void;
  isCreating?: boolean;
  isDeleting?: boolean;
  showHeader?: boolean;
  title?: string;
  description?: string;
}

const KeyPairsTable: React.FC<KeyPairsTableProps> = ({
  keyPairs = [],
  isLoading = false,
  onCreate, // Now used as a direct click handler (e.g., navigation)
  onDelete,
  onRefresh,
  isCreating = false,
  isDeleting = false,
  showHeader = true,
  title = "Key Pairs",
  description = "SSH key pairs for secure instance access",
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-6 h-6 text-purple-600" />
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <ModernButton variant="secondary" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </ModernButton>
            )}
            {onCreate && (
              <ModernButton variant="primary" size="sm" onClick={() => onCreate("")}>
                <Plus className="w-4 h-4" />
                Create Key Pair
              </ModernButton>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <ModernCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{keyPairs.length}</div>
            <div className="text-sm text-gray-500">Total Key Pairs</div>
          </div>
        </div>
      </ModernCard>

      {/* Table */}
      <ModernCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Fingerprint
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Created
                </th>
                {onDelete && (
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading Key Pairs...
                  </td>
                </tr>
              ) : keyPairs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 mb-1">No Key Pairs</div>
                    <div className="text-sm text-gray-400">
                      Create a key pair to enable SSH access to instances
                    </div>
                  </td>
                </tr>
              ) : (
                keyPairs.map((keyPair) => (
                  <tr key={keyPair.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900">{keyPair.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500 font-mono truncate max-w-[200px] block">
                        {keyPair.fingerprint || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {keyPair.type || "RSA"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {keyPair.created_at ? new Date(keyPair.created_at).toLocaleDateString() : "-"}
                    </td>
                    {onDelete && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDelete(keyPair.id, keyPair.name)}
                          disabled={isDeleting}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Key Pair"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>
    </div>
  );
};

export default KeyPairsTable;
