/**
 * SslPanel — SSL certificate management for a Shield domain.
 */
import React, { useState } from "react";
import { Lock, ShieldCheck, Upload } from "lucide-react";
import ModernButton from "@/shared/components/ui/ModernButton";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernTextarea from "@/shared/components/ui/ModernTextarea";
import StatusPill from "@/shared/components/ui/StatusPill";
import {
  useFetchSslStatus,
  useProvisionSsl,
  useUploadCustomSsl,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldSslStatus } from "@/shared/hooks/resources/shieldHooks";

interface SslPanelProps {
  domainId: string;
}

const SslPanel: React.FC<SslPanelProps> = ({ domainId }) => {
  const { data: rawSsl, isLoading, isError, refetch } = useFetchSslStatus(domainId);
  const ssl = rawSsl as ShieldSslStatus | undefined;
  const provisionSsl = useProvisionSsl();
  const uploadCustom = useUploadCustomSsl();
  const [showUpload, setShowUpload] = useState(false);
  const [cert, setCert] = useState("");
  const [key, setKey] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--theme-color)] border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load SSL status.</p>
        <button onClick={() => refetch()} className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300">Retry</button>
      </div>
    );
  }

  const handleUpload = () => {
    setActionError(null);
    uploadCustom.mutate(
      { domainId, certificate: cert, private_key: key },
      {
        onSuccess: () => setShowUpload(false),
        onError: () => setActionError("Failed to upload certificate. Ensure valid PEM format."),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="db-surface-card rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-[var(--theme-color)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--theme-heading-color)]">
                SSL Certificate
              </h3>
              <p className="text-xs text-[var(--theme-muted-color)]">
                {ssl?.type === "custom"
                  ? "Custom certificate installed"
                  : "Auto-managed certificate"}
              </p>
            </div>
          </div>
          <StatusPill
            status={ssl?.status ?? "unknown"}
            tone={ssl?.status === "active" ? "success" : "warning"}
          />
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {actionError}
        </div>
      )}

      <div className="flex gap-3">
        <ModernButton
          variant="secondary"
          onClick={() => {
            setActionError(null);
            provisionSsl.mutate(domainId, {
              onError: () => setActionError("Failed to provision SSL. Please try again."),
            });
          }}
          disabled={provisionSsl.isPending}
          loading={provisionSsl.isPending}
        >
          <ShieldCheck size={14} className="mr-1.5" />
          Provision Auto SSL
        </ModernButton>

        <ModernButton
          variant="secondary"
          onClick={() => setShowUpload(true)}
        >
          <Upload size={14} className="mr-1.5" />
          Upload Custom Certificate
        </ModernButton>
      </div>

      {showUpload && (
        <ModernModal
          title="Upload Custom SSL Certificate"
          onClose={() => setShowUpload(false)}
          size="lg"
        >
          <div className="space-y-4">
            <ModernTextarea
              label="Certificate (PEM)"
              placeholder="-----BEGIN CERTIFICATE-----"
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              rows={6}
            />
            <ModernTextarea
              label="Private Key (PEM)"
              placeholder="-----BEGIN PRIVATE KEY-----"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2 pt-2">
              <ModernButton variant="secondary" onClick={() => setShowUpload(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                onClick={handleUpload}
                disabled={!cert || !key || uploadCustom.isPending}
                loading={uploadCustom.isPending}
              >
                Upload
              </ModernButton>
            </div>
          </div>
        </ModernModal>
      )}
    </div>
  );
};

export default SslPanel;
