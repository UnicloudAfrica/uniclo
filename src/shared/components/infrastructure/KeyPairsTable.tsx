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
  onCreate?: (name: string) => Promise<{ private_key?: string } | void>;
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
  onCreate,
  onDelete,
  onRefresh,
  isCreating = false,
  isDeleting = false,
  showHeader = true,
  title = "Key Pairs",
  description = "SSH key pairs for secure instance access",
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyPairName, setKeyPairName] = useState("");
  const [newPrivateKey, setNewPrivateKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!keyPairName.trim() || !onCreate) return;
    const result = await onCreate(keyPairName);
    if (result?.private_key) {
      setNewPrivateKey(result.private_key);
    } else {
      closeCreateModal();
    }
  };

  const handleCopyPrivateKey = () => {
    if (newPrivateKey) {
      navigator.clipboard.writeText(newPrivateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPrivateKey = () => {
    if (newPrivateKey) {
      const blob = new Blob([newPrivateKey], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${keyPairName}.pem`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setKeyPairName("");
    setNewPrivateKey(null);
    setCopied(false);
  };

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
              <ModernButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            {newPrivateKey ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Key Pair Created
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Download your private key now. You won't be able to
                    retrieve it again.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Private Key
                  </label>
                  <textarea
                    value={newPrivateKey}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs bg-gray-50"
                  />
                </div>
                <div className="flex gap-3">
                  <ModernButton
                    variant="secondary"
                    onClick={handleCopyPrivateKey}
                    className="flex-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleDownloadPrivateKey}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Download .pem
                  </ModernButton>
                </div>
                <ModernButton
                  variant="secondary"
                  onClick={closeCreateModal}
                  className="w-full mt-3"
                >
                  Done
                </ModernButton>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Key Pair</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Pair Name *
                    </label>
                    <input
                      type="text"
                      value={keyPairName}
                      onChange={(e) => setKeyPairName(e.target.value)}
                      placeholder="my-key-pair"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Alphanumeric characters, hyphens, and underscores only
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <ModernButton variant="secondary" onClick={closeCreateModal}>
                    Cancel
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!keyPairName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Key Pair"
                    )}
                  </ModernButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyPairsTable;
