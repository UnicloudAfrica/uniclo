import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../../components/AdminPageShell";
import {
  ModernButton,
  ModernInput,
  ModernSelect,
  ModernCard,
  ModernTable,
  ModernModal,
} from "@/shared/components/ui";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "../api";
import { translateBucketError } from "../bucketErrorTranslator";
import { ValidationLockoutBadge } from "@/shared/components/bucket-replication";

/**
 * UniCloud admin UI for the AnyCloudFlow bucket-endpoint proxy.
 *
 * Phase 1 MVP — admin-only per BG-9. Tenant-facing credential entry arrives
 * in Phase 2 alongside ongoing replication. Providers limited to S3 + MinIO
 * (S3-compatible custom endpoint). The backend will reject GCS/Azure/Swift
 * at preflight with a "Phase 3" error.
 */

interface BucketEndpoint {
  identifier: string;
  label: string;
  provider: string;
  bucket_name: string;
  region?: string | null;
  endpoint_url?: string | null;
  has_versioning?: boolean | null;
  has_object_lock?: boolean | null;
  requester_pays?: boolean | null;
  preflight_passed_at?: string | null;
  preflight_error?: string | null;
  access_key_masked?: string | null;
  // SEC-AUDIT-BUCKET-5 / HIGH-4 — validation-lockout state. Shown as a
  // badge on the row; when locked, Validate button is hidden in favour of
  // Unlock (which also requires typing the endpoint label to confirm).
  consecutive_validation_failures?: number;
  validation_locked_at?: string | null;
  validation_locked_reason?: string | null;
}

