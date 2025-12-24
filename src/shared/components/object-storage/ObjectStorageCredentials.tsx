// @ts-nocheck
import React, { useState } from "react";
import { Copy, Check, Key, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface ObjectStorageCredentialsProps {
  endpoint?: string;
  accessKeyId?: string;
  secretKey?: string; // Only shown once after creation
  showSecretOnce?: boolean;
  onSecretDismissed?: () => void;
  className?: string;
}

const ObjectStorageCredentials: React.FC<ObjectStorageCredentialsProps> = ({
  endpoint,
  accessKeyId,
  secretKey,
  showSecretOnce = false,
  onSecretDismissed,
  className = "",
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secretVisible, setSecretVisible] = useState(showSecretOnce);
  const [secretDismissed, setSecretDismissed] = useState(false);

  const handleCopy = async (value: string, field: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const handleDismissSecret = () => {
    setSecretDismissed(true);
    onSecretDismissed?.();
  };

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <button
      type="button"
      onClick={() => handleCopy(value, field)}
      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
      title={copiedField === field ? "Copied!" : "Copy"}
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-5 w-5 text-primary-500" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          S3 Connection Details
        </h3>
      </div>

      <div className="space-y-4">
        {/* Endpoint */}
        {endpoint && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Endpoint URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-slate-700 break-all">{endpoint}</code>
              <CopyButton value={endpoint} field="endpoint" />
            </div>
          </div>
        )}

        {/* Access Key ID */}
        {accessKeyId && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Access Key ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-slate-700">{accessKeyId}</code>
              <CopyButton value={accessKeyId} field="accessKey" />
            </div>
          </div>
        )}

        {/* Secret Key - One-time display */}
        {secretKey && !secretDismissed && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Save your Secret Key now!</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This is the only time you will see this secret. Store it securely.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-amber-200">
              <p className="text-xs font-medium text-slate-500 mb-1">Secret Access Key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-700">
                  {secretVisible ? secretKey : "••••••••••••••••••••••••••••••••"}
                </code>
                <button
                  type="button"
                  onClick={() => setSecretVisible(!secretVisible)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
                >
                  {secretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <CopyButton value={secretKey} field="secret" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissSecret}
              className="mt-3 w-full rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 transition"
            >
              I have saved the secret key
            </button>
          </div>
        )}

        {/* No secret - permanent display */}
        {!secretKey && (
          <p className="text-xs text-slate-400 mt-2">
            Secret key was only shown once during creation. Contact support to regenerate
            credentials.
          </p>
        )}
      </div>
    </div>
  );
};

export default ObjectStorageCredentials;
