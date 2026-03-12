import type { StatusTone } from "@/shared/components/ui/StatusPill";
import { STATUS_TONES } from "@/shared/constants/onboarding";
import type { PersonaOption } from "./onboardingReviewTypes";

// --- Constants ---

export const ADMIN_PERSONA_OPTIONS: PersonaOption[] = [
  {
    value: "tenant_business",
    label: "Tenant / Partner (Business)",
    description: "Primary tenant onboarding including partner qualification.",
    target: "tenant",
    subjectType: "tenant",
  },
  {
    value: "tenant_client_business",
    label: "Tenant Client (Business)",
    description: "Business clients onboarded under a tenant.",
    target: "client",
    subjectType: "client",
  },
  {
    value: "tenant_client_individual",
    label: "Tenant Client (Individual)",
    description: "Individual accounts registered under a tenant.",
    target: "client",
    subjectType: "client",
  },
  {
    value: "internal_client_business",
    label: "Internal CRM Account",
    description: "Direct CRM-managed customers without a tenant.",
    target: "client",
    subjectType: "client",
  },
];

export const DEFAULT_QUERY_ARGS = {
  target: "tenant",
  tenantId: null,
  userId: null,
  step: null,
};

// --- Helper Functions ---

export const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "\u2014";

export const flattenPayload = (
  payload: Record<string, unknown>,
  prefix = ""
): [string, unknown][] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  return Object.entries(payload).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value) && !("document_id" in value)) {
      return flattenPayload(value as Record<string, unknown>, path);
    }

    return [[path, value]];
  });
};

export const resolveStatusTone = (
  status: string | undefined,
  fallback: StatusTone = "neutral"
): StatusTone => {
  const tone = status ? STATUS_TONES[status] : undefined;
  if (
    tone === "success" ||
    tone === "warning" ||
    tone === "danger" ||
    tone === "info" ||
    tone === "neutral"
  ) {
    return tone;
  }
  return fallback;
};

export const formatBoolean = (value: boolean | string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "\u2014";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const normalized = value.toString().trim().toLowerCase();
  if (["yes", "y", "true"].includes(normalized)) {
    return "Yes";
  }
  if (["no", "n", "false"].includes(normalized)) {
    return "No";
  }

  return value;
};
