/**
 * CloudAccountDetail — View and manage a single cloud account.
 *
 * Shows account info, status, credential update form, verify action, and delete.
 */
import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Cloud,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  RefreshCw,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchCloudAccounts,
  useDeleteCloudAccount,
  useVerifyCloudAccount,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { CloudAccount } from "@/types/managedDatabase";

// ─── Provider Labels ──────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  aws: "Amazon Web Services",
  gcp: "Google Cloud Platform",
  azure: "Microsoft Azure",
  digitalocean: "DigitalOcean",
  linode: "Linode (Akamai)",
  vultr: "Vultr",
  hetzner: "Hetzner Cloud",
  openstack: "OpenStack",
  nutanix: "Nutanix AHV",
  custom: "Custom Provider",
};

const PROVIDER_COLORS: Record<string, string> = {
  aws: "from-amber-500 to-orange-500",
  gcp: "from-blue-500 to-cyan-500",
  azure: "from-sky-500 to-blue-600",
  digitalocean: "from-indigo-500 to-violet-500",
  linode: "from-green-500 to-emerald-500",
  vultr: "from-violet-500 to-purple-500",
  hetzner: "from-red-500 to-rose-500",
  openstack: "from-rose-500 to-pink-500",
  nutanix: "from-emerald-500 to-teal-500",
  custom: "from-gray-500 to-slate-500",
};

// ─── Status Info ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: React.FC<{ size: number; className?: string }>; label: string; bg: string; text: string }> = {
  active: { icon: CheckCircle2, label: "Verified & Active", bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300" },
  unverified: { icon: Clock, label: "Pending Verification", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300" },
  error: { icon: XCircle, label: "Verification Failed", bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-300" },
  suspended: { icon: AlertTriangle, label: "Suspended", bg: "bg-gray-50 dark:bg-gray-950/20", text: "text-gray-600 dark:text-gray-400" },
};

// ─── Time Ago ─────────────────────────────────────────────────────

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ─── Main Component ───────────────────────────────────────────────

interface CloudAccountDetailProps {
  listPath: string;
}

const CloudAccountDetail: React.FC<CloudAccountDetailProps> = ({ listPath }) => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { data: accountsRaw, isLoading, refetch } = useFetchCloudAccounts();
  const deleteMutation = useDeleteCloudAccount();
  const verifyMutation = useVerifyCloudAccount();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  const account = React.useMemo(() => {
    const list = Array.isArray(accountsRaw) ? (accountsRaw as CloudAccount[]) : [];
    return list.find((a) => String(a.id) === accountId) ?? null;
  }, [accountsRaw, accountId]);

  const handleVerify = useCallback(async () => {
    if (!account) return;
    setVerifyResult(null);
    try {
      const result = await verifyMutation.mutateAsync(account.id);
      const data = result as Record<string, unknown>;
      setVerifyResult({
        success: data?.verified === true,
        message: (data?.message as string) ?? (data?.verified ? "Credentials verified successfully!" : "Verification failed."),
      });
      refetch();
    } catch (err: unknown) {
      setVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : "Verification failed.",
      });
    }
  }, [account, verifyMutation, refetch]);

  const handleDelete = useCallback(async () => {
    if (!account) return;
    try {
      await deleteMutation.mutateAsync(account.id);
      navigate(listPath);
    } catch {
      // handled by mutation
    }
  }, [account, deleteMutation, navigate, listPath]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading account details...</p>
      </div>
    );
  }

  // ── Not Found ──
  if (!account) {
    return (
      <ModernCard className="py-16 text-center">
        <XCircle size={32} className="mx-auto mb-3 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Not Found</h3>
        <p className="text-sm text-gray-500 mb-4">This cloud account does not exist or has been deleted.</p>
        <ModernButton variant="outline" onClick={() => navigate(listPath)}>
          <ArrowLeft size={14} className="mr-1" />
          Back to Cloud Accounts
        </ModernButton>
      </ModernCard>
    );
  }

  const status = STATUS_CONFIG[account.status] ?? STATUS_CONFIG.unverified;
  const StatusIcon = status.icon;
  const gradient = PROVIDER_COLORS[account.provider] ?? PROVIDER_COLORS.custom;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(listPath)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={14} />
        Back to Cloud Accounts
      </button>

      {/* Provider Header Card */}
      <ModernCard className="overflow-hidden" padding="none">
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}>
                <Cloud size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {account.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {PROVIDER_LABELS[account.provider] ?? account.provider}
                </p>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${status.bg} ${status.text}`}>
              <StatusIcon size={16} />
              <span className="text-sm font-medium">{status.label}</span>
            </div>
          </div>
        </div>
      </ModernCard>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ModernCard className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            <Server size={14} />
            Databases
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {account.database_count ?? 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            active database{(account.database_count ?? 0) !== 1 ? "s" : ""} using this account
          </p>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            <Clock size={14} />
            Last Used
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatDate(account.last_used_at)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Verified: {formatDate(account.verified_at)}
          </p>
        </ModernCard>
      </div>

      {/* Default Region */}
      {account.default_region && (
        <ModernCard className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Default Region
          </div>
          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
            {account.default_region}
          </div>
        </ModernCard>
      )}

      {/* Error Message */}
      {account.status === "error" && account.status_message && (
        <ModernCard className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Verification Error</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{account.status_message}</p>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Verify Result */}
      {verifyResult && (
        <div className={`flex items-start gap-2 rounded-lg p-3 ${
          verifyResult.success
            ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
        }`}>
          {verifyResult.success ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <XCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          )}
          <p className={`text-sm ${
            verifyResult.success ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
          }`}>
            {verifyResult.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <ModernCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</h3>

        <div className="flex flex-wrap gap-3">
          <ModernButton
            variant="outline"
            loading={verifyMutation.isPending}
            onClick={handleVerify}
          >
            <ShieldCheck size={14} className="mr-1.5" />
            Re-Verify Credentials
          </ModernButton>

          <ModernButton
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </ModernButton>
        </div>
      </ModernCard>

      {/* Danger Zone */}
      <ModernCard className="border-red-200 dark:border-red-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Danger Zone</h3>

        {showDeleteConfirm ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              Are you sure you want to delete <strong>{account.name}</strong>?
            </p>
            {(account.database_count ?? 0) > 0 && (
              <p className="text-xs text-red-500">
                This account has {account.database_count} active database(s). Please delete them before removing the account.
              </p>
            )}
            <div className="flex gap-2">
              <ModernButton
                variant="danger"
                size="sm"
                loading={deleteMutation.isPending}
                disabled={(account.database_count ?? 0) > 0}
                onClick={handleDelete}
              >
                <Trash2 size={13} className="mr-1" />
                Confirm Delete
              </ModernButton>
              <ModernButton variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </ModernButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Delete this cloud account and remove all stored credentials.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
            <ModernButton variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={13} className="mr-1" />
              Delete
            </ModernButton>
          </div>
        )}
      </ModernCard>
    </div>
  );
};

export default CloudAccountDetail;
