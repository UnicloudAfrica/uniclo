// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RefreshCw,
  ArrowLeft,
  FolderOpen,
  BarChart3,
  CreditCard,
  Receipt,
  Trash2,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell";
import ObjectStorageSidebar from "../../shared/components/object-storage/ObjectStorageSidebar";
import ObjectStorageFileBrowser from "../../shared/components/object-storage/ObjectStorageFileBrowser";
import ObjectStorageAnalytics from "../../shared/components/object-storage/ObjectStorageAnalytics";
import ObjectStorageSubscription from "../../shared/components/object-storage/ObjectStorageSubscription";
import ObjectStorageTransactions from "../../shared/components/object-storage/ObjectStorageTransactions";
import ExtendStorageModal from "../../shared/components/object-storage/ExtendStorageModal";
import DeleteStorageAccountModal from "../../shared/components/object-storage/DeleteStorageAccountModal";
import objectStorageApi from "../../services/objectStorageApi";
import ToastUtils from "../../utils/toastUtil";

/**
 * Admin Object Storage Detail Page
 *
 * Uses AdminPageShell for consistent header/breadcrumb structure,
 * with a 1/4-3/4 split layout for sidebar and file browser.
 */
const AdminObjectStorageDetail: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bucketsLoading, setBucketsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);

  // Tab and modal state
  const [activeTab, setActiveTab] = useState<
    "files" | "analytics" | "subscription" | "transactions"
  >("files");
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchAccountDetails = useCallback(async () => {
    if (!accountId) return;
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
    if (!accountId) return;
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
      await objectStorageApi.createBucket(accountId!, { name });
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
      await objectStorageApi.deleteBucket(accountId!, bucket.id);
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

  const handleDeleteAccount = async () => {
    try {
      await objectStorageApi.deleteAccount(accountId!);
      ToastUtils.success("Storage account deleted successfully");
      navigate("/admin-dashboard/object-storage", { state: { refresh: true } });
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to delete account");
      throw err;
    }
  };

  if (!accountId) {
    return (
      <>
        <AdminHeadbar />
        <AdminSidebar />
        <AdminPageShell title="Object Storage">
          <div className="p-8 text-center text-rose-600">Account ID is required</div>
        </AdminPageShell>
      </>
    );
  }

  // Custom breadcrumbs for this detail page
  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Object Storage", href: "/admin-dashboard/object-storage" },
    { label: account?.name || "Access" },
  ];

  // Action buttons for the page header
  const headerActions = (
    <div className="flex items-center gap-3">
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
        onClick={() => navigate("/admin-dashboard/object-storage")}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title={account?.name || "Access"}
        description="View account details, manage buckets, and browse files"
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        disableContentPadding
        contentClassName=""
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : error || !account ? (
          <div className="flex items-center justify-center py-16 px-4">
            <div className="text-center max-w-md w-full">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-6">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Storage Account Not Found
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                This storage account may have been deleted or you don't have permission to view it.
              </p>
              <button
                onClick={() =>
                  navigate("/admin-dashboard/object-storage", { state: { refresh: true } })
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Object Storage
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Toggle Button */}
            <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {showMobileSidebar ? (
                  <>
                    <span>Hide Storage Details</span>
                  </>
                ) : (
                  <>
                    <span>Show Storage & Buckets</span>
                  </>
                )}
              </button>
              {selectedBucket && (
                <span className="text-sm text-slate-500">
                  Bucket: <span className="font-medium text-slate-700">{selectedBucket}</span>
                </span>
              )}
            </div>

            {/* Mobile Sidebar (collapsible) */}
            {showMobileSidebar && (
              <div className="lg:hidden border-b border-slate-200 max-h-[50vh] overflow-y-auto bg-white">
                <ObjectStorageSidebar
                  account={account}
                  buckets={buckets}
                  selectedBucket={selectedBucket}
                  onSelectBucket={(name) => {
                    setSelectedBucket(name);
                    setShowMobileSidebar(false);
                  }}
                  onCreateBucket={handleCreateBucket}
                  onDeleteBucket={handleDeleteBucket}
                  onRefresh={handleRefresh}
                  bucketsLoading={bucketsLoading}
                  creatingBucket={creatingBucket}
                  deletingBucketId={deletingBucketId}
                />
              </div>
            )}

            {/* Desktop: 1/4 - 3/4 Grid Layout */}
            <div className="hidden lg:grid lg:grid-cols-4 h-[calc(100vh-180px)]">
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
                  <div className="p-6">
                    <ObjectStorageSubscription
                      accountId={accountId}
                      accountName={account.name}
                      onRenewSuccess={fetchAccountDetails}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <ObjectStorageTransactions accountId={accountId} accountName={account.name} />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Full width content */}
            <div className="lg:hidden h-[calc(100vh-250px)] overflow-hidden bg-slate-50">
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
                  accountName={account?.name}
                  onExtendStorage={() => setShowExtendModal(true)}
                />
              ) : activeTab === "subscription" ? (
                <div className="p-4">
                  <ObjectStorageSubscription
                    accountId={accountId}
                    accountName={account?.name}
                    onRenewSuccess={fetchAccountDetails}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <ObjectStorageTransactions accountId={accountId} accountName={account?.name} />
                </div>
              )}
            </div>
          </>
        )}
      </AdminPageShell>

      {/* Extend Storage Modal */}
      <ExtendStorageModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        accountId={accountId}
        accountName={account?.name || ""}
        currentQuotaGb={account?.quota_gb || 0}
        usedGb={buckets.reduce((sum, b) => sum + (b.size_bytes || 0), 0) / 1024 ** 3}
        onSuccess={() => {
          setShowExtendModal(false);
          handleRefresh();
        }}
      />

      {/* Delete Storage Account Modal */}
      <DeleteStorageAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        accountName={account?.name || ""}
        accountId={accountId}
        bucketCount={buckets.length}
        accessKeyCount={account?.accessKeys?.length || account?.access_keys?.length || 0}
      />
    </>
  );
};

export default AdminObjectStorageDetail;
