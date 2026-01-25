// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Calendar,
  CreditCard,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ArrowRight,
} from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import ToastUtils from "../../../utils/toastUtil";
import PaymentModal from "../ui/PaymentModal";

interface ObjectStorageSubscriptionProps {
  accountId: string;
  accountName: string;
  onRenewSuccess?: () => void;
}

interface SubscriptionData {
  account_id: string;
  account_name: string;
  status: string;
  subscription_status: string;
  quota_gb: number;
  used_gb: number;
  expires_at: string | null;
  days_until_expiry: number | null;
  auto_renew: boolean;
  is_expired: boolean;
  is_expiring_soon: boolean;
  is_cancelled: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export const ObjectStorageSubscription: React.FC<ObjectStorageSubscriptionProps> = ({
  accountId,
  accountName,
  onRenewSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [updatingAutoRenew, setUpdatingAutoRenew] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewResult, setRenewResult] = useState<any>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (accountId) {
      loadSubscription();
    }
  }, [accountId]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await objectStorageApi.getSubscription(accountId);
      setSubscription(data);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!subscription) return;
    setUpdatingAutoRenew(true);
    try {
      await objectStorageApi.updateSubscription(accountId, {
        auto_renew: !subscription.auto_renew,
      });
      setSubscription({ ...subscription, auto_renew: !subscription.auto_renew });
      ToastUtils.success(
        subscription.auto_renew ? "Auto-renewal disabled" : "Auto-renewal enabled"
      );
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to update auto-renewal");
    } finally {
      setUpdatingAutoRenew(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await objectStorageApi.cancelSubscription(accountId, cancelReason || null);
      ToastUtils.success("Subscription cancelled");
      setShowCancelModal(false);
      loadSubscription();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await objectStorageApi.reactivateSubscription(accountId);
      ToastUtils.success("Subscription reactivated");
      loadSubscription();
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to reactivate subscription");
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const result = await objectStorageApi.renewSubscription(accountId, renewMonths);
      setRenewResult(result);
    } catch (err: any) {
      ToastUtils.error(err.message || "Failed to initiate renewal");
    } finally {
      setRenewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      active: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      expiring: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: <AlertTriangle className="h-4 w-4" />,
      },
      expired: { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-4 w-4" /> },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <XCircle className="h-4 w-4" />,
      },
    };
    const style = styles[status] || styles.active;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Unable to load subscription details.</p>
        <button onClick={loadSubscription} className="mt-4 text-primary-600 hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {subscription.is_expiring_soon && !subscription.is_cancelled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Subscription Expiring Soon</p>
            <p className="text-sm text-amber-700">
              Your subscription expires in {subscription.days_until_expiry} days.
              {subscription.auto_renew
                ? " Auto-renewal is enabled."
                : " Consider renewing to avoid service interruption."}
            </p>
          </div>
        </div>
      )}

      {subscription.is_expired && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Subscription Expired</p>
            <p className="text-sm text-red-700">
              Your subscription has expired. Renew now to restore access.
            </p>
          </div>
        </div>
      )}

      {subscription.is_cancelled && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
          <XCircle className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-800">Subscription Cancelled</p>
            <p className="text-sm text-gray-600">
              Cancelled on {formatDate(subscription.cancelled_at)}.
              {subscription.cancellation_reason && ` Reason: ${subscription.cancellation_reason}`}
              {!subscription.is_expired &&
                " Your storage remains accessible until the expiration date."}
            </p>
          </div>
        </div>
      )}

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Status</span>
            {getStatusBadge(subscription.subscription_status)}
          </div>
          <div className="text-2xl font-bold text-gray-800">{subscription.quota_gb} GB</div>
          <div className="text-sm text-gray-500">{subscription.used_gb} GB used</div>
        </div>

        {/* Expiry Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="h-4 w-4" />
            <span>Expires</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {subscription.expires_at ? formatDate(subscription.expires_at) : "No expiry"}
          </div>
          {subscription.days_until_expiry !== null && subscription.days_until_expiry > 0 && (
            <div className="text-sm text-gray-500">
              {subscription.days_until_expiry} days remaining
            </div>
          )}
        </div>

        {/* Auto-Renew Card */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <RefreshCw className="h-4 w-4" />
            <span>Auto-Renewal</span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`text-lg font-semibold ${subscription.auto_renew ? "text-green-600" : "text-gray-400"}`}
            >
              {subscription.auto_renew ? "Enabled" : "Disabled"}
            </span>
            <button
              onClick={toggleAutoRenew}
              disabled={updatingAutoRenew || subscription.is_cancelled}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              {updatingAutoRenew ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : subscription.auto_renew ? (
                <ToggleRight className="h-8 w-8 text-green-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!subscription.is_cancelled && (
          <>
            <button
              onClick={() => setShowRenewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Renew Subscription
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancel Subscription
            </button>
          </>
        )}
        {subscription.is_cancelled && !subscription.is_expired && (
          <button
            onClick={handleReactivate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Reactivate Subscription
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel Subscription</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your storage will remain accessible until {formatDate(subscription.expires_at)}. After
              that, access will be suspended.
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && !renewResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Renew Subscription</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Renewal Period</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setRenewMonths(m)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      renewMonths === m
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {m} {m === 1 ? "month" : "months"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRenewModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {renewing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal for Renewal */}
      {renewResult?.payment?.required && (
        <PaymentModal
          isOpen={true}
          onClose={() => {
            setRenewResult(null);
            setShowRenewModal(false);
          }}
          mode="modal"
          transactionData={{
            data: {
              transaction: renewResult.transaction,
              payment: renewResult.payment,
              order: {
                storage_profiles: [
                  {
                    name: accountName,
                    months: renewMonths,
                    subtotal: renewResult.transaction?.amount,
                    currency: renewResult.transaction?.currency,
                  },
                ],
              },
            },
          }}
          onPaymentComplete={() => {
            ToastUtils.success("Renewal successful!");
            setRenewResult(null);
            setShowRenewModal(false);
            loadSubscription();
            onRenewSuccess?.();
          }}
        />
      )}
    </div>
  );
};

export default ObjectStorageSubscription;
