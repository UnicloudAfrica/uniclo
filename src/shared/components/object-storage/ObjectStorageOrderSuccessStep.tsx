import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import objectStorageApi from "../../../services/objectStorageApi";
import { useObjectStorageBroadcasting } from "../../../hooks/useObjectStorageBroadcasting";
import SetupProgressCard from "../projects/details/SetupProgressCard";
import { ModernButton } from "../ui";
import ToastUtils from "../../../utils/toastUtil";
import ObjectStorageCredentials from "./ObjectStorageCredentials";

interface ObjectStorageOrderSuccessStepProps {
  accountId?: string | null;
  accountIds?: Array<string | number | null>;
  orderId?: string | null;
  transactionId?: string | null;
  isFastTrack?: boolean;
  dashboardContext: "admin" | "tenant" | "client";
  onCreateAnother?: () => void;
}

const resolveStoragePaths = (context: ObjectStorageOrderSuccessStepProps["dashboardContext"]) => {
  if (context === "admin") {
    return {
      list: "/admin-dashboard/object-storage",
      detail: (id: string) => `/admin-dashboard/object-storage/${id}`,
    };
  }
  if (context === "tenant") {
    return {
      list: "/dashboard/object-storage",
      detail: (id: string) => `/dashboard/object-storage/${id}`,
    };
  }
  return {
    list: "/client-dashboard/object-storage",
    detail: (id: string) => `/client-dashboard/object-storage/${id}`,
  };
};

const normalizeStatus = (
  status?: string | null
): "completed" | "pending" | "not_started" | "failed" => {
  const normalized = String(status || "").toLowerCase();
  if (["completed", "complete", "success", "successful", "done"].includes(normalized)) {
    return "completed";
  }
  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }
  if (["pending", "processing", "running", "in_progress"].includes(normalized)) {
    return "pending";
  }
  if (!normalized) return "not_started";
  return "pending";
};

const resolveProvisioningSteps = (account: any) => {
  const rawSteps =
    account?.meta?.provisioning_progress ||
    account?.provisioning_progress ||
    account?.meta?.provisioning?.steps ||
    [];

  if (!Array.isArray(rawSteps)) return [];

  return rawSteps.map((step: any, index: number) => ({
    id: step.id || step.key || step.label || `step-${index}`,
    label: step.label || step.name || step.id || `Step ${index + 1}`,
    status: normalizeStatus(step.status),
    description: step.description,
    updated_at: step.updated_at,
    context: step.context,
  }));
};

const buildCredentialFilename = (label: string, id: string) => {
  const base = String(label || id || "storage")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `s3-credentials-${base || "storage"}.txt`;
};

