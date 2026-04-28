import React, { useState } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Copy,
  Check,
  X,
  Shield,
  Clock,
  Globe,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ModernStatsCard from "@/shared/components/ui/ModernStatsCard";
import { ModernButton } from "@/shared/components/ui";
import {
  useBridgeClients,
  useCreateBridgeClient,
  useDeleteBridgeClient,
  useRotateBridgeClientToken,
} from "@/shared/hooks/resources/bridgeClientHooks";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Article 4.4 — SSH key rotation status surfaced from the API. The
 * backend computes the WORST status across all SSH keys this client
 * has uploaded so the table can render a single badge per row.
 */
interface SshKeyRotation {
  key_count: number;
  oldest_age_days: number;
  worst_status: "fresh" | "warning" | "overdue" | "suspended" | "no_keys";
  rotation_window_days: number;
  rotation_grace_days: number;
}

interface BridgeClient {
  id: number;
  uuid: string;
  name: string;
  tenant_id: number;
  tenant_name: string | null;
  project_id: number | null;
  client_type: "admin" | "tenant" | "client";
  billing_mode: "internal" | "postpaid" | "prepaid";
  rate_limit_tier: "standard" | "professional" | "enterprise";
  allowed_ips: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  is_expired: boolean;
  last_used_at: string | null;
  last_used_ip: string | null;
  created_at: string;
  ssh_key_rotation?: SshKeyRotation;
}

interface CreateResponse {
  success: boolean;
  message: string;
  data: BridgeClient & {
    api_token: string;
    webhook_secret: string | null;
  };
}

// ═══════════════════════════════════════════════════════════════════
// CREDENTIAL REVEAL COMPONENT
// ═══════════════════════════════════════════════════════════════════

const CredentialField: React.FC<{
  label: string;
  value: string;
  warning?: string;
}> = ({ label, value, warning }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-amber-800">{label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisible(!visible)}
            className="p-1 text-amber-600 hover:text-amber-800 rounded"
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="p-1 text-amber-600 hover:text-amber-800 rounded"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <code className="block text-xs bg-amber-100 rounded px-3 py-2 font-mono break-all text-amber-900">
        {visible ? value : "\u2022".repeat(Math.min(value.length, 40))}
      </code>
      {warning && (
        <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
          <AlertTriangle size={12} /> {warning}
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// CREATE MODAL
// ═══════════════════════════════════════════════════════════════════

const CreateBridgeClientModal: React.FC<{
  onClose: () => void;
  onCreated: (result: CreateResponse) => void;
}> = ({ onClose, onCreated }) => {
  const createMutation = useCreateBridgeClient();
  const [form, setForm] = useState<{
    tenant_id: string;
    name: string;
    client_type: "admin" | "tenant" | "client";
    billing_mode: "internal" | "postpaid" | "prepaid";
    rate_limit_tier: "standard" | "professional" | "enterprise";
    webhook_url: string;
    allowed_ips: string;
    expires_at: string;
  }>({
    tenant_id: "",
    name: "",
    client_type: "tenant",
    billing_mode: "prepaid",
    rate_limit_tier: "standard",
    webhook_url: "",
    allowed_ips: "",
    expires_at: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      tenant_id: Number(form.tenant_id),
      name: form.name,
      client_type: form.client_type,
      billing_mode: form.client_type === "admin" ? "internal" : form.billing_mode,
      rate_limit_tier: form.rate_limit_tier,
    };
    if (form.webhook_url) payload.webhook_url = form.webhook_url;
    if (form.allowed_ips) payload.allowed_ips = form.allowed_ips.split(",").map((ip) => ip.trim());
    if (form.expires_at) payload.expires_at = form.expires_at;

    const result = await createMutation.mutateAsync(payload);
    onCreated(result as CreateResponse);
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Create Bridge Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tenant ID *</label>
              <input
                type="number"
                required
                value={form.tenant_id}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                className={inputClass}
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className={labelClass}>Display Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. LeanPloy Production"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Client Type</label>
              <select
                value={form.client_type}
                onChange={(e) => setForm({ ...form, client_type: e.target.value as typeof form.client_type })}
                className={inputClass}
              >
                <option value="tenant">Tenant</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Billing Mode</label>
              <select
                value={form.client_type === "admin" ? "internal" : form.billing_mode}
                onChange={(e) => setForm({ ...form, billing_mode: e.target.value as typeof form.billing_mode })}
                className={inputClass}
                disabled={form.client_type === "admin"}
              >
                <option value="prepaid">Prepaid</option>
                <option value="postpaid">Postpaid</option>
                <option value="internal">Internal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Rate Limit</label>
              <select
                value={form.rate_limit_tier}
                onChange={(e) =>
                  setForm({ ...form, rate_limit_tier: e.target.value as typeof form.rate_limit_tier })
                }
                className={inputClass}
              >
                <option value="standard">Standard</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Webhook URL</label>
            <input
              type="url"
              value={form.webhook_url}
              onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
              className={inputClass}
              placeholder="https://leanploy.example.com/api/v1/webhooks/unicloud"
            />
            <p className="mt-1 text-xs text-gray-500">
              LeanPloy will receive server provisioning events at this URL
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Allowed IPs</label>
              <input
                type="text"
                value={form.allowed_ips}
                onChange={(e) => setForm({ ...form, allowed_ips: e.target.value })}
                className={inputClass}
                placeholder="Comma-separated, or blank for any"
              />
            </div>
            <div>
              <label className={labelClass}>Expires At</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <ModernButton variant="outline" onClick={onClose} type="button">
              Cancel
            </ModernButton>
            <ModernButton type="submit" loading={createMutation.isPending}>
              Create Client
            </ModernButton>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// CREDENTIALS MODAL (shown after creation or token rotation)
// ═══════════════════════════════════════════════════════════════════

const CredentialsModal: React.FC<{
  apiToken: string;
  webhookSecret: string | null;
  onClose: () => void;
}> = ({ apiToken, webhookSecret, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">Save Your Credentials</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-4 px-6 py-5">
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm font-medium text-red-800">
            These credentials will NOT be shown again. Copy them now.
          </p>
        </div>

        <CredentialField
          label="API Token"
          value={apiToken}
          warning="Enter this in LeanPloy's UniCloud provider setup. The tenant is resolved from the token automatically."
        />

        {webhookSecret && (
          <CredentialField
            label="Webhook Secret"
            value={webhookSecret}
            warning="Set as UNICLOUD_WEBHOOK_SECRET in LeanPloy's .env"
          />
        )}

        <div className="flex justify-end pt-2 border-t">
          <ModernButton onClick={onClose}>Done</ModernButton>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

const AdminBridgeClients: React.FC = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState<{
    apiToken: string;
    webhookSecret: string | null;
  } | null>(null);

  const { data: rawData, isLoading } = useBridgeClients();
  const deleteMutation = useDeleteBridgeClient();
  const rotateMutation = useRotateBridgeClientToken();

  const envelope = rawData as { data?: BridgeClient[]; meta?: { total: number } } | undefined;
  const clients: BridgeClient[] = envelope?.data ?? [];
  const meta = envelope?.meta;

  const activeCount = clients.filter((c) => c.is_active && !c.is_expired).length;
  const expiredCount = clients.filter((c) => c.is_expired).length;
  const _totalServers = 0; // Could be fetched from a summary endpoint

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.tenant_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = (result: CreateResponse) => {
    setShowCreate(false);
    setCredentials({
      apiToken: result.data.api_token,
      webhookSecret: result.data.webhook_secret,
    });
  };

  const handleRotate = async (client: BridgeClient) => {
    if (!window.confirm(`Rotate API token for "${client.name}"? The old token will stop working immediately.`)) return;
    const result = (await rotateMutation.mutateAsync(client.id)) as { data: { api_token: string } };
    const res = result;
    setCredentials({
      apiToken: res.data.api_token,
      webhookSecret: null,
    });
  };

  const handleDelete = async (client: BridgeClient) => {
    if (!window.confirm(`Delete bridge client "${client.name}"? This will revoke the API token.`)) return;
    await deleteMutation.mutateAsync(client.id);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      tenant: "bg-blue-100 text-blue-700",
      client: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[type] ?? styles.client}`}>
        {type}
      </span>
    );
  };

  const billingBadge = (mode: string) => {
    const styles: Record<string, string> = {
      internal: "bg-gray-100 text-gray-600",
      prepaid: "bg-green-100 text-green-700",
      postpaid: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[mode] ?? styles.internal}`}>
        {mode}
      </span>
    );
  };

  /**
   * Article 4.4 — surfaces the worst SSH key rotation status for the
   * bridge client's keys. A red "Suspended" badge means the daily
   * `security:check-bridge-ssh-keys` enforcement command will (or
   * already did) flip is_active=false.
   */
  const sshKeyBadge = (rot: SshKeyRotation | undefined) => {
    if (!rot || rot.worst_status === "no_keys") {
      return (
        <span
          className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full inline-flex items-center gap-1 w-fit"
          title="No SSH keys uploaded for this bridge client yet."
        >
          <Key size={10} /> None
        </span>
      );
    }

    const tooltipBase = `${rot.key_count} key${rot.key_count === 1 ? "" : "s"} · oldest ${rot.oldest_age_days}d (rotation window ${rot.rotation_window_days}d, grace ${rot.rotation_grace_days}d)`;

    if (rot.worst_status === "suspended") {
      return (
        <span
          className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full inline-flex items-center gap-1 w-fit"
          title={`Past 30-day grace — bridge client will be auto-suspended. ${tooltipBase}`}
        >
          <AlertTriangle size={10} /> Suspended ({rot.oldest_age_days}d)
        </span>
      );
    }
    if (rot.worst_status === "overdue") {
      return (
        <span
          className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full inline-flex items-center gap-1 w-fit"
          title={`Rotation overdue (Article 4.4 90-day window exceeded). ${tooltipBase}`}
        >
          <Clock size={10} /> Overdue ({rot.oldest_age_days}d)
        </span>
      );
    }
    if (rot.worst_status === "warning") {
      return (
        <span
          className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full inline-flex items-center gap-1 w-fit"
          title={`Rotation due within ${rot.rotation_window_days - rot.oldest_age_days} days. ${tooltipBase}`}
        >
          <Clock size={10} /> Rotate soon ({rot.oldest_age_days}d)
        </span>
      );
    }
    return (
      <span
        className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full inline-flex items-center gap-1 w-fit"
        title={`Within rotation window. ${tooltipBase}`}
      >
        <Check size={10} /> Fresh ({rot.oldest_age_days}d)
      </span>
    );
  };

  return (
    <AdminPageShell
      title="Bridge Clients"
      description="Manage API clients for LeanPloy integration with UniCloud."
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ModernStatsCard
          title="Total Clients"
          value={meta?.total ?? clients.length}
          icon={<Key size={20} />}
          color="primary"
        />
        <ModernStatsCard
          title="Active"
          value={activeCount}
          icon={<Shield size={20} />}
          color="success"
        />
        <ModernStatsCard
          title="Expired"
          value={expiredCount}
          icon={<Clock size={20} />}
          color={expiredCount > 0 ? "warning" : "info"}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-64 rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <ModernButton onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Create Client
        </ModernButton>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Tenant</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Billing</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Used</th>
              <th className="px-4 py-3 text-left" title="StaqDB bridge SSH key rotation status (Article 4.4 — 90-day window).">
                SSH Key
              </th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  {search ? "No clients match your search" : "No bridge clients yet. Create one to get started."}
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-800">{client.name}</span>
                      <p className="text-xs text-gray-400 font-mono">{client.uuid.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.tenant_name ?? `#${client.tenant_id}`}
                  </td>
                  <td className="px-4 py-3">{typeBadge(client.client_type)}</td>
                  <td className="px-4 py-3">{billingBadge(client.billing_mode)}</td>
                  <td className="px-4 py-3">
                    {client.is_expired ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 w-fit">
                        <AlertTriangle size={10} /> Expired
                      </span>
                    ) : client.is_active ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1 w-fit">
                        <Check size={10} /> Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex items-center gap-1 w-fit">
                        <X size={10} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {client.last_used_at ? (
                      <div>
                        <div>{formatDate(client.last_used_at)}</div>
                        {client.last_used_ip && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Globe size={10} /> {client.last_used_ip}
                          </div>
                        )}
                      </div>
                    ) : (
                      "Never"
                    )}
                  </td>
                  <td className="px-4 py-3">{sshKeyBadge(client.ssh_key_rotation)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(client.expires_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRotate(client)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Rotate token"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete client"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateBridgeClientModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {credentials && (
        <CredentialsModal
          apiToken={credentials.apiToken}
          webhookSecret={credentials.webhookSecret}
          onClose={() => setCredentials(null)}
        />
      )}
    </AdminPageShell>
  );
};

export default AdminBridgeClients;
