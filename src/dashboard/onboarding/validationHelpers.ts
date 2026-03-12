import { ensureBusinessProfileDefaults } from "./BusinessProfileForm";
import { ensureBrandingThemeDefaults } from "./BrandingThemeForm";
import { getFrontendVisibleProvidersWithCapability } from "@/config/providers";
import type { StatusMeta } from "@/types/onboarding";

export type FormValues = Record<string, unknown>;
export type SubmitAction = "save" | "submit" | "resubmit";

export const statusCopy: Record<string, StatusMeta> = {
  draft: { label: "Draft", tone: "bg-slate-100 text-slate-700" },
  submitted: { label: "Submitted", tone: "bg-blue-100 text-blue-700" },
  in_review: { label: "In review", tone: "bg-blue-100 text-blue-700" },
  changes_requested: { label: "Changes requested", tone: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", tone: "bg-rose-100 text-rose-700" },
};

export const defaultStatusMeta: StatusMeta = {
  label: "Draft",
  tone: "bg-slate-100 text-slate-700",
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
};

export const isBlank = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null || `${value}`.trim() === "";
};

export const isValidEmail = (value: unknown) =>
  typeof value === "string" && /\S+@\S+\.\S+/.test(value.trim());

export const isValidUrl = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch (_error) {
    return false;
  }
};

export const validatePartnerRegionPayload = (payload: unknown): string[] => {
  const missing: string[] = [];

  if (!isRecord(payload)) {
    missing.push("Tell us if you operate a region");
    return missing;
  }

  if (payload.has_datacenter_node === null || payload.has_datacenter_node === undefined) {
    missing.push("Tell us if you operate a region");
    return missing;
  }

  if (payload.has_datacenter_node === false) {
    return missing;
  }

  const region = isRecord(payload.region) ? payload.region : {};

  const requiredRegionFields: Array<[string, string]> = [
    ["provider", "Cloud provider"],
    ["code", "Region code"],
    ["country_code", "Country ISO"],
    ["fulfillment_mode", "Fulfilment mode"],
  ];

  requiredRegionFields.forEach(([key, label]) => {
    if (isBlank(region[key] ?? "")) {
      missing.push(label);
    }
  });

  const provider = typeof region.provider === "string" ? region.provider.toLowerCase() : "";
  const fulfillmentMode =
    typeof region.fulfillment_mode === "string" ? region.fulfillment_mode : "";

  const automatedProviders = getFrontendVisibleProvidersWithCapability("compute").map(
    ({ key }) => key
  );

  if (provider && !automatedProviders.includes(provider) && fulfillmentMode === "automated") {
    missing.push("Automated fulfilment is not yet available for this provider");
  }

  if (!automatedProviders.includes(provider)) {
    return [...new Set(missing)];
  }

  if (fulfillmentMode && !["manual", "automated"].includes(fulfillmentMode)) {
    missing.push("Choose a fulfilment mode");
  }

  if (fulfillmentMode === "automated") {
    const credentials = isRecord(region.msp_credentials) ? region.msp_credentials : {};

    // Different providers require different credential fields
    const requiredCredentialFields: Array<[string, string]> =
      provider === "nobus"
        ? [
            ["base_url", "MSP base URL"],
            ["email", "MSP email"],
            ["password", "MSP password"],
          ]
        : [
            ["base_url", "MSP base URL"],
            ["username", "MSP username"],
            ["password", "MSP password"],
            ["domain", "MSP domain"],
          ];

    requiredCredentialFields.forEach(([key, label]) => {
      if (isBlank(credentials[key] ?? "")) {
        missing.push(label);
      }
    });

    if (!isValidUrl(credentials.base_url ?? "")) {
      missing.push("MSP base URL (valid URL)");
    }

    const objectStorage = isRecord(credentials.object_storage) ? credentials.object_storage : {};
    if (objectStorage.enabled === true) {
      if (isBlank(objectStorage.base_url ?? "")) {
        missing.push("Object storage base URL");
      } else if (!isValidUrl(objectStorage.base_url)) {
        missing.push("Object storage base URL (valid URL)");
      }
    }
  }

  return [...new Set(missing)];
};

