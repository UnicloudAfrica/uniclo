// @ts-nocheck
import React, { useState } from "react";
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

  // Secret reveal state
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealingSecret, setRevealingSecret] = useState(false);
  const [secretViewed, setSecretViewed] = useState(false);

  // Extend storage modal state
  const [showExtendModal, setShowExtendModal] = useState(false);

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

  const downloadCredentials = () => {
    const credentials = {
      endpoint: endpoint || "",
      access_key_id: accessKeyId || "",
      secret_access_key: revealedSecret || "",
      account_name: account?.name || "",
      created_at: new Date().toISOString(),
      warning: "KEEP THIS FILE SECURE! The secret key cannot be recovered if lost.",
    };

    const content = `# Object Storage Credentials
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
    a.download = `s3-credentials-${account?.name || "storage"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    ToastUtils.success("Credentials downloaded. Store this file securely!");
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
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Storage Overview
        </h3>

        {/* 3D Gauge */}
        <div className="flex justify-center mb-4">
          <StorageGauge3D usedGb={usedGb} totalGb={quotaGb} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <HardDrive className="h-3.5 w-3.5" />
              <span className="text-xs">Objects</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{objectCount}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="text-xs">Buckets</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{buckets.length}</p>
          </div>
        </div>

        {/* Region & Created */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Region
            </span>
            <span className="font-medium text-slate-700">{account?.region || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created
            </span>
            <span className="font-medium text-slate-700">
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
      <div className="border-b border-slate-200">
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-500" />
            S3 Credentials
          </span>
          {showCredentials ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showCredentials && (
          <div className="px-4 pb-4 space-y-3">
            {endpoint && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Endpoint</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-slate-100 px-2 py-1.5 rounded font-mono truncate">
                    {endpoint}
                  </code>
                  <button
                    onClick={() => copyToClipboard(endpoint, "endpoint")}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
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
                <label className="block text-xs text-slate-500 mb-1">Access Key ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-slate-100 px-2 py-1.5 rounded font-mono truncate">
                    {accessKeyId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(accessKeyId, "accessKey")}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
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
              <label className="block text-xs text-slate-500 mb-1">Secret Access Key</label>
              {canRevealSecret && !secretViewed ? (
                <button
                  onClick={() => setShowRevealModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Click to Reveal (One-Time Only)
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs bg-slate-100 px-2 py-2 rounded text-slate-500">
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Secret key already viewed or not available</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buckets Section */}
      <div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Buckets</h3>
          <button
            onClick={() => setShowBucketForm(!showBucketForm)}
            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
            title="Create bucket"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Create Bucket Form */}
        {showBucketForm && (
          <form onSubmit={handleCreateBucket} className="p-3 bg-slate-50 border-b border-slate-200">
            <input
              type="text"
              value={newBucketName}
              onChange={(e) =>
                setNewBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="bucket-name"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              disabled={creatingBucket}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={creatingBucket || !newBucketName.trim()}
                className="flex-1 text-sm rounded-lg bg-primary-500 px-3 py-1.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {creatingBucket ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBucketForm(false);
                  setNewBucketName("");
                }}
                className="text-sm rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Bucket List */}
        <div>
          {bucketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          ) : buckets.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Database className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No buckets yet</p>
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
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 ${
                    selectedBucket === bucket.name
                      ? "bg-primary-50 border-l-2 border-l-primary-500"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Database
                      className={`h-4 w-4 flex-shrink-0 ${
                        selectedBucket === bucket.name ? "text-primary-600" : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`text-sm truncate ${
                        selectedBucket === bucket.name
                          ? "font-medium text-primary-700"
                          : "text-slate-700"
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
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <label className="block text-xs text-slate-500 mb-1">Secret Access Key</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-slate-100 px-3 py-2.5 rounded-lg font-mono break-all select-all">
                        {revealedSecret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(revealedSecret, "secret")}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
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

                  <p className="mt-4 text-xs text-center text-slate-500">
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
