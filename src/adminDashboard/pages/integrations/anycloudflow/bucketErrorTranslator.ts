/**
 * Translate AnyCloudFlow bucket-subsystem structured error responses into
 * user-facing copy for UniCloud admin toasts. Centralizes the mapping so
 * every bucket page shows the same message for a given backend error_code.
 *
 * The mapping deliberately mirrors AcF's errorTranslator.ts — if AcF adds a
 * new code, we add it here too. Tests live alongside AcF's translator.
 *
 * Covers:
 *  - SEC-AUDIT-BUCKET-1 (SSRF) url_* codes
 *  - SEC-AUDIT-BUCKET-5 (validate rate limit / lockout)
 *  - Phase 2 edge-case codes (provider_native_crr_detected, egress_cap_reached,
 *    event_retention_exceeded, etc.)
 *  - Phase 3 preflight codes (kms_region_mismatch, object_lock_*, etc.)
 */

type ErrorLike =
  | {
      response?: {
        data?: {
          error_code?: string;
          message?: string;
        };
      };
      message?: string;
    }
  | null
  | undefined;

const BUCKET_ERROR_COPY: Record<string, string> = {
  // --- SEC-AUDIT-BUCKET-1 SSRF hardening ---
  url_invalid: "The URL could not be parsed. Use the full form: https://host.example.com",
  url_scheme_blocked: "Only HTTPS is allowed for custom bucket endpoints.",
  url_port_blocked: "That port isn't allowed. Use the standard HTTPS port (443).",
  url_host_blocked: "That hostname is a cloud-metadata or internal-infrastructure address and cannot be used as a bucket endpoint.",
  url_host_numeric_like: "Integer-encoded IPs aren't allowed. Use a dotted form (e.g., 192.0.2.1) or a DNS name.",
  url_private_ip_blocked: "That host resolves to a private/loopback/metadata IP and cannot be used as a bucket endpoint.",
  url_dns_resolution_failed: "DNS lookup failed — double-check the hostname.",
  url_credentials_in_url: "Embedded user:password@host credentials are not allowed in endpoint URLs.",

  // --- SEC-AUDIT-BUCKET-5 validate oracle ---
  endpoint_validation_rate_limited: "Too many validation attempts in a short window. Wait a minute before retrying.",
  endpoint_validation_locked_out: "This endpoint is locked after repeated validation failures. Rotate credentials and unlock to try again.",

  // --- Phase 2 replication edges ---
  provider_native_crr_detected: "The source bucket has AWS Cross-Region Replication enabled. Running our replication on top would loop — disable CRR or add a tag filter.",
  target_bucket_missing: "Target bucket has been deleted or is no longer accessible.",
  event_retention_exceeded: "Replication was paused longer than the change-feed retention window. A full reconcile is required.",
  bandwidth_cap_too_low_for_part_size: "Bandwidth cap is too low for multipart part size. Use ≥ 128 Mbps.",
  egress_cap_reached: "Monthly egress cap reached — replication auto-paused. Raise the cap or wait for next billing cycle.",

  // --- Phase 3 preflight rejections ---
  kms_region_mismatch: "Source bucket uses SSE-KMS but no accessible target-region KMS key was supplied.",
  kms_grant_missing: "Target KMS key does not grant Encrypt permission to the replication service principal.",
  max_object_size_exceeded: "Source contains objects exceeding the target provider's max object size.",
  object_lock_target_not_enabled: "Source has Object Lock but target bucket was not created with Object Lock enabled. A new target bucket is required.",
  object_lock_legal_hold_identity: "Source objects have active legal holds — replicating would rewrite the placer identity. Explicit ack required.",
  object_lock_granularity_mismatch: "Source has per-object Object Lock but target provider supports only container-level retention.",
  data_sovereignty_gate: "Cross-jurisdiction replication requires a signed DPA acknowledgment.",

  // --- Phase 2/3 feature flags ---
  feature_flag_active_active_disabled: "Active-active conflict policies require the active_active_enabled feature flag, which is currently off.",
  feature_flag_cross_provider_disabled: "Cross-provider replication requires the cross_provider_enabled feature flag, which is currently off.",
  feature_flag_object_lock_replication_disabled: "Object Lock replication requires the object_lock_replication_enabled feature flag.",
  feature_flag_sse_kms_reencryption_disabled: "SSE-KMS cross-region re-encryption requires the sse_kms_reencryption_enabled feature flag.",

  // --- Provider not implemented (Phase 3 stubs) ---
  provider_not_implemented: "The selected provider's adapter is scaffolded but not yet implemented. See docs/code-audit/09-bucket-replication/implementation-plan.md §Phase 3.",

  // --- Active-active refused (default policy) ---
  active_active_conflict_refused: "A concurrent-write conflict was detected; the conflict policy rejects these by default. Enable a resolution policy + chaos-testing sign-off to permit.",
};

/**
 * Translate a thrown error (from useMutation onError, axios, fetch) into a
 * user-facing toast string. Prefers the structured `error_code` mapping,
 * falls back to the raw backend message, then to a caller-provided default.
 *
 * Laravel FormRequest validation errors surface as a nested structure that
 * embeds our error_code into the validation message (see SafePublicUrl rule).
 * This helper parses that pattern too.
 */
export function translateBucketError(err: ErrorLike, fallback: string): string {
  const code = err?.response?.data?.error_code;
  const msg = err?.response?.data?.message;

  if (code && BUCKET_ERROR_COPY[code]) {
    return BUCKET_ERROR_COPY[code];
  }

  // Laravel validation errors: message looks like "The endpoint url field
  // has errors (url_private_ip_blocked: Host resolves to a private IP)."
  // — extract the first parenthesized error code.
  if (msg) {
    const embeddedCode = extractEmbeddedCode(msg);
    if (embeddedCode && BUCKET_ERROR_COPY[embeddedCode]) {
      return BUCKET_ERROR_COPY[embeddedCode];
    }
  }

  return msg || fallback;
}

function extractEmbeddedCode(message: string): string | null {
  const match = /(url_[a-z_]+|endpoint_validation_[a-z_]+|provider_native_crr_detected|target_bucket_missing|event_retention_exceeded|bandwidth_cap_too_low_for_part_size|egress_cap_reached|kms_[a-z_]+|max_object_size_exceeded|object_lock_[a-z_]+|data_sovereignty_gate|feature_flag_[a-z_]+|provider_not_implemented|active_active_conflict_refused)/i.exec(message);
  return match ? match[1].toLowerCase() : null;
}

export const BUCKET_ERROR_CODES = Object.keys(BUCKET_ERROR_COPY);
