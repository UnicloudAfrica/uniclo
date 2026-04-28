/**
 * CloudAccountList — List of connected cloud accounts with CRUD actions.
 *
 * Shows provider badges, verification status, last-used timestamps,
 * and database count per account. Supports create, verify, and delete.
 */
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cloud,
  Plus,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ExternalLink,
  Search,
  Server,
  CheckCircle2,
  XCircle,
  Clock,
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

// ─── Provider Branding ────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  aws: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  gcp: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  azure: { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-500" },
  digitalocean: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
  linode: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800", dot: "bg-green-500" },
  vultr: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500" },
  hetzner: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
  openstack: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-500" },
  nutanix: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  custom: { bg: "bg-gray-50 dark:bg-gray-950/30", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800", dot: "bg-gray-500" },
};

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

// ─── Status Badge ─────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: CloudAccount["status"] }> = ({ status }) => {
  const config = {
    active: { icon: CheckCircle2, label: "Verified", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20" },
    unverified: { icon: Clock, label: "Unverified", className: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20" },
    error: { icon: XCircle, label: "Error", className: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-red-500/20" },
    suspended: { icon: AlertTriangle, label: "Suspended", className: "bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 ring-gray-500/20" },
  }[status] ?? { icon: Clock, label: status, className: "bg-gray-100 text-gray-600 ring-gray-500/20" };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

// ─── Provider Badge ───────────────────────────────────────────────

const ProviderBadge: React.FC<{ provider: string }> = ({ provider }) => {
  const colors = PROVIDER_COLORS[provider] ?? PROVIDER_COLORS.custom;
  const label = PROVIDER_LABELS[provider] ?? provider;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
};

// ─── Time Ago ─────────────────────────────────────────────────────

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ─── Main Component ───────────────────────────────────────────────

interface CloudAccountListProps {
  createPath: string;
  context: "admin" | "tenant" | "client";
}

const CloudAccountList: React.FC<CloudAccountListProps> = ({ createPath, _context }) => {
  const navigate = useNavigate();
  const { data: accountsRaw, isLoading, refetch } = useFetchCloudAccounts();
  const deleteMutation = useDeleteCloudAccount();
  const verifyMutation = useVerifyCloudAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const accounts = useMemo(() => {
    const list = Array.isArray(accountsRaw) ? (accountsRaw as CloudAccount[]) : [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.provider.toLowerCase().includes(q) ||
        (PROVIDER_LABELS[a.provider] ?? "").toLowerCase().includes(q)
    );
  }, [accountsRaw, searchQuery]);

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
    } catch {
      // handled by mutation
    }
  };

  const handleVerify = async (id: number) => {
    try {
      await verifyMutation.mutateAsync(id);
    } catch {
      // handled by mutation
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading cloud accounts...</p>
      </div>
    );
  }

  // ── Empty State ──
  if (!accounts.length && !searchQuery) {
    return (
      <ModernCard className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
          <Cloud className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Cloud Accounts Connected
        </h3>
        <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400 mb-6">
          Connect your cloud provider credentials to deploy databases on your own infrastructure.
          We support AWS, GCP, Azure, and 7 more providers.
        </p>
        <ModernButton variant="primary" onClick={() => navigate(createPath)}>
          <Plus size={16} className="mr-1.5" />
          Connect Cloud Account
        </ModernButton>
      </ModernCard>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </ModernButton>
          <ModernButton variant="primary" size="sm" onClick={() => navigate(createPath)}>
            <Plus size={14} className="mr-1" />
            Connect Account
          </ModernButton>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => {
          const providerColors = PROVIDER_COLORS[account.provider] ?? PROVIDER_COLORS.custom;
          const isDeleting = confirmDeleteId === account.id;
          const isVerifying = verifyMutation.isPending;

          return (
            <ModernCard
              key={account.id}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                account.status === "error" ? "ring-1 ring-red-200 dark:ring-red-800" : ""
              }`}
            >
              {/* Provider color strip */}
              <div className={`absolute inset-x-0 top-0 h-1 ${providerColors.dot}`} />

              <div className="p-5 pt-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {account.name}
                    </h3>
                    <div className="mt-1">
                      <ProviderBadge provider={account.provider} />
                    </div>
                  </div>
                  <StatusBadge status={account.status} />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Server size={11} />
                    <span>
                      {account.database_count ?? 0} database{(account.database_count ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>Used {timeAgo(account.last_used_at)}</span>
                  </div>
                  {account.default_region && (
                    <div className="col-span-2 flex items-center gap-1 mt-0.5">
                      <span className="text-gray-400">Region:</span>
                      <span className="font-mono text-[11px]">{account.default_region}</span>
                    </div>
                  )}
                </div>

                {/* Status message (for errors) */}
                {account.status === "error" && account.status_message && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 px-3 py-2">
                    <p className="text-[11px] text-red-600 dark:text-red-400 line-clamp-2">
                      {account.status_message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {isDeleting ? (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this cloud account?
                    </p>
                    {(account.database_count ?? 0) > 0 && (
                      <p className="text-[11px] text-red-500">
                        This account has {account.database_count} active database(s). They must be deleted first.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        loading={deleteMutation.isPending}
                        disabled={(account.database_count ?? 0) > 0}
                        onClick={() => handleDelete(account.id)}
                      >
                        Confirm Delete
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {(account.status === "unverified" || account.status === "error") && (
                      <ModernButton
                        variant="outline"
                        size="xs"
                        loading={isVerifying}
                        onClick={() => handleVerify(account.id)}
                      >
                        <ShieldCheck size={12} className="mr-1" />
                        Verify
                      </ModernButton>
                    )}
                    <ModernButton
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`${createPath.replace("/create", "")}/${account.id}`)}
                    >
                      <ExternalLink size={12} className="mr-1" />
                      Manage
                    </ModernButton>
                    <div className="flex-1" />
                    <button
                      onClick={() => setConfirmDeleteId(account.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </ModernCard>
          );
        })}
      </div>

      {/* Search no results */}
      {searchQuery && accounts.length === 0 && (
        <ModernCard className="py-10 text-center">
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No accounts matching &quot;{searchQuery}&quot;</p>
        </ModernCard>
      )}
    </div>
  );
};

export default CloudAccountList;
