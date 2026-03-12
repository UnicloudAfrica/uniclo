import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ModernButton, ModernModal } from "../../ui";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import { getContextPrefix } from "./orderSuccessUtils";
import type { KeypairDownload } from "./OrderSuccessStep.types";

interface KeypairDownloadModalProps {
  keypairDownloads?: KeypairDownload[];
}

const KeypairDownloadModal: React.FC<KeypairDownloadModalProps> = ({ keypairDownloads }) => {
  const { apiBaseUrl, authHeaders, isAuthenticated, context } = useApiContext();
  const apiPrefix = getContextPrefix(context);
  const apiRoot = `${apiBaseUrl}${apiPrefix}`;

  const sanitizedDownloads = useMemo(
    () => (keypairDownloads || []).filter((item) => item && item.name && item.material),
    [keypairDownloads]
  );

  const [showKeypairModal, setShowKeypairModal] = useState(false);
  const [downloadedKeys, setDownloadedKeys] = useState<string[]>([]);
  const [emailingKeys, setEmailingKeys] = useState<string[]>([]);

  useEffect(() => {
    if (sanitizedDownloads.length > 0) {
      setShowKeypairModal(true);
    }
  }, [sanitizedDownloads.length]);

  const downloadPrivateKey = (material: string, name: string) => {
    const blob = new Blob([material], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/[^a-zA-Z0-9-_]/g, "_") || "keypair"}.pem`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setDownloadedKeys((prev) => [...prev, name]);
  };

  const sendKeypairEmail = useCallback(
    async (keypairId?: string | number, keyLabel?: string) => {
      if (!keypairId) {
        ToastUtils.error("Key pair ID is missing. Unable to email the key.");
        return;
      }
      if (!isAuthenticated) {
        ToastUtils.error("Sign in to email the key pair.");
        return;
      }

      const id = String(keypairId);
      setEmailingKeys((prev) => [...prev, id]);
      try {
        const response = await fetch(`${apiRoot}/key-pairs/${id}/email`, {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Failed to email key pair.");
        }

        ToastUtils.success(
          payload?.message || `Key pair ${keyLabel ? `"${keyLabel}" ` : ""}emailed successfully.`
        );
      } catch (error: any) {
        ToastUtils.error(error?.message || "Could not email the key pair.");
      } finally {
        setEmailingKeys((prev) => prev.filter((item) => item !== id));
      }
    },
    [apiRoot, authHeaders, isAuthenticated]
  );

  return (
    <ModernModal
      isOpen={showKeypairModal}
      onClose={() => setShowKeypairModal(false)}
      title="Download your private key"
      subtitle="Store this .pem file securely. You will not be able to retrieve it later."
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          These key pairs were generated during provisioning. Download each private key and keep it
          safe.
        </p>
        {sanitizedDownloads.length === 0 ? (
          <p className="text-sm text-gray-500">No key pairs to download.</p>
        ) : (
          <div className="space-y-3">
            {sanitizedDownloads.map((item) => {
              const keyLabel = item.name || "keypair";
              const contextLabel = [item.project_name, item.region].filter(Boolean).join(" • ");
              const hasDownloaded = downloadedKeys.includes(keyLabel);
              const emailKey = item.id !== undefined && item.id !== null ? String(item.id) : "";
              const isEmailing = emailKey ? emailingKeys.includes(emailKey) : false;
              return (
                <div
                  key={`${item.id || keyLabel}-${contextLabel}`}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{keyLabel}</p>
                      {contextLabel ? (
                        <p className="text-xs text-gray-500">{contextLabel}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPrivateKey(item.material, keyLabel)}
                        isDisabled={hasDownloaded}
                      >
                        {hasDownloaded ? "Downloaded" : "Download .pem"}
                      </ModernButton>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => sendKeypairEmail(item.id, keyLabel)}
                        isDisabled={!emailKey || isEmailing}
                      >
                        {isEmailing ? "Emailing..." : "Email .pem"}
                      </ModernButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModernModal>
  );
};

export default KeypairDownloadModal;
