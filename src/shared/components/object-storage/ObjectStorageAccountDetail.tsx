// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FolderOpen,
  BarChart3,
  CreditCard,
  Receipt,
} from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import ObjectStorageSidebar from "./ObjectStorageSidebar";
import ObjectStorageFileBrowser from "./ObjectStorageFileBrowser";
import ObjectStorageAnalytics from "./ObjectStorageAnalytics";
import ObjectStorageSubscription from "./ObjectStorageSubscription";
import ObjectStorageTransactions from "./ObjectStorageTransactions";
import ExtendStorageModal from "./ExtendStorageModal";
import ToastUtils from "../../../utils/toastUtil";

const statusConfig = {
  active: { label: "Active", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  provisioning: { label: "Provisioning", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  provision_failed: { label: "Failed", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
  suspended: { label: "Suspended", icon: XCircle, color: "text-slate-500", bg: "bg-slate-100" },
};

interface ObjectStorageAccountDetailProps {
  accountId: string;
  backUrl: string;
  backLabel?: string;
}

/**
 * Object Storage Account Detail Page
 *
 * Features a 1/4 - 3/4 split layout with tabs:
 * - Left sidebar (1/4): Account overview with 3D storage gauge, credentials, and bucket list
 * - Main content (3/4): Tabbed view - Files browser or Analytics
 *
 * This component is shared across Admin, Tenant, and Client dashboards.
 */
const ObjectStorageAccountDetail: React.FC<ObjectStorageAccountDetailProps> = ({
  accountId,
  backUrl,
  backLabel = "Back to Object Storage",
}) => {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bucketsLoading, setBucketsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "files" | "analytics" | "subscription" | "transactions"
  >("files");

  // Selected bucket for file browser
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  // Bucket operations state
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);

  // Extend storage modal
  const [showExtendModal, setShowExtendModal] = useState(false);

  const fetchAccountDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await objectStorageApi.fetchAccount(accountId);
      setAccount(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      ToastUtils.error("Failed to load account details");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const fetchBuckets = useCallback(async () => {
    try {
      setBucketsLoading(true);
      const data = await objectStorageApi.fetchBuckets(accountId);
      setBuckets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load buckets:", err);
    } finally {
      setBucketsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchAccountDetails();
      fetchBuckets();
    }
  }, [accountId, fetchAccountDetails, fetchBuckets]);

  const handleCreateBucket = async (name: string) => {
    try {
      setCreatingBucket(true);
      await objectStorageApi.createBucket(accountId, { name });
      ToastUtils.success("Bucket created successfully");
      fetchBuckets();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to create bucket");
      throw err;
    } finally {
      setCreatingBucket(false);
    }
  };

  const handleDeleteBucket = async (bucket: any) => {
    if (!window.confirm(`Delete bucket "${bucket.name}"? This cannot be undone.`)) return;

    try {
      setDeletingBucketId(bucket.id);
      await objectStorageApi.deleteBucket(accountId, bucket.id);
      ToastUtils.success("Bucket deleted");
      if (selectedBucket === bucket.name) {
        setSelectedBucket(null);
      }
      fetchBuckets();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to delete bucket");
    } finally {
      setDeletingBucketId(null);
    }
  };

  const handleRefresh = () => {
    fetchAccountDetails();
    fetchBuckets();
  };

  const status = statusConfig[account?.status] || statusConfig.provisioning;
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-600 mb-4">{error || "Account not found"}</p>
        <button onClick={() => navigate(backUrl)} className="text-primary-600 hover:underline">
          {backLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(backUrl)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Database className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{account.name}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "files"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Files
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "analytics"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "subscription"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Subscription
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "transactions"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="h-4 w-4" />
            Transactions
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Main Content: 1/4 - 3/4 Split using Grid */}
      <div className="grid grid-cols-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar (1/4) */}
        <div className="col-span-1 border-r border-slate-200 overflow-y-auto bg-white">
          <ObjectStorageSidebar
            account={account}
            buckets={buckets}
            selectedBucket={selectedBucket}
            onSelectBucket={setSelectedBucket}
            onCreateBucket={handleCreateBucket}
            onDeleteBucket={handleDeleteBucket}
            onRefresh={handleRefresh}
            bucketsLoading={bucketsLoading}
            creatingBucket={creatingBucket}
            deletingBucketId={deletingBucketId}
          />
        </div>

        {/* Main Content Area (3/4) */}
        <div className="col-span-3 overflow-hidden bg-slate-50">
          {activeTab === "files" ? (
            <ObjectStorageFileBrowser
              accountId={accountId}
              bucketName={selectedBucket}
              buckets={buckets}
              onSelectBucket={setSelectedBucket}
            />
          ) : activeTab === "analytics" ? (
            <ObjectStorageAnalytics
              accountId={accountId}
              accountName={account.name}
              onExtendStorage={() => setShowExtendModal(true)}
            />
          ) : activeTab === "subscription" ? (
            <div className="p-6 overflow-y-auto h-full">
              <ObjectStorageSubscription
                accountId={accountId}
                accountName={account.name}
                onRenewSuccess={handleRefresh}
              />
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full">
              <ObjectStorageTransactions accountId={accountId} accountName={account.name} />
            </div>
          )}
        </div>
      </div>

      {/* Extend Storage Modal */}
      <ExtendStorageModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        accountId={accountId}
        accountName={account.name}
        currentQuotaGb={account.quota_gb || 0}
        usedGb={buckets.reduce((sum, b) => sum + (b.size_bytes || 0), 0) / 1024 ** 3}
        onSuccess={() => {
          setShowExtendModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
};

export default ObjectStorageAccountDetail;