export const normalisePartnerRegionFormValues = (payload: unknown): Record<string, unknown> => {
  if (!isRecord(payload)) {
    return { has_datacenter_node: null };
  }

  if (payload.has_datacenter_node === false) {
    return { has_datacenter_node: false };
  }

  const region = isRecord(payload.region) ? payload.region : {};
  const meta = isRecord(region.meta) ? region.meta : {};
  const credentials = isRecord(region.msp_credentials) ? region.msp_credentials : {};
  const objectStorage = isRecord(credentials.object_storage) ? credentials.object_storage : {};

  return {
    has_datacenter_node:
      typeof payload.has_datacenter_node === "boolean" ? payload.has_datacenter_node : null,
    region: {
      ...region,
      provider: typeof region.provider === "string" ? region.provider.toLowerCase() : "",
      meta,
      msp_credentials: {
        ...credentials,
        object_storage: objectStorage,
      },
    },
  };
};

export const validateBusinessProfilePayload = (payload: unknown): string[] => {
  const data = ensureBusinessProfileDefaults(payload);
  const missing: string[] = [];

  if (isBlank(data.company_name)) missing.push("Company name");
  if (isBlank(data.registration_number)) missing.push("Incorporation number");
  if (isBlank(data.company_type)) missing.push("Business type");
  if (isBlank(data.business_model)) missing.push("Business model");
  if (isBlank(data.date_of_incorporation)) missing.push("Date of incorporation");
  if (isBlank(data.industry)) missing.push("Industry");
  if (isBlank(data.website) || !isValidUrl(data.website))
    missing.push("Company website (valid URL)");
  if (isBlank(data.address)) missing.push("Business address");
  if (isBlank(data.country) || isBlank(data.country_id)) missing.push("Country");
  if (isBlank(data.state) || isBlank(data.state_id)) missing.push("State / Region");
  if (isBlank(data.city)) missing.push("City");
  if (isBlank(data.support_contact_name)) missing.push("Support contact name");

  if (!isValidEmail(data.support_contact_email ?? "")) {
    missing.push("Support contact email (valid)");
  }

  if (isBlank(data.support_contact_phone)) {
    missing.push("Support contact phone");
  }

  if (!isValidEmail(data.support_email ?? "")) {
    missing.push("Generic support email (valid)");
  }

  const optionalUrlFields: Array<[string, string]> = [
    ["privacy_policy_url", "Privacy policy URL"],
    ["help_center_url", "Help centre URL"],
    ["unsubscription_url", "Email unsubscription URL"],
    ["logo_href", "Logo target URL"],
  ];

  optionalUrlFields.forEach(([key, label]) => {
    const value = data[key];
    if (!isBlank(value) && !isValidUrl(value)) {
      missing.push(`${label} (valid URL)`);
    }
  });

  return [...new Set(missing)];
};

export const validateBrandingPayload = (payload: unknown): string[] => {
  const data = ensureBrandingThemeDefaults(payload);
  const missing: string[] = [];

  if (isBlank(data.logo)) {
    missing.push("Company logo");
  }

  if (isBlank(data.privacy_policy_url) || !isValidUrl(data.privacy_policy_url)) {
    missing.push("Privacy policy URL (valid)");
  }

  const brandingOptionalUrlFields: Array<[string, string]> = [
    ["help_center_url", "Help centre URL"],
    ["unsubscription_url", "Email unsubscription URL"],
    ["logo_href", "Logo target URL"],
  ];

  brandingOptionalUrlFields.forEach(([key, label]) => {
    const value = data[key];
    if (!isBlank(value) && !isValidUrl(value)) {
      missing.push(`${label} (valid URL)`);
    }
  });

  return [...new Set(missing)];
};
