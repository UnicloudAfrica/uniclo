/**
 * Thin typed wrapper around the UniCloud → AnyCloudFlow proxy routes.
 *
 * The shared `api` client already prepends the role-scoped prefix
 * (`/admin/v1`, `/tenant/v1`, or `/api/v1`) — see config.adminURL etc.
 * So `base` here MUST start at `/integrations/anycloudflow`, not
 * `/v1/integrations/anycloudflow`. The previous `/v1/` here produced
 * URLs like `/admin/v1/v1/integrations/anycloudflow/bucket-endpoints`,
 * which 404'd on the backend.
 */
import api from "@/lib/api";

const base = "/integrations/anycloudflow";

export const acfApi = {
  // 2FA
  enable2FA: () => api.post(`${base}/two-factor/enable`),
  confirm2FA: (code: string) => api.post(`${base}/two-factor/confirm`, { code }),
  disable2FA: () => api.delete(`${base}/two-factor`),
  regenerate2FA: (code: string) =>
    api.post(`${base}/two-factor/recovery-codes`, { code }),

  // IP Allowlist
  listIpAllowlist: () => api.get(`${base}/ip-allowlist`),
  addIpAllowlistEntry: (body: {
    ip_address: string;
    cidr_prefix?: number;
    label: string;
    expires_at?: string;
  }) => api.post(`${base}/ip-allowlist`, body),
  removeIpAllowlistEntry: (id: string) =>
    api.delete(`${base}/ip-allowlist/${encodeURIComponent(id)}`),

  // SSH Host Keys
  listSshHostKeys: (status?: string) =>
    api.get(
      `${base}/ssh-host-keys${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  showSshHostKey: (id: string) =>
    api.get(`${base}/ssh-host-keys/${encodeURIComponent(id)}`),
  approveSshHostKey: (id: string) =>
    api.post(`${base}/ssh-host-keys/${encodeURIComponent(id)}/approve`),
  rejectSshHostKey: (id: string) =>
    api.post(`${base}/ssh-host-keys/${encodeURIComponent(id)}/reject`),

  // API Keys
  rotateApiKey: (id: string, gracePeriodHours = 24) =>
    api.post(`${base}/api-keys/${encodeURIComponent(id)}/rotate`, {
      grace_period_hours: gracePeriodHours,
    }),

  // Audit Log
  listAuditLogs: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`${base}/audit-logs${qs ? `?${qs}` : ""}`);
  },
  exportAuditLogs: (format: "csv" | "json", q: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ format, ...q }).toString();
    return api.get(`${base}/audit-logs/export?${qs}`);
  },
  verifyAuditChain: () => api.get(`${base}/audit-logs/verify`),

  // Notifications
  listNotificationPrefs: () => api.get(`${base}/notification-preferences`),
  updateNotificationPrefs: (body: {
    event_type: string;
    channels: string[];
    enabled: boolean;
  }) => api.put(`${base}/notification-preferences`, body),
  testNotificationChannel: (channel: string) =>
    api.post(`${base}/notification-preferences/test`, { channel }),
  getOrgChannels: () =>
    api.get(`${base}/organization/notification-channels`),
  configureOrgChannels: (body: Record<string, string | null>) =>
    api.put(`${base}/organization/notification-channels`, body),

  // Webhook DLQ
  listWebhookDlq: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`${base}/webhook-dead-letters${qs ? `?${qs}` : ""}`);
  },
  replayWebhookDlq: (id: string) =>
    api.post(`${base}/webhook-dead-letters/${encodeURIComponent(id)}/replay`),
  deleteWebhookDlq: (id: string) =>
    api.delete(`${base}/webhook-dead-letters/${encodeURIComponent(id)}`),

  // Advanced Replication
  getConsistencyCaps: (id: string) =>
    api.get(
      `${base}/replications/${encodeURIComponent(id)}/consistency-capabilities`
    ),
  setConsistencyLevel: (id: string, level: string) =>
    api.put(`${base}/replications/${encodeURIComponent(id)}/consistency-level`, {
      level,
    }),
  getHypervisorInfo: (id: string) =>
    api.get(`${base}/replications/${encodeURIComponent(id)}/hypervisor-info`),
  configureHypervisor: (id: string, body: Record<string, unknown>) =>
    api.put(`${base}/replications/${encodeURIComponent(id)}/hypervisor`, body),
  startContinuousCapture: (id: string) =>
    api.post(
      `${base}/replications/${encodeURIComponent(id)}/continuous-capture/start`
    ),
  stopContinuousCapture: (id: string) =>
    api.post(
      `${base}/replications/${encodeURIComponent(id)}/continuous-capture/stop`
    ),
  getJournal: (id: string, q: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q).map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(
      `${base}/replications/${encodeURIComponent(id)}/journal${qs ? `?${qs}` : ""}`
    );
  },
  getPitrRange: (id: string) =>
    api.get(`${base}/replications/${encodeURIComponent(id)}/pitr-range`),
  pitrRecover: (id: string, target_timestamp: string) =>
    api.post(`${base}/replications/${encodeURIComponent(id)}/pitr-recover`, {
      target_timestamp,
    }),
  getBlockCaps: (id: string) =>
    api.get(
      `${base}/replications/${encodeURIComponent(id)}/block-capabilities`
    ),
  setTransferMethod: (id: string, transfer_method: string) =>
    api.put(
      `${base}/replications/${encodeURIComponent(id)}/transfer-method`,
      { transfer_method }
    ),

  // ZFS
  getZfsCapabilities: (replId: string) =>
    api.get(`${base}/replications/${encodeURIComponent(replId)}/zfs/capabilities`),
  getZfsPoolStatus: (replId: string) =>
    api.get(`${base}/replications/${encodeURIComponent(replId)}/zfs/pool-status`),
  verifyZfsIntegrity: (replId: string) =>
    api.post(`${base}/replications/${encodeURIComponent(replId)}/zfs/verify-integrity`),
  // IG-2: `side` must be explicit — empty body used to silently default to
  // target, hiding the source pool from administration.
  triggerZfsScrub: (replId: string, side: "source" | "target" = "target") =>
    api.post(
      `${base}/replications/${encodeURIComponent(replId)}/zfs/trigger-scrub`,
      { side }
    ),
  getZfsEvents: (replId: string, q: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q).map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(
      `${base}/replications/${encodeURIComponent(replId)}/zfs/events${qs ? `?${qs}` : ""}`
    );
  },
  getZfsSnapshots: (replId: string, q: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q).map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(
      `${base}/replications/${encodeURIComponent(replId)}/zfs/snapshots${qs ? `?${qs}` : ""}`
    );
  },
  // Per-snapshot inspection / mutation endpoints.
  //
  // These hit UniCloud's AnyCloudFlow proxy which forwards to the upstream
  // ZFS controller. The `inspect` call is non-destructive (returns raw
  // `zfs get all` output); `promote-to-pitr` pins a sync snapshot beyond
  // normal retention so it can be used as a recovery anchor; `DELETE`
  // destroys the snapshot — gated behind admin + confirm dialog in the UI.
  inspectZfsSnapshot: (replId: string, snapshotName: string) =>
    api.get(
      `${base}/replications/${encodeURIComponent(replId)}/zfs/snapshots/${encodeURIComponent(snapshotName)}/inspect`
    ),
  promoteZfsSnapshot: (replId: string, snapshotName: string) =>
    api.post(
      `${base}/replications/${encodeURIComponent(replId)}/zfs/snapshots/${encodeURIComponent(snapshotName)}/promote-to-pitr`
    ),
  deleteZfsSnapshot: (replId: string, snapshotName: string) =>
    api.delete(
      `${base}/replications/${encodeURIComponent(replId)}/zfs/snapshots/${encodeURIComponent(snapshotName)}`
    ),
  detectZfsOnEndpoint: (endpointId: string) =>
    api.post(`${base}/vms/${encodeURIComponent(endpointId)}/zfs/detect`),
  listZfsDatasets: (endpointId: string) =>
    api.get(`${base}/vms/${encodeURIComponent(endpointId)}/zfs/datasets`),

  // Replication Pricing (tier-aware: rsync / zfs_native / zfs_raw).
  // Read-only — tenants see this in the replication wizard cost preview;
  // admins see it in the payout breakdown for commercial reconciliation.
  getReplicationPricing: (mode: "active_passive" | "bidirectional" = "active_passive") =>
    api.get(`${base}/pricing/replication?mode=${encodeURIComponent(mode)}`),

  // ── Bucket (Object Storage) Replication — Phase 1 MVP ─────────
  // Admin-only per BG-9; tenants see pricing only. Backend enforces
  // the same scope (AcF rejects non-S3 providers at preflight).

  listBucketEndpoints: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`${base}/bucket-endpoints${qs ? `?${qs}` : ""}`);
  },
  getBucketEndpoint: (id: string) =>
    api.get(`${base}/bucket-endpoints/${encodeURIComponent(id)}`),
  createBucketEndpoint: (body: {
    label: string;
    provider: "s3" | "minio";
    bucket_name: string;
    region?: string;
    endpoint_url?: string;
    access_key_id: string;
    secret_access_key: string;
    session_token?: string;
  }) => api.post(`${base}/bucket-endpoints`, body),
  updateBucketEndpoint: (id: string, body: Record<string, unknown>) =>
    api.put(`${base}/bucket-endpoints/${encodeURIComponent(id)}`, body),
  deleteBucketEndpoint: (id: string) =>
    api.delete(`${base}/bucket-endpoints/${encodeURIComponent(id)}`),
  validateBucketEndpoint: (id: string) =>
    api.post(`${base}/bucket-endpoints/${encodeURIComponent(id)}/validate`),
  // SEC-AUDIT-BUCKET-5 / HIGH-4: clear validation lockout after brute-force
  // mitigation fired. Admin-gated on the UniCloud proxy.
  unlockBucketEndpointValidation: (id: string) =>
    api.post(`${base}/bucket-endpoints/${encodeURIComponent(id)}/unlock-validation`),
  getBucketEndpointIamPolicy: (id: string, role: "source" | "target" = "source") =>
    api.get(
      `${base}/bucket-endpoints/${encodeURIComponent(id)}/iam-policy?role=${role}`
    ),
  runBucketEndpointPreflight: (id: string) =>
    api.post(`${base}/bucket-endpoints/${encodeURIComponent(id)}/preflight`),

  listBucketMigrations: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`${base}/bucket-migrations${qs ? `?${qs}` : ""}`);
  },
  getBucketMigration: (id: string) =>
    api.get(`${base}/bucket-migrations/${encodeURIComponent(id)}`),
  createBucketMigration: (body: {
    source_endpoint_identifier: string;
    target_endpoint_identifier: string;
    dry_run?: boolean;
    allow_overwrite?: boolean;
    delete_target_first?: boolean;
    confirm_target_bucket?: string;
  }) => api.post(`${base}/bucket-migrations`, body),
  startBucketMigration: (id: string) =>
    api.post(`${base}/bucket-migrations/${encodeURIComponent(id)}/start`),
  cancelBucketMigration: (id: string) =>
    api.post(`${base}/bucket-migrations/${encodeURIComponent(id)}/cancel`),
  pauseBucketMigration: (id: string) =>
    api.post(`${base}/bucket-migrations/${encodeURIComponent(id)}/pause`),
  resumeBucketMigration: (id: string) =>
    api.post(`${base}/bucket-migrations/${encodeURIComponent(id)}/resume`),
  getBucketMigrationProgress: (id: string) =>
    api.get(`${base}/bucket-migrations/${encodeURIComponent(id)}/progress`),
  getBucketMigrationFailures: (id: string, page = 1) =>
    api.get(
      `${base}/bucket-migrations/${encodeURIComponent(id)}/failures?page=${page}`
    ),
  getBucketMigrationManifest: (id: string) =>
    api.get(`${base}/bucket-migrations/${encodeURIComponent(id)}/manifest`),

  // Pricing (not admin-gated — used by tenant cost preview in wizard)
  getBucketMigrationPricing: (gb: number) =>
    api.get(`${base}/pricing/bucket-migration?gb=${Math.max(0, Math.floor(gb))}`),

  // ─── Phase 2 — Bucket Replication (active-passive continuous) ───
  //
  // Billing tier: bucket_active_passive at $8/bucket/month flat (EC-46:
  // per-calendar-month, no pause proration; EC-47: fan-out = N × $8).
  //
  // Edge-case error codes surfaced to errorTranslator.ts:
  //   - provider_native_crr_detected (EC-43)
  //   - target_bucket_missing (EC-44)
  //   - event_retention_exceeded (EC-35)
  //   - bandwidth_cap_too_low_for_part_size (EC-42)
  //   - egress_cap_reached (EC-40)
  //   - kms_region_mismatch (EC-41/71), kms_grant_missing (EC-72/75)
  //   - object_lock_target_not_enabled (EC-66)
  //   - object_lock_legal_hold_identity (EC-67)
  //   - object_lock_granularity_mismatch (EC-69)
  //   - max_object_size_exceeded (EC-50)
  //   - data_sovereignty_gate (EC-80)

  listBucketReplications: (query: { page?: number; per_page?: number; status?: string; source_endpoint_id?: string; target_endpoint_id?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      }, {})
    ).toString();
    return api.get(`${base}/bucket-replications${qs ? `?${qs}` : ""}`);
  },
  getBucketReplication: (id: string) =>
    api.get(`${base}/bucket-replications/${encodeURIComponent(id)}`),
  createBucketReplication: (body: {
    label: string;
    source_endpoint_id: string;
    target_endpoint_id: string;
    conflict_policy?: "reject_active_active" | "source_wins" | "target_wins" | "lww_hlc" | "manual_inbox";
    bandwidth_cap_mbps?: number;
    monthly_egress_cap_usd?: number;
    rpo_target_seconds?: number;
    change_feed_source?: "polling" | "eventbridge_sqs";
    change_feed_config?: Record<string, unknown>;
    acknowledge_legal_hold_identity_rewrite?: boolean;
    data_sovereignty_ack_signed_at?: string;
    acknowledge_crr_coexistence?: boolean;
    origin_tag_filter?: string;
    versioning_mode?: "disabled" | "best_effort" | "strict";
    object_lock_mode?: "disabled" | "governance" | "compliance";
    sse_kms_source_key_arn?: string;
    sse_kms_target_key_arn?: string;
    governance_bypass_policy?: "never_propagate" | "propagate_with_audit" | "propagate_only_if_target_governance";
  }) => api.post(`${base}/bucket-replications`, body),
  updateBucketReplication: (id: string, body: {
    label?: string;
    bandwidth_cap_mbps?: number;
    monthly_egress_cap_usd?: number;
    rpo_target_seconds?: number;
  }) => api.put(`${base}/bucket-replications/${encodeURIComponent(id)}`, body),
  deleteBucketReplication: (id: string) =>
    api.delete(`${base}/bucket-replications/${encodeURIComponent(id)}`),
  pauseBucketReplication: (id: string) =>
    api.post(`${base}/bucket-replications/${encodeURIComponent(id)}/pause`),
  resumeBucketReplication: (id: string) =>
    api.post(`${base}/bucket-replications/${encodeURIComponent(id)}/resume`),

  // EC-38 two-phase failover: fence → drain → promote
  initiateBucketReplicationFailover: (id: string) =>
    api.post(`${base}/bucket-replications/${encodeURIComponent(id)}/initiate-failover`),
  completeBucketReplicationDrain: (id: string, confirmTargetBucket: string) =>
    api.post(`${base}/bucket-replications/${encodeURIComponent(id)}/complete-drain`, {
      confirm_target_bucket: confirmTargetBucket,
    }),
  cancelBucketReplicationFailover: (id: string) =>
    api.post(`${base}/bucket-replications/${encodeURIComponent(id)}/cancel-failover`),

  // Health + diagnostics (tenant-accessible for dashboards)
  getBucketReplicationHealth: (id: string) =>
    api.get(`${base}/bucket-replications/${encodeURIComponent(id)}/health`),
  getBucketReplicationChangeFeed: (id: string, query: { page?: number; per_page?: number; status?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      }, {})
    ).toString();
    return api.get(`${base}/bucket-replications/${encodeURIComponent(id)}/change-feed${qs ? `?${qs}` : ""}`);
  },

  // Conflict inbox (EC-54/55/77). Returns empty when conflict_policy='reject_active_active'.
  listBucketReplicationConflicts: (id: string, page = 1) =>
    api.get(`${base}/bucket-replications/${encodeURIComponent(id)}/conflicts?page=${page}`),
  resolveBucketReplicationConflict: (id: string, conflictId: string, body: {
    resolution: "source_wins" | "target_wins" | "merged" | "ignored";
    note?: string;
  }) => api.post(
    `${base}/bucket-replications/${encodeURIComponent(id)}/conflicts/${encodeURIComponent(conflictId)}/resolve`,
    body
  ),

  // Force reconcile (EC-35 retention-gap recovery / EC-58 out-of-band write detection)
  reconcileBucketReplication: (id: string) =>
    api.post(`${base}/bucket-replications/${encodeURIComponent(id)}/reconcile`),

  // Phase 2 pricing (not admin-gated)
  getBucketReplicationPricing: () =>
    api.get(`${base}/pricing/bucket-replication-active-passive`),

  // Phase 3 provider capability matrix (not admin-gated — used by provider-picker)
  getBucketProviderCapabilities: () =>
    api.get(`${base}/bucket-providers/capabilities`),

  // ─── BG-15 Path B — Client access-grant management ────────────
  // Tenant admin curates which AcF bucket identifiers each of their
  // clients can read via the Path C client surface. Routes registered
  // in api/routes/tenant.php under tenant/v1/admin/anycloudflow/bucket/
  // client-access. Workspace.role:owner,admin gated server-side.
  listBucketClientAccessGrants: (query: { client_user_id?: number; resource_type?: string; per_page?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      }, {})
    ).toString();
    return api.get(`${base}/bucket/client-access${qs ? `?${qs}` : ""}`);
  },
  createBucketClientAccessGrant: (body: {
    client_user_id: number;
    resource_type: "endpoint" | "migration" | "replication";
    identifier: string;
    notes?: string;
  }) => api.post(`${base}/bucket/client-access`, body),
  revokeBucketClientAccessGrant: (id: number) =>
    api.delete(`${base}/bucket/client-access/${id}`),

  // ─── Path C — CLIENT-FACING BUCKET READ SURFACE ───────────────
  //
  // Hits `/api/v1/client/anycloudflow/bucket/*` which UniCloud's
  // BindAnyCloudFlowClientIdentity middleware forwards to AnyCloudFlow
  // with an `X-Acf-Client-Id` header automatically scoped to the
  // caller's own external_client_id. Strictly READ-ONLY — writes stay
  // tenant-only. Reuses the same method shape as the admin/tenant
  // calls above so consumers can swap the prefix without restructuring
  // their queries.

  listClientBucketEndpoints: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`/client/anycloudflow/bucket/endpoints${qs ? `?${qs}` : ""}`);
  },
  getClientBucketEndpoint: (id: string) =>
    api.get(`/client/anycloudflow/bucket/endpoints/${encodeURIComponent(id)}`),
  getClientBucketEndpointIamPolicy: (id: string, role: "source" | "target" = "source") =>
    api.get(
      `/client/anycloudflow/bucket/endpoints/${encodeURIComponent(id)}/iam-policy?role=${role}`
    ),

  listClientBucketMigrations: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`/client/anycloudflow/bucket/migrations${qs ? `?${qs}` : ""}`);
  },
  getClientBucketMigration: (id: string) =>
    api.get(`/client/anycloudflow/bucket/migrations/${encodeURIComponent(id)}`),
  getClientBucketMigrationProgress: (id: string) =>
    api.get(`/client/anycloudflow/bucket/migrations/${encodeURIComponent(id)}/progress`),
  getClientBucketMigrationFailures: (id: string, page = 1) =>
    api.get(
      `/client/anycloudflow/bucket/migrations/${encodeURIComponent(id)}/failures?page=${page}`
    ),
  getClientBucketMigrationManifest: (id: string) =>
    api.get(`/client/anycloudflow/bucket/migrations/${encodeURIComponent(id)}/manifest`),

  listClientBucketReplications: (q: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(q)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`/client/anycloudflow/bucket/replications${qs ? `?${qs}` : ""}`);
  },
  getClientBucketReplication: (id: string) =>
    api.get(`/client/anycloudflow/bucket/replications/${encodeURIComponent(id)}`),
  getClientBucketReplicationHealth: (id: string) =>
    api.get(`/client/anycloudflow/bucket/replications/${encodeURIComponent(id)}/health`),
  getClientBucketReplicationChangeFeed: (id: string, query: { page?: number; per_page?: number; status?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(query).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      }, {})
    ).toString();
    return api.get(`/client/anycloudflow/bucket/replications/${encodeURIComponent(id)}/change-feed${qs ? `?${qs}` : ""}`);
  },
  listClientBucketReplicationConflicts: (id: string, page = 1) =>
    api.get(`/client/anycloudflow/bucket/replications/${encodeURIComponent(id)}/conflicts?page=${page}`),

  // Capabilities + pricing — same payloads as admin surface, reachable
  // from the client surface with client scopes.
  getClientBucketProviderCapabilities: () =>
    api.get(`/client/anycloudflow/bucket/providers/capabilities`),
  getClientBucketMigrationPricing: (gb: number) =>
    api.get(`/client/anycloudflow/bucket/pricing/migration?gb=${Math.max(0, Math.floor(gb))}`),
  getClientBucketReplicationPricing: () =>
    api.get(`/client/anycloudflow/bucket/pricing/replication-active-passive`),
};

/**
 * Phase 2 bucket replication health metrics. `mode` of "catchup" means the
 * RPO alerting is SUPPRESSED (EC-39) — the UI should show a distinct badge.
 */
export interface BucketReplicationHealth {
  identifier: string;
  status: string;
  rpo_total_seconds: number | null;
  ingestion_lag_seconds: number | null;
  apply_lag_seconds: number | null;
  mode: "steady" | "catchup";
  queue_depth: number;
  bulk_queue_depth: number;
  interactive_queue_depth: number;
  egress_month_to_date_usd: number | null;
  egress_cap_usd: number | null;
  last_heartbeat_at: string | null;
  last_event_applied_at: string | null;
  rpo_target_seconds: number;
}

/**
 * Phase 3 provider capability row — drives the provider-picker capability
 * badges and frontend-side cross-provider preflight validation.
 */
export interface BucketProviderCapability {
  provider: string;
  supports_versioning: boolean;
  supports_object_lock: boolean;
  supports_kms_reencryption: boolean;
  max_object_size_bytes: number;
  metadata_case_sensitive: boolean;
  checksum_semantics: "etag_md5" | "etag_opaque_md5hash" | "etag_opaque_content_md5";
  storage_class_map: Record<string, string>;
  directory_marker_semantics: "zero_byte_slash_suffix" | "implicit_prefix" | "swift_pseudofolder";
  auth_model: "static_keys" | "service_account_json" | "sas_token" | "connection_string" | "keystone_v3";
  note: string | null;
}

export interface BucketProviderCapabilitiesResponse {
  data: BucketProviderCapability[];
  meta: {
    count: number;
    features: {
      active_active_enabled: boolean;
      cross_provider_enabled: boolean;
      object_lock_replication_enabled: boolean;
      sse_kms_reencryption_enabled: boolean;
    };
  };
}

/**
 * Rate-table shape returned by `/v1/pricing/replication`.
 *
 * Tiers:
 *  - rsync:       baseline per-VM/month (file-level sync, encryption in-flight)
 *  - zfs_native:  ZFS send/recv; delta-only replication, pool-level semantics
 *  - zfs_raw:     ZFS send --raw; encrypted datasets, no host re-keying
 *
 * Keep this type in lockstep with AnyCloudFlow's TransferMethod enum tiers.
 */
export interface ReplicationPricingResponse {
  mode: "active_passive" | "bidirectional";
  currency: string;
  rates: {
    rsync: { per_vm_month_cents: number };
    zfs_native: { per_vm_month_cents: number };
    zfs_raw: { per_vm_month_cents: number };
  };
}