export default function BucketEndpointsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [iamTarget, setIamTarget] = useState<BucketEndpoint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BucketEndpoint | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-bucket-endpoints"],
    queryFn: () => acfApi.listBucketEndpoints(),
  });
  const rows: BucketEndpoint[] = (data as { data?: unknown })?.data ?? (data as unknown) ?? [];

  const validate = useMutation({
    mutationFn: (id: string) => acfApi.validateBucketEndpoint(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-endpoints"] });
      ToastUtils.success("Credentials validated");
    },
    onError: (err: unknown) => ToastUtils.error(translateBucketError(err, "Validation failed — check credentials + IAM policy")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => acfApi.deleteBucketEndpoint(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-endpoints"] });
      setDeleteTarget(null);
      ToastUtils.success("Endpoint removed");
    },
    onError: () => ToastUtils.error("Delete failed — endpoint may be in use by a migration"),
  });

  // SEC-AUDIT-BUCKET-5 / HIGH-4 — clear validation lockout.
  const unlock = useMutation({
    mutationFn: (id: string) => acfApi.unlockBucketEndpointValidation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-endpoints"] });
      ToastUtils.success("Validation lockout cleared. Rotate credentials before the next validate attempt.");
    },
    onError: (err: unknown) => ToastUtils.error(translateBucketError(err, "Unlock failed")),
  });

  const columns = [
    { key: "label", header: "Label", render: (e: BucketEndpoint) => e.label },
    { key: "provider", header: "Provider", render: (e: BucketEndpoint) => (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
        {e.provider.toUpperCase()}
      </span>
    )},
    { key: "bucket_name", header: "Bucket", render: (e: BucketEndpoint) => <code className="text-xs">{e.bucket_name}</code> },
    { key: "region", header: "Region", render: (e: BucketEndpoint) => e.region ?? "—" },
    { key: "preflight", header: "Preflight / Lockout", render: (e: BucketEndpoint) => (
      <div className="flex flex-col gap-0.5">
        {e.preflight_passed_at ? (
          <span className="text-green-600 text-xs">✓ passed</span>
        ) : e.preflight_error ? (
          <span className="text-red-600 text-xs" title={e.preflight_error}>✗ failed</span>
        ) : (
          <span className="text-gray-400 text-xs">not run</span>
        )}
        {/* SEC-AUDIT-BUCKET-5 lockout state — shared component owns the
            tone, ARIA live region, and threshold copy. */}
        <ValidationLockoutBadge endpoint={e} />
      </div>
    )},
    { key: "actions", header: "", render: (e: BucketEndpoint) => (
      <div className="flex gap-1">
        <ModernButton size="sm" variant="secondary" onClick={() => setIamTarget(e)}>IAM Policy</ModernButton>
        {e.validation_locked_at ? (
          <ModernButton
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm(`Unlock "${e.label}"? Only do this after rotating the credentials — otherwise the lockout will just re-trigger on the next failed validate.`)) {
                unlock.mutate(e.identifier);
              }
            }}
            disabled={unlock.isPending}
          >
            {unlock.isPending ? "Unlocking…" : "Unlock"}
          </ModernButton>
        ) : (
          <ModernButton size="sm" variant="secondary" onClick={() => validate.mutate(e.identifier)} disabled={validate.isPending}>
            Validate
          </ModernButton>
        )}
        <Link
          to={`/admin-dashboard/integrations/anycloudflow/buckets/client-access?prefill_resource_type=endpoint&prefill_identifier=${encodeURIComponent(e.identifier)}`}
          className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#172036] hover:bg-gray-50 dark:hover:bg-[#172036]"
          aria-label={`Share endpoint ${e.label} with a client`}
        >
          Share
        </Link>
        <ModernButton size="sm" variant="danger" onClick={() => setDeleteTarget(e)}>Delete</ModernButton>
      </div>
    )},
  ];

  return (
    <AdminPageShell
      title="Bucket Endpoints"
      description="Registered object-storage buckets usable as migration sources or targets. Admin-only in Phase 1."
      actions={<ModernButton onClick={() => setCreating(true)}>+ Register Bucket</ModernButton>}
    >
      <div className="space-y-4">
        {rows.length === 0 && !isLoading ? (
          <ModernCard>
            <div className="p-8 text-center">
              <p className="font-semibold text-gray-800 dark:text-gray-200">No bucket endpoints registered</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Register at least 2 endpoints (source + target) to run a migration.
              </p>
              <div className="mt-4">
                <ModernButton onClick={() => setCreating(true)}>Register first bucket</ModernButton>
              </div>
            </div>
          </ModernCard>
        ) : (
          <ModernTable columns={columns} data={rows as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
        )}

        {creating && <CreateEndpointModal onClose={() => setCreating(false)} onCreated={() => {
          qc.invalidateQueries({ queryKey: ["acf-bucket-endpoints"] });
          setCreating(false);
        }} />}

        {iamTarget && <IamPolicyModal endpoint={iamTarget} onClose={() => setIamTarget(null)} />}

        {deleteTarget && (
          <ConfirmDialog
            isOpen={true}
            title="Delete bucket endpoint?"
            message={`Remove "${deleteTarget.label}" (${deleteTarget.bucket_name})? Migrations referencing this endpoint will fail.`}
            confirmLabel="Yes, delete"
            variant="danger"
            onConfirm={() => remove.mutate(deleteTarget.identifier)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </AdminPageShell>
  );
}

function CreateEndpointModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<"s3" | "minio">("s3");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");

  const create = useMutation({
    mutationFn: () => acfApi.createBucketEndpoint({
      label,
      provider,
      bucket_name: bucketName,
      region: region || undefined,
      endpoint_url: endpointUrl || undefined,
      access_key_id: accessKeyId,
      secret_access_key: secretAccessKey,
    }),
    onSuccess: () => {
      ToastUtils.success("Endpoint registered — run preflight next");
      onCreated();
    },
    onError: (err: unknown) => ToastUtils.error(translateBucketError(err, "Registration failed")),
  });

  const canSubmit = label && bucketName && accessKeyId && secretAccessKey;

  return (
    <ModernModal isOpen={true} onClose={onClose} title="Register bucket endpoint">
      <div className="p-4 space-y-3">
        <ModernInput label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="prod-source" />
        <ModernSelect
          label="Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as "s3" | "minio")}
          options={[
            { value: "s3", label: "AWS S3" },
            { value: "minio", label: "S3-compatible (MinIO / Wasabi / Ceph)" },
          ]}
        />
        <ModernInput label="Bucket name" value={bucketName} onChange={(e) => setBucketName(e.target.value)} />
        <ModernInput label="Region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="us-east-1" />
        {provider === "minio" && (
          <ModernInput
            label="Custom endpoint URL"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://minio.example.com"
          />
        )}
        <ModernInput
          label="Access key ID"
          value={accessKeyId}
          onChange={(e) => setAccessKeyId(e.target.value)}
        />
        <ModernInput
          label="Secret access key"
          type="password"
          value={secretAccessKey}
          onChange={(e) => setSecretAccessKey(e.target.value)}
        />
        <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
          <strong>Minimum IAM permissions:</strong> source needs <code>s3:ListBucket</code>, <code>s3:GetObject</code>, <code>s3:GetObjectTagging</code>;
          target needs <code>s3:ListBucket</code>, <code>s3:PutObject</code>, <code>s3:PutObjectTagging</code>.
          View the full policy after saving via the IAM Policy action.
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <ModernButton variant="secondary" onClick={onClose}>Cancel</ModernButton>
          <ModernButton onClick={() => create.mutate()} disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Registering…" : "Register"}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
}

function IamPolicyModal({ endpoint, onClose }: { endpoint: BucketEndpoint; onClose: () => void }) {
  const [role, setRole] = useState<"source" | "target">("source");
  const { data } = useQuery({
    queryKey: ["acf-bucket-iam", endpoint.identifier, role],
    queryFn: () => acfApi.getBucketEndpointIamPolicy(endpoint.identifier, role),
  });
  const policy = (data as { data?: unknown })?.data?.policy ?? (data as unknown)?.policy ?? null;

  const copyPolicy = () => {
    if (policy) {
      navigator.clipboard.writeText(JSON.stringify(policy, null, 2));
      ToastUtils.success("Policy copied — paste into your AWS IAM console");
    }
  };

  return (
    <ModernModal isOpen={true} onClose={onClose} title={`IAM policy for "${endpoint.label}"`}>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {(["source", "target"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1 text-xs rounded-full ${
                role === r
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              Use as {r}
            </button>
          ))}
        </div>
        <pre className="bg-gray-100 dark:bg-[#15203c] p-3 rounded text-xs overflow-x-auto max-h-80">
          {policy ? JSON.stringify(policy, null, 2) : "Loading…"}
        </pre>
        <div className="flex justify-end gap-2">
          <ModernButton variant="secondary" onClick={onClose}>Close</ModernButton>
          <ModernButton onClick={copyPolicy} disabled={!policy}>Copy policy</ModernButton>
        </div>
      </div>
    </ModernModal>
  );
}
