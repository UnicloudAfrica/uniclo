import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Trash2,
  HardDrive,
  Plus,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Key,
  Globe,
  Calendar,
  BarChart3,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Download,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";
import StorageGauge3D from "./StorageGauge3D";
import ObjectStorageCredentials from "./ObjectStorageCredentials";
import ExtendStorageModal from "./ExtendStorageModal";

interface Silo {
  id: string | number;
  name: string;
}

interface AccessKey {
  id: string | number;
  key_id: string;
  secret_once?: string;
  can_reveal_secret?: boolean;
}

interface ObjectStorageAccount {
  id: string | number;
  name: string;
  region?: string;
  endpoint?: string;
  created_at?: string;
  access_keys?: AccessKey[];
}

interface ObjectStorageSidebarProps {
  account: ObjectStorageAccount | null;
  buckets: Silo[];
  selectedBucket: string | null;
  onSelectBucket: (bucketName: string | null) => void;
  onDeleteBucket: (bucket: Silo) => void;
  deletingBucketId: string | number | null;
  onRefresh: () => void;
  objectCount: number;
  usedGb: number;
  quotaGb: number;
}

const ObjectStorageSidebar: React.FC<ObjectStorageSidebarProps> = ({
  account,
  buckets,
  selectedBucket,
  onSelectBucket,
  onDeleteBucket,
  deletingBucketId,
  onRefresh,
  objectCount,
  usedGb,
  quotaGb,
}) => {
  const [showBucketForm, setShowBucketForm] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [showCredentials, setShowCredentials] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Rotation state
  const [isRotating, setIsRotating] = useState(false);
  const [newAccessKey, setNewAccessKey] = useState<AccessKey | null>(null);
  const [rotationError, setRotationError] = useState<string | null>(null);
  const [rotationConfirmed, setRotationConfirmed] = useState(false);
  const [isRevokingOldKey, setIsRevokingOldKey] = useState(false);
  const [, setRotatingKeyId] = useState<string | number | null>(null);

  // Reveal state
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealingSecret, setRevealingSecret] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [secretViewed, setSecretViewed] = useState(false);

  const endpoint = account?.endpoint;
  const accessKey = account?.access_keys?.[0];
  const accessKeyId = accessKey?.key_id;
  const canRevealSecret = accessKey?.can_reveal_secret;

  useEffect(() => {
    if (copiedField) {
      const timer = setTimeout(() => setCopiedField(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedField]);

  const copyToClipboard = (text: string | undefined, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    ToastUtils.success(`${field.charAt(0).toUpperCase() + field.slice(1)} copied to clipboard`);
  };

  const downloadCredentials = () => {
    if (!revealedSecret) return;
    downloadCredentialsFor({
      endpoint,
      accessKeyId,
      secretKey: revealedSecret,
      label: account?.name || "storage",
    });
  };

  const downloadCredentialsFor = ({
    endpoint,
    accessKeyId,
    secretKey,
    label,
  }: {
    endpoint?: string | undefined;
    accessKeyId?: string | undefined;
    secretKey?: string | undefined;
    label?: string | undefined;
  }) => {
    const normalizedLabel = String(label || account?.name || "storage")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const content = `# Silo Storage Credentials
# Account: ${label || account?.name || "Storage"}
# Downloaded: ${new Date().toISOString()}
# ⚠️ WARNING: Keep this file secure and never share it!

ENDPOINT=${endpoint || ""}
ACCESS_KEY_ID=${accessKeyId || ""}
SECRET_ACCESS_KEY=${secretKey || ""}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s3-credentials-${normalizedLabel || "storage"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    ToastUtils.success("Credentials downloaded. Store this file securely!");
  };

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.id || !newBucketName.trim()) return;

    setCreatingBucket(true);
    try {
      await objectStorageApi.createBucket(account.id, { name: newBucketName.trim() });
      setNewBucketName("");
      setShowBucketForm(false);
      onRefresh();
      ToastUtils.success("Silo created successfully!");
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Failed to create silo");
    } finally {
      setCreatingBucket(false);
    }
  };

  const handleRevealSecret = async () => {
    if (!account?.id || !accessKey?.id) return;
    setRevealingSecret(true);
    try {
      const data = (await objectStorageApi.revealSecretKey(account.id, accessKey.id)) as any;
      setRevealedSecret(data.secret_key);
      setSecretViewed(true);
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Failed to reveal secret key");
    } finally {
      setRevealingSecret(false);
    }
  };

  const handleRotateAccessKey = async () => {
    if (!account?.id) return;
    setIsRotating(true);
    setRotationError(null);
    try {
      const data = await objectStorageApi.createAccessKey(account.id);
      setNewAccessKey(data as AccessKey);
      setRotatingKeyId(accessKey?.id || null);
      ToastUtils.success("New access key created. Please save it before deactivating the old one.");
    } catch (err) {
      setRotationError(err instanceof Error ? err.message : "Failed to rotate access key");
    } finally {
      setIsRotating(false);
    }
  };

  const handleRevokeOldKey = async () => {
    if (!account?.id || !accessKey?.id) return;
    setIsRevokingOldKey(true);
    try {
      await objectStorageApi.revokeAccessKey(account.id, accessKey.id);
      setNewAccessKey(null);
      setRotationConfirmed(false);
      setRotatingKeyId(null);
      onRefresh();
      ToastUtils.success("Old access key deactivated successfully.");
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Failed to deactivate old access key");
    } finally {
      setIsRevokingOldKey(false);
    }
  };

  const [showExtendModal, setShowExtendModal] = useState(false);

  const renderBucketList = () => {
    if (buckets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Database className="h-8 w-8 text-gray-300 mb-2" />
          <p className="mt-2 text-sm text-gray-500">No silos yet</p>
        </div>
      );
    }

    return (
      <div>
        {buckets.map((bucket) => (
          <button
            key={bucket.id}
            onClick={() => onSelectBucket(bucket.name ?? null)}
            onKeyDown={(e) => e.key === "Enter" && onSelectBucket(bucket.name ?? null)}
            className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 ${
              selectedBucket === bucket.name
                ? "bg-primary-50 border-l-2 border-l-primary-500"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Database
                className={`h-4 w-4 flex-shrink-0 ${selectedBucket === bucket.name ? "text-primary-600" : "text-gray-400"}`}
              />
              <span
                className={`text-sm truncate ${selectedBucket === bucket.name ? "font-medium text-primary-700" : "text-gray-700"}`}
              >
                {bucket.name}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBucket(bucket);
              }}
              disabled={deletingBucketId === bucket.id}
              className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deletingBucketId === bucket.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Storage Overview Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
          Storage Overview
        </h3>

        {/* 3D Gauge */}
        <div className="flex justify-center mb-4">
          <StorageGauge3D usedGb={usedGb} totalGb={quotaGb} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
              <HardDrive className="h-3.5 w-3.5" />
              <span className="text-xs">Objects</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{objectCount}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="text-xs">Silos</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{buckets.length}</p>
          </div>
        </div>

        {/* Region & Created */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Region
            </span>
            <span className="font-medium text-gray-700">{account?.region || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created
            </span>
            <span className="font-medium text-gray-700">
              {account?.created_at ? new Date(account.created_at).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>

        {/* Extend Storage Actions */}
        <button
          onClick={() => setShowExtendModal(true)}
          className={`w-full mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            usedGb / quotaGb > 0.8
              ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-sm"
              : "border border-primary-200 text-primary-600 hover:bg-primary-50"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          {usedGb / quotaGb > 0.8 ? "Extend Storage" : "Add More Storage"}
        </button>
      </div>

      {/* Credentials Section (Collapsible) */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-500" />
            S3 Credentials
          </span>
          {showCredentials ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {showCredentials && (
          <div className="px-4 pb-4 space-y-3">
            {endpoint && (
              <div>
                <label htmlFor="s3-endpoint" className="block text-xs text-gray-500 mb-1">
                  Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <code
                    id="s3-endpoint"
                    className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded font-mono truncate"
                  >
                    {endpoint}
                  </code>
                  <button
                    onClick={() => copyToClipboard(endpoint, "endpoint")}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    {copiedField === "endpoint" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {accessKeyId && (
              <div>
                <label htmlFor="s3-access-key" className="block text-xs text-gray-500 mb-1">
                  Access Key ID
                </label>
                <div className="flex items-center gap-2">
                  <code
                    id="s3-access-key"
                    className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded font-mono truncate"
                  >
                    {accessKeyId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(accessKeyId, "accessKey")}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    {copiedField === "accessKey" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="s3-secret-key" className="block text-xs text-gray-500 mb-1">
                Secret Access Key
              </label>
              {canRevealSecret && !secretViewed ? (
                <button
                  onClick={() => setShowRevealModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Click to Reveal (One-Time Only)
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs bg-gray-100 px-2 py-2 rounded text-gray-500">
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Secret key already viewed or not available</span>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rotate Access Key
                  </p>
                  <p className="text-xs text-gray-500">
                    Create a new key, update your apps, then deactivate the old key.
                  </p>
                </div>
                <button
                  onClick={handleRotateAccessKey}
                  disabled={isRotating || Boolean(newAccessKey)}
                  className="text-xs rounded-lg border border-primary-200 px-3 py-1.5 text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                >
                  {isRotating ? "Creating..." : "Rotate key"}
                </button>
              </div>

              {rotationError && <p className="text-xs text-rose-600">{rotationError}</p>}

              {newAccessKey && (
                <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
                  <div className="text-xs text-gray-500">
                    Old key:{" "}
                    <span className="font-mono text-gray-700">
                      {accessKey?.key_id || "unknown"}
                    </span>
                  </div>

                  <ObjectStorageCredentials
                    endpoint={endpoint ?? undefined}
                    accessKeyId={newAccessKey?.key_id ?? undefined}
                    secretKey={newAccessKey?.secret_once ?? undefined}
                    showSecretOnce={true}
                    confirmLabel="I have downloaded and copied these credentials"
                    onSecretDismissed={() => setRotationConfirmed(true)}
                  />

                  <button
                    onClick={() =>
                      downloadCredentialsFor({
                        endpoint: endpoint ?? undefined,
                        accessKeyId: (newAccessKey?.key_id as string) ?? undefined,
                        secretKey: (newAccessKey?.secret_once as string) ?? undefined,
                        label: `${account?.name ?? "storage"}-rotated`,
                      })
                    }
                    disabled={!newAccessKey?.secret_once}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-white font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    Download new credentials
                  </button>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleRevokeOldKey}
                      disabled={!rotationConfirmed || isRevokingOldKey}
                      className="w-full rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
                    >
                      {isRevokingOldKey ? "Deactivating..." : "Deactivate old key"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewAccessKey(null);
                        setRotationConfirmed(false);
                        setRotatingKeyId(null);
                      }}
                      disabled={!rotationConfirmed}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Keep old key active
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Silos Section */}
      <div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Silos</h3>
          <button
            onClick={() => setShowBucketForm(!showBucketForm)}
            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
            title="Create Silo"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Create Silo Form */}
        {showBucketForm && (
          <form onSubmit={handleCreateBucket} className="p-3 bg-gray-50 border-b border-gray-200">
            <input
              type="text"
              value={newBucketName}
              onChange={(e) =>
                setNewBucketName(e.target.value.toLowerCase().replaceAll(/[^a-z0-9-]/g, ""))
              }
              placeholder="silo-name"
              className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              disabled={creatingBucket}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={creatingBucket || !newBucketName.trim()}
                className="flex-1 text-sm rounded-lg bg-primary-500 px-3 py-1.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {creatingBucket ? "Creating..." : "Create Silo"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBucketForm(false);
                  setNewBucketName("");
                }}
                className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Silo List */}
        <div>{renderBucketList()}</div>
      </div>

      {/* Secret Reveal Modal */}
      {showRevealModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Reveal Secret Key</h3>
              </div>
              <button
                onClick={() => {
                  setShowRevealModal(false);
                  if (revealedSecret) {
                    onRefresh(); // Refresh to update the can_reveal_secret status
                  }
                }}
                className="p-1 text-amber-600 hover:bg-amber-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {revealedSecret ? (
                <>
                  {/* Success - Show Secret */}
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-800">Secret Key Revealed</span>
                    </div>
                    <p className="text-sm text-emerald-700">
                      Save this key now! It will not be shown again.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="reveal-secret-key" className="block text-xs text-gray-500 mb-1">
                      Secret Access Key
                    </label>
                    <div className="flex items-center gap-2">
                      <code
                        id="reveal-secret-key"
                        className="flex-1 text-xs bg-gray-100 px-3 py-2.5 rounded-lg font-mono break-all select-all"
                      >
                        {revealedSecret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(revealedSecret, "secret")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        {copiedField === "secret" ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={downloadCredentials}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-white font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Download All Credentials
                  </button>

                  <p className="mt-4 text-xs text-center text-gray-500">
                    The credentials file will include endpoint, access key ID, and secret key.
                  </p>
                </>
              ) : (
                <>
                  {/* Warning */}
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800 mb-1">
                          Important Security Notice
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>
                            • This secret key will only be shown <strong>ONCE</strong>
                          </li>
                          <li>• After viewing, it cannot be retrieved again</li>
                          <li>• Download and store it in a secure location</li>
                          <li>• Never share this key publicly</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRevealSecret}
                    disabled={revealingSecret}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-white font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {revealingSecret ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Revealing...
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5" />I Understand, Reveal Secret Key
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Extend Storage Modal */}
      <ExtendStorageModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        accountId={account?.id}
        accountName={account?.name || "Storage"}
        currentQuotaGb={quotaGb}
        usedGb={usedGb}
        onSuccess={onRefresh}
      />
    </div>
  );
};

export default ObjectStorageSidebar;