export const ObjectStorageOrderSuccessStep: React.FC<ObjectStorageOrderSuccessStepProps> = ({
  accountId,
  accountIds,
  orderId,
  transactionId,
  isFastTrack = false,
  dashboardContext,
  onCreateAnother,
}) => {
  const navigate = useNavigate();
  const [accountsById, setAccountsById] = useState<Record<string, any>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});

  const storagePaths = useMemo(() => resolveStoragePaths(dashboardContext), [dashboardContext]);

  const resolvedAccountIds = useMemo(() => {
    const rawIds = [...(accountIds || []), ...(accountId ? [accountId] : [])]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value));
    return Array.from(new Set(rawIds));
  }, [accountId, accountIds]);

  const fetchAccountById = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const data = await objectStorageApi.fetchAccount(id);
      setAccountsById((prev) => ({ ...prev, [id]: data }));
    } catch (error) {
      console.error("Failed to load storage account:", error);
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const fetchAllAccounts = useCallback(async () => {
    if (resolvedAccountIds.length === 0) return;
    await Promise.all(resolvedAccountIds.map((id) => fetchAccountById(id)));
  }, [fetchAccountById, resolvedAccountIds]);

  useEffect(() => {
    if (resolvedAccountIds.length === 0) return;
    fetchAllAccounts();
  }, [fetchAllAccounts, resolvedAccountIds]);

  useEffect(() => {
    setConfirmations({});
  }, [resolvedAccountIds.join("|")]);

  const handleProvisioningUpdate = useCallback(
    (event: any) => {
      const updatedId =
        event?.accountId || event?.account_id || event?.account?.id || event?.account?.uuid;
      if (updatedId) {
        fetchAccountById(String(updatedId));
        return;
      }
      fetchAllAccounts();
    },
    [fetchAccountById, fetchAllAccounts]
  );

  useObjectStorageBroadcasting(resolvedAccountIds, handleProvisioningUpdate);

  const accountSummaries = useMemo(() => {
    return resolvedAccountIds.map((id, index) => {
      const account = accountsById[id];
      const steps = resolveProvisioningSteps(account);
      const accessKeyStep = steps.find((step) => step.id === "access_key_ready");
      const finalizeStep = steps.find((step) => step.id === "finalize");
      return {
        id,
        account,
        steps,
        accessKeyStep,
        finalizeStep,
        label: account?.name || `Storage Account ${index + 1}`,
        region: account?.region,
      };
    });
  }, [accountsById, resolvedAccountIds]);

  const allAccessKeysReady =
    accountSummaries.length > 0 &&
    accountSummaries.every((entry) => entry.accessKeyStep?.status === "completed");
  const allProvisioningComplete =
    accountSummaries.length > 0 &&
    accountSummaries.every((entry) => entry.finalizeStep?.status === "completed");
  const credentialsReady = allAccessKeysReady && allProvisioningComplete;

  const credentialEntries = useMemo(() => {
    if (!credentialsReady) return [];
    return accountSummaries.map((entry) => {
      const context = entry.accessKeyStep?.context || {};
      return {
        id: entry.id,
        label: entry.label,
        region: entry.region,
        endpoint: context.endpoint,
        accessKeyId: context.key_id,
        secretKey: context.secret,
      };
    });
  }, [accountSummaries, credentialsReady]);

  useEffect(() => {
    if (!credentialsReady || credentialEntries.length === 0) return;
    setConfirmations((prev) => {
      const next = { ...prev };
      credentialEntries.forEach((entry) => {
        if (!entry.secretKey) {
          next[entry.id] = true;
        }
      });
      return next;
    });
  }, [credentialEntries, credentialsReady]);

  const allConfirmed =
    credentialsReady &&
    credentialEntries.length > 0 &&
    credentialEntries.every((entry) => confirmations[entry.id]);
  const canNavigateAway = credentialsReady && allConfirmed;

  const isLoading = useMemo(() => {
    if (resolvedAccountIds.length === 0) return false;
    return resolvedAccountIds.some((id) => loadingIds[id]);
  }, [loadingIds, resolvedAccountIds]);

  const infoItems = useMemo(() => {
    const items = [
      { label: "Order", value: orderId },
      { label: "Transaction", value: transactionId },
    ];

    if (resolvedAccountIds.length === 1) {
      items.push({ label: "Account", value: resolvedAccountIds[0] });
    }

    if (resolvedAccountIds.length > 1) {
      items.push({ label: "Accounts", value: `${resolvedAccountIds.length}` });
    }

    return items.filter((item) => item.value);
  }, [orderId, resolvedAccountIds, transactionId]);

  const primaryAccountId = resolvedAccountIds.length === 1 ? resolvedAccountIds[0] : null;

  const handleDownloadCredentials = useCallback((entry: any) => {
    const credentials = {
      endpoint: entry.endpoint || "",
      access_key_id: entry.accessKeyId || "",
      secret_access_key: entry.secretKey || "",
      account_name: entry.label || entry.id || "",
      region: entry.region || "",
      created_at: new Date().toISOString(),
      warning: "KEEP THIS FILE SECURE! The secret key cannot be recovered if lost.",
    };

    const content = `# Silo Storage Credentials
# Account: ${credentials.account_name}
# Region: ${credentials.region}
# Downloaded: ${credentials.created_at}
# WARNING: Keep this file secure and never share it.

ENDPOINT=${credentials.endpoint}
ACCESS_KEY_ID=${credentials.access_key_id}
SECRET_ACCESS_KEY=${credentials.secret_access_key}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildCredentialFilename(credentials.account_name, entry.id);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    ToastUtils.success("Credentials downloaded. Store this file securely!");
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isFastTrack ? "Provisioning started" : "Order confirmed"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isFastTrack
            ? "Fast-track provisioning is underway. Live updates will appear below."
            : "Payment verified. Provisioning has begun and will update in real time."}
        </p>

        {infoItems.length > 0 && (
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {primaryAccountId ? (
            <ModernButton
              onClick={() => navigate(storagePaths.detail(primaryAccountId))}
              isDisabled={!canNavigateAway}
            >
              View storage account
            </ModernButton>
          ) : (
            <ModernButton onClick={() => navigate(storagePaths.list)} isDisabled={!canNavigateAway}>
              Back to storage list
            </ModernButton>
          )}
          {onCreateAnother && (
            <ModernButton variant="outline" onClick={onCreateAnother} isDisabled={!canNavigateAway}>
              Create another
            </ModernButton>
          )}
        </div>

        {!canNavigateAway && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
            {credentialsReady
              ? "Confirm that you have downloaded and copied the credentials for all profiles to continue."
              : "Credentials will appear after provisioning completes for all profiles."}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Provisioning progress</h3>
        <p className="text-sm text-gray-500">
          Provisioning runs per service profile. Credentials appear once the final step completes
          for all profiles.
        </p>

        <div className="mt-6 space-y-6">
          {accountSummaries.length === 0 ? (
            <p className="text-sm text-gray-500">
              Provisioning updates will appear once the workflow starts.
            </p>
          ) : (
            accountSummaries.map((entry) => (
              <div key={entry.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{entry.label}</p>
                    <p className="text-xs text-gray-500">
                      {entry.region ? `Region: ${entry.region}` : `Account ID: ${entry.id}`}
                    </p>
                  </div>
                  {entry.finalizeStep?.status === "completed" && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Complete
                    </span>
                  )}
                </div>

                {entry.steps.length > 0 ? (
                  <SetupProgressCard
                    steps={entry.steps}
                    isLoading={Boolean(loadingIds[entry.id])}
                  />
                ) : isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading provisioning status...
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Provisioning updates will appear once the workflow starts.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {credentialsReady && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Credentials</h3>
            <p className="text-sm text-gray-500">
              Download and copy the credentials for each profile. The secret is shown once per
              profile.
            </p>
          </div>

          <div className="space-y-6">
            {credentialEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{entry.label}</p>
                    <p className="text-xs text-gray-500">
                      {entry.region ? `Region: ${entry.region}` : `Account ID: ${entry.id}`}
                    </p>
                  </div>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={() => handleDownloadCredentials(entry)}
                    isDisabled={!entry.accessKeyId || !entry.secretKey}
                  >
                    Download credentials
                  </ModernButton>
                </div>

                <ObjectStorageCredentials
                  endpoint={entry.endpoint}
                  accessKeyId={entry.accessKeyId}
                  secretKey={entry.secretKey}
                  showSecretOnce={true}
                  confirmLabel="I have downloaded and copied these credentials"
                  onSecretDismissed={() =>
                    setConfirmations((prev) => ({
                      ...prev,
                      [entry.id]: true,
                    }))
                  }
                  className="bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectStorageOrderSuccessStep;
