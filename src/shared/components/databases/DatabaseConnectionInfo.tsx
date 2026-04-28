/**
 * DatabaseConnectionInfo -- Connection details, connection strings, SSL status,
 * and connection pooling configuration for a managed database.
 */
import React, { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Globe,
  Lock,
  Server,
  Database,
  Wifi,
  Download,
  Settings,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchConnectionInfo,
  useFetchDatabasePoolingConfig,
  useUpdateDatabasePoolingConfig,
  useFetchDatabaseSslCertificate,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ─── Types ───────────────────────────────────────────────────────

interface ConnectionInfo {
  host: string;
  port: number;
  database: string;
  username: string;
  engine: string;
  ssl_enabled: boolean;
  network_mode: string;
  connection_strings: Record<string, string>;
}

interface PoolingConfig {
  supported: boolean;
  pooler: string | null;
  enabled: boolean;
  pool_mode: string;
  pool_size: number;
  max_client_connections: number;
  idle_timeout: number;
  pooler_port: number | null;
}

interface SslCertificate {
  ssl_enabled: boolean;
  ca_certificate: string | null;
  expires_at: string | null;
  issued_at: string | null;
  issuer: string | null;
  subject: string | null;
  fingerprint: string | null;
}

interface DatabaseConnectionInfoProps {
  databaseId: string | number;
}

// ─── Copy Button ─────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      title={`Copy ${label ?? "to clipboard"}`}
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
};

// ─── Connection String Item ──────────────────────────────────────

const ConnectionStringRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <code className="block break-all text-xs text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
        {value}
      </code>
    </div>
    <CopyButton text={value} />
  </div>
);

// ─── Driver Label Map ────────────────────────────────────────────

const DRIVER_LABELS: Record<string, string> = {
  uri: "Connection URI",
  psql: "psql CLI",
  cli: "CLI",
  jdbc: "JDBC",
  dotnet: ".NET / C#",
};

// ─── Main Component ──────────────────────────────────────────────

const DatabaseConnectionInfo: React.FC<DatabaseConnectionInfoProps> = ({ databaseId }) => {
  const { data: connectionRaw, isLoading: connLoading } = useFetchConnectionInfo(databaseId);
  const { data: poolingRaw, isLoading: poolLoading } = useFetchDatabasePoolingConfig(databaseId);
  const { data: sslRaw, isLoading: sslLoading } = useFetchDatabaseSslCertificate(databaseId);
  const poolingMutation = useUpdateDatabasePoolingConfig();

  const connection = connectionRaw as unknown as ConnectionInfo | undefined;
  const pooling = poolingRaw as unknown as PoolingConfig | undefined;
  const ssl = sslRaw as unknown as SslCertificate | undefined;

  const [poolSize, setPoolSize] = useState<string>("");

  // ── Loading ──
  if (connLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading connection info...</p>
      </div>
    );
  }

  if (!connection) {
    return (
      <ModernCard className="py-12 text-center">
        <Database size={28} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">Connection information not available.</p>
      </ModernCard>
    );
  }

  const handleTogglePooling = () => {
    if (!pooling) return;
    poolingMutation.mutate({
      identifier: databaseId,
      config: { enabled: !pooling.enabled },
    });
  };

  const handleUpdatePoolSize = () => {
    const size = parseInt(poolSize, 10);
    if (isNaN(size) || size < 1) return;
    poolingMutation.mutate({
      identifier: databaseId,
      config: { pool_size: size },
    });
    setPoolSize("");
  };

  const handleDownloadCert = () => {
    if (!ssl?.ca_certificate) return;
    const blob = new Blob([ssl.ca_certificate], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ca-certificate.pem";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Connection Details Card */}
      <ModernCard padding="none" className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Globe size={16} className="text-emerald-500" />
            Connection Details
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Host</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                  {connection.host}
                </code>
                <CopyButton text={connection.host} />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Port</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  {connection.port}
                </code>
                <CopyButton text={String(connection.port)} />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Database</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                  {connection.database}
                </code>
                <CopyButton text={connection.database} />
              </div>
            </div>
          </div>

          {/* Network & SSL badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <Wifi size={12} />
              {connection.network_mode === "public" ? "Public" : "Private"} Network
            </span>
            {connection.ssl_enabled ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                <Lock size={12} />
                SSL/TLS Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                <Shield size={12} />
                SSL/TLS Disabled
              </span>
            )}
          </div>
        </div>
      </ModernCard>

      {/* Connection Strings Card */}
      <ModernCard className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <Server size={16} className="text-blue-500" />
          Connection Strings
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Replace <code className="text-amber-600 dark:text-amber-400">&lt;PASSWORD&gt;</code> with
          your database password. Never share connection strings containing credentials.
        </p>
        <div className="space-y-2">
          {Object.entries(connection.connection_strings).map(([driver, connStr]) => (
            <ConnectionStringRow
              key={driver}
              label={DRIVER_LABELS[driver] ?? driver.toUpperCase()}
              value={connStr}
            />
          ))}
        </div>
      </ModernCard>

      {/* Connection Pooling Card */}
      {!poolLoading && pooling && pooling.supported && (
        <ModernCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <Settings size={16} className="text-violet-500" />
              Connection Pooling
              <span className="rounded bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700 dark:text-violet-300">
                {pooling.pooler}
              </span>
            </div>
            <button
              onClick={handleTogglePooling}
              disabled={poolingMutation.isPending}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title={pooling.enabled ? "Disable pooling" : "Enable pooling"}
            >
              {pooling.enabled ? (
                <ToggleRight size={28} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={28} className="text-gray-400" />
              )}
            </button>
          </div>

          {pooling.enabled && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pool Mode</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                  {pooling.pool_mode}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pool Size</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {pooling.pool_size}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Clients</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {pooling.max_client_connections}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pooler Port</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {pooling.pooler_port ?? "N/A"}
                </p>
              </div>
            </div>
          )}

          {pooling.enabled && (
            <div className="flex items-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex-1 max-w-[160px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Adjust Pool Size
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={poolSize}
                  onChange={(e) => setPoolSize(e.target.value)}
                  placeholder={String(pooling.pool_size)}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
              </div>
              <ModernButton
                variant="outline"
                size="sm"
                loading={poolingMutation.isPending}
                onClick={handleUpdatePoolSize}
                disabled={!poolSize}
              >
                Update
              </ModernButton>
            </div>
          )}
        </ModernCard>
      )}

      {/* SSL Certificate Card */}
      {!sslLoading && ssl && ssl.ssl_enabled && (
        <ModernCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <Lock size={16} className="text-emerald-500" />
              SSL/TLS Certificate
            </div>
            {ssl.ca_certificate && (
              <ModernButton variant="outline" size="sm" onClick={handleDownloadCert}>
                <Download size={13} className="mr-1" />
                Download CA Cert
              </ModernButton>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ssl.issuer && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Issuer</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{ssl.issuer}</p>
              </div>
            )}
            {ssl.expires_at && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Expires</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {new Date(ssl.expires_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {ssl.fingerprint && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 sm:col-span-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  SHA-256 Fingerprint
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                    {ssl.fingerprint}
                  </code>
                  <CopyButton text={ssl.fingerprint} />
                </div>
              </div>
            )}
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default DatabaseConnectionInfo;
