// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  Database,
  Key,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  Globe,
  Calendar,
  HardDrive,
  BarChart3,
  CreditCard,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  Shield,
  X,
} from "lucide-react";
import StorageGauge3D from "./StorageGauge3D";
import ExtendStorageModal from "./ExtendStorageModal";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";
import ObjectStorageCredentials from "./ObjectStorageCredentials";

interface Bucket {
  id: string;
  name: string;
  created_at?: string;
  storage_class?: string;
}

interface ObjectStorageSidebarProps {
  account: any;
  buckets: Bucket[];
  selectedBucket: string | null;
  onSelectBucket: (bucketName: string | null) => void;
  onCreateBucket: (name: string) => Promise<void>;
  onDeleteBucket: (bucket: Bucket) => Promise<void>;
  onRefresh: () => void;
  bucketsLoading?: boolean;
  creatingBucket?: boolean;
  deletingBucketId?: string | null;
}

const ObjectStorageSidebar: React.FC<ObjectStorageSidebarProps> = ({
  account,
  buckets,
  selectedBucket,
  onSelectBucket,
  onCreateBucket,
  onDeleteBucket,
  onRefresh,
  bucketsLoading = false,
  creatingBucket = false,
  deletingBucketId = null,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [showBucketForm, setShowBucketForm] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newAccessKey, setNewAccessKey] = useState<any>(null);
  const [rotationConfirmed, setRotationConfirmed] = useState(false);
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);
  const [rotationError, setRotationError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isRevokingOldKey, setIsRevokingOldKey] = useState(false);

  // Secret reveal state
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealingSecret, setRevealingSecret] = useState(false);
  const [secretViewed, setSecretViewed] = useState(false);

  // Extend storage modal state
  const [showExtendModal, setShowExtendModal] = useState(false);

  useEffect(() => {
    setRevealedSecret(null);
    setSecretViewed(false);
    setNewAccessKey(null);
    setRotationConfirmed(false);
    setRotatingKeyId(null);
    setRotationError(null);
  }, [account?.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      setRevealedSecret(null);
      setSecretViewed(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Extract account details
  const endpoint = account?.meta?.public_url || account?.meta?.provisioning?.result?.public_url;
  const accessKeyId = account?.default_access_key?.key_id;
  const accessKey = account?.default_access_key;
  const canRevealSecret = accessKey?.can_reveal_secret && !accessKey?.secret_viewed_at;
  const usedGb = account?.used_gb || 0;
  const quotaGb = account?.quota_gb || 100;
  const objectCount = account?.object_count || 0;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      ToastUtils.error("Failed to copy");
    }
  };

  const handleRevealSecret = async () => {
    if (!account?.id || !accessKey?.id) return;

    setRevealingSecret(true);
    try {
      const result = await objectStorageApi.revealSecretKey(account.id, accessKey.id);
      if (result.success && result.secret_key) {
        setRevealedSecret(result.secret_key);
        setSecretViewed(true);
      } else {
        ToastUtils.error(result.message || "Failed to reveal secret");
      }
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to reveal secret key");
    } finally {
      setRevealingSecret(false);
    }
  };

  const downloadCredentialsFor = ({
    endpoint: endpointValue,
    accessKeyId: accessKeyValue,
    secretKey: secretValue,
    label,
  }: {
    endpoint?: string;
    accessKeyId?: string;
    secretKey?: string;
    label?: string;
  }) => {
    const normalizedLabel = String(label || account?.name || "storage")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const credentials = {
      endpoint: endpointValue || "",
      access_key_id: accessKeyValue || "",
      secret_access_key: secretValue || "",
      account_name: label || account?.name || "",
      created_at: new Date().toISOString(),
      warning: "KEEP THIS FILE SECURE! The secret key cannot be recovered if lost.",
    };

    const content = `# Silo Storage Credentials
# Account: ${credentials.account_name}
# Downloaded: ${credentials.created_at}
# ⚠️ WARNING: Keep this file secure and never share it!

ENDPOINT=${credentials.endpoint}
ACCESS_KEY_ID=${credentials.access_key_id}
SECRET_ACCESS_KEY=${credentials.secret_access_key}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s3-credentials-${normalizedLabel || "storage"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    ToastUtils.success("Credentials downloaded. Store this file securely!");
  };

  const downloadCredentials = () => {
    downloadCredentialsFor({
      endpoint,
      accessKeyId,
      secretKey: revealedSecret || "",
      label: account?.name || "storage",
    });
  };

  const normalizeAccessKeyPayload = (payload: any) => {
    if (!payload) return null;
    if (payload.key_id || payload.id) return payload;
    if (payload.data) return normalizeAccessKeyPayload(payload.data);
    return payload;
  };

  const handleRotateAccessKey = async () => {
    if (!account?.id) return;
    setRotationError(null);
    setIsRotating(true);
    try {
      const data = await objectStorageApi.createAccessKey(account.id, { label: "rotated" });
      const created = normalizeAccessKeyPayload(data);
      if (!created) {
        throw new Error("Access key created but no credentials were returned.");
      }

      if (!created.secret_once && created.id) {
        try {
          const revealed = await objectStorageApi.revealSecretKey(account.id, created.id);
          created.secret_once = revealed?.secret_key || revealed?.secret_once || null;
        } catch (revealError: any) {
          setRotationError(
            revealError?.message ||
              "Access key created, but the secret could not be revealed. Please rotate again."
          );
        }
      }

      if (!created.secret_once) {
        setRotationError(
          (prev) =>
            prev ||
            "Access key created, but the secret is unavailable. Rotate again to generate new credentials."
        );
      }

      setNewAccessKey(created);
      setRotationConfirmed(false);
      setRotatingKeyId(accessKey?.id || null);
      ToastUtils.success("New access key created. Save it now.");
      onRefresh();
    } catch (err: any) {
      const message = err?.message || "Failed to create access key.";
      setRotationError(message);
      ToastUtils.error(message);
    } finally {
      setIsRotating(false);
    }
  };

  const handleRevokeOldKey = async () => {
    const oldKeyId = rotatingKeyId || accessKey?.id;
    if (!account?.id || !oldKeyId) return;
    setIsRevokingOldKey(true);
    try {
      await objectStorageApi.revokeAccessKey(account.id, oldKeyId);
      ToastUtils.success("Old access key revoked.");
      setNewAccessKey(null);
      setRotationConfirmed(false);
      setRotatingKeyId(null);
      onRefresh();
    } catch (err: any) {
      ToastUtils.error(err?.message || "Failed to revoke access key.");
    } finally {
      setIsRevokingOldKey(false);
    }
  };

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;

    try {
      await onCreateBucket(newBucketName.toLowerCase().trim());
      setNewBucketName("");
      setShowBucketForm(false);
    } catch (err) {
      // Error handled by parent
    }
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

        {/* Extend Storage CTA */}
        {usedGb / quotaGb > 0.8 && (
          <button
            onClick={() => setShowExtendModal(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            Extend Storage
          </button>
        )}

        {/* Always show extend option (smaller) */}
        {usedGb / quotaGb <= 0.8 && (
          <button
            onClick={() => setShowExtendModal(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border border-primary-200 text-primary-600 px-4 py-2 text-sm font-medium hover:bg-primary-50 transition-all"
          >
            <CreditCard className="h-4 w-4" />
            Add More Storage
          </button>
        )}
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
                <label className="block text-xs text-gray-500 mb-1">Endpoint</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded font-mono truncate">
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
                <label className="block text-xs text-gray-500 mb-1">Access Key ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded font-mono truncate">
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

            {/* Secret Key Section */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Secret Access Key</label>
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
                    endpoint={endpoint}
                    accessKeyId={newAccessKey?.key_id}
                    secretKey={newAccessKey?.secret_once}
                    showSecretOnce={true}
                    confirmLabel="I have downloaded and copied these credentials"
                    onSecretDismissed={() => setRotationConfirmed(true)}
                  />

                  <button
                    onClick={() =>
                      downloadCredentialsFor({
                        endpoint,
                        accessKeyId: newAccessKey?.key_id,
                        secretKey: newAccessKey?.secret_once,
                        label: `${account?.name || "storage"}-rotated`,
                      })
                    }
                    disabled={!newAccessKey?.secret_once}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                setNewBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
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
        <div>
          {bucketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          ) : buckets.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Database className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No silos yet</p>
            </div>
          ) : (
            <div>
              {buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectBucket(bucket.name)}
                  onKeyPress={(e) => e.key === "Enter" && onSelectBucket(bucket.name)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 ${
                    selectedBucket === bucket.name
                      ? "bg-primary-50 border-l-2 border-l-primary-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Database
                      className={`h-4 w-4 flex-shrink-0 ${
                        selectedBucket === bucket.name ? "text-primary-600" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm truncate ${
                        selectedBucket === bucket.name
                          ? "font-medium text-primary-700"
                          : "text-gray-700"
                      }`}
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
                </div>
              ))}
            </div>
          )}
        </div>
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
              {!revealedSecret ? (
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
              ) : (
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
                    <label className="block text-xs text-gray-500 mb-1">Secret Access Key</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 px-3 py-2.5 rounded-lg font-mono break-all select-all">
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
