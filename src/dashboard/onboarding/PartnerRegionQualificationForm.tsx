import React, { useMemo, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import ToastUtils from "@/utils/toastUtil";
import { useVerifyPartnerRegionQualification } from "@/hooks/onboardingHooks";
import { useTenantBrandingTheme } from "@/hooks/useBrandingTheme";
import { getFrontendVisibleProvidersWithCapability } from "@/config/providers";
import type { OnboardingOption } from "@/types/onboarding";

const PROVIDER_OPTIONS: OnboardingOption[] = [
  ...getFrontendVisibleProvidersWithCapability("compute").map(({ key, config }) => ({
    value: key,
    label: config.label.replace(/\s*\(.+\)\s*$/, ""),
  })),
  { value: "aws", label: "AWS (coming soon)" },
  { value: "azure", label: "Azure (coming soon)" },
  { value: "openstack", label: "OpenStack (coming soon)" },
];

/** Providers that support automated provisioning and credential verification */
const AUTOMATED_PROVIDERS = new Set<string>(
  getFrontendVisibleProvidersWithCapability("compute").map(({ key }) => key)
);

interface ObjectStorageCredentials {
  enabled: boolean;
  base_url: string;
  account: string;
  access_key: string;
  default_quota_gb: string;
  notification_email: string;
}

interface MspCredentials {
  base_url: string;
  username: string;
  password: string;
  domain: string;
  domain_id: string;
  default_project: string;
  object_storage: ObjectStorageCredentials;
}

interface RegionMeta {
  crm_sync: boolean;
  crm_auto_onboard: boolean;
  pricing_profile: string;
  support_lead_email: string;
}

interface PartnerRegionData {
  provider: string;
  code: string;
  name: string;
  country_code: string;
  city: string;
  fulfillment_mode: "manual" | "automated" | string;
  features: Record<string, unknown>;
  meta: RegionMeta;
  msp_credentials: MspCredentials;
}

export interface PartnerRegionPayload extends Record<string, unknown> {
  has_datacenter_node: boolean | null;
  region: PartnerRegionData;
}

const DEFAULT_PAYLOAD: PartnerRegionPayload = {
  has_datacenter_node: null,
  region: {
    provider: "",
    code: "",
    name: "",
    country_code: "",
    city: "",
    fulfillment_mode: "manual",
    features: {},
    meta: {
      crm_sync: true,
      crm_auto_onboard: true,
      pricing_profile: "",
      support_lead_email: "",
    },
    msp_credentials: {
      base_url: "",
      username: "",
      password: "",
      domain: "",
      domain_id: "",
      default_project: "",
      object_storage: {
        enabled: false,
        base_url: "",
        account: "",
        access_key: "",
        default_quota_gb: "",
        notification_email: "",
      },
    },
  },
};

const clone = <T,>(value: T): T => structuredClone(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
};

const ensureMetaDefaults = (meta: unknown): RegionMeta => {
  if (!isRecord(meta)) return clone(DEFAULT_PAYLOAD.region.meta);
  return {
    ...DEFAULT_PAYLOAD.region.meta,
    crm_sync:
      typeof meta.crm_sync === "boolean" ? meta.crm_sync : DEFAULT_PAYLOAD.region.meta.crm_sync,
    crm_auto_onboard:
      typeof meta.crm_auto_onboard === "boolean"
        ? meta.crm_auto_onboard
        : DEFAULT_PAYLOAD.region.meta.crm_auto_onboard,
    pricing_profile: typeof meta.pricing_profile === "string" ? meta.pricing_profile : "",
    support_lead_email: typeof meta.support_lead_email === "string" ? meta.support_lead_email : "",
  };
};

const ensureObjectStorageDefaults = (os: unknown): ObjectStorageCredentials => {
  if (!isRecord(os)) return clone(DEFAULT_PAYLOAD.region.msp_credentials.object_storage);
  return {
    ...DEFAULT_PAYLOAD.region.msp_credentials.object_storage,
    enabled: typeof os.enabled === "boolean" ? os.enabled : false,
    base_url: typeof os.base_url === "string" ? os.base_url : "",
    account: typeof os.account === "string" ? os.account : "",
    access_key: typeof os.access_key === "string" ? os.access_key : "",
    default_quota_gb: typeof os.default_quota_gb === "string" ? os.default_quota_gb : "",
    notification_email: typeof os.notification_email === "string" ? os.notification_email : "",
  };
};

const ensureMspDefaults = (msp: unknown): MspCredentials => {
  if (!isRecord(msp)) return clone(DEFAULT_PAYLOAD.region.msp_credentials);
  return {
    ...DEFAULT_PAYLOAD.region.msp_credentials,
    base_url: typeof msp.base_url === "string" ? msp.base_url : "",
    username: typeof msp.username === "string" ? msp.username : "",
    password: typeof msp.password === "string" ? msp.password : "",
    domain: typeof msp.domain === "string" ? msp.domain : "",
    domain_id: typeof msp.domain_id === "string" ? msp.domain_id : "",
    default_project: typeof msp.default_project === "string" ? msp.default_project : "",
    object_storage: ensureObjectStorageDefaults(msp.object_storage),
  };
};

const ensureDefaults = (value: unknown): PartnerRegionPayload => {
  if (!isRecord(value)) {
    return clone(DEFAULT_PAYLOAD);
  }

  const merged = clone(DEFAULT_PAYLOAD);

  merged.has_datacenter_node =
    typeof value.has_datacenter_node === "boolean" ? value.has_datacenter_node : null;

  if (isRecord(value.region)) {
    const region = value.region;

    if (typeof region.provider === "string") {
      merged.region.provider = region.provider.toLowerCase();
    }
    if (typeof region.code === "string") {
      merged.region.code = region.code;
    }
    if (typeof region.name === "string") {
      merged.region.name = region.name;
    }
    if (typeof region.country_code === "string") {
      merged.region.country_code = region.country_code;
    }
    if (typeof region.city === "string") {
      merged.region.city = region.city;
    }
    if (typeof region.fulfillment_mode === "string") {
      merged.region.fulfillment_mode = region.fulfillment_mode;
    }
    if (isRecord(region.features)) {
      merged.region.features = region.features;
    }

    merged.region.meta = ensureMetaDefaults(region.meta);
    merged.region.msp_credentials = ensureMspDefaults(region.msp_credentials);
  }

  return merged;
};

const setNestedValue = (
  object: Record<string, unknown>,
  path: string | string[],
  value: unknown
) => {
  const keys = Array.isArray(path) ? path : path.split(".");
  const finalKey = keys.at(-1);
  if (finalKey === undefined) return;
  let cursor: Record<string, unknown> = object;

  keys.slice(0, -1).forEach((key) => {
    const currentValue = cursor[key];

    if (!isRecord(currentValue)) {
      cursor[key] = {};
    }

    cursor = cursor[key] as Record<string, unknown>;
  });

  cursor[finalKey] = value;
};

interface PartnerRegionQualificationFormProps {
  value: Record<string, unknown> | null | undefined;
  meta?: Record<string, unknown>;
  onChange: Dispatch<SetStateAction<unknown>>;
}

const PartnerRegionQualificationForm = ({
  value,
  meta,
  onChange,
}: PartnerRegionQualificationFormProps) => {
  const { data: branding } = useTenantBrandingTheme();
  const brandName = branding?.company?.name || "the platform";
  const payload = useMemo(() => ensureDefaults(value), [value]);
  const verificationMutation = useVerifyPartnerRegionQualification();
  const providerOptions = useMemo(() => {
    if (
      !payload.region.provider ||
      PROVIDER_OPTIONS.some((option) => option.value === payload.region.provider)
    ) {
      return PROVIDER_OPTIONS;
    }

    return [
      {
        value: payload.region.provider,
        label:
          payload.region.provider === "nobus"
            ? "Nobus Cloud (legacy)"
            : `${payload.region.provider.toUpperCase()} (legacy)`,
      },
      ...PROVIDER_OPTIONS,
    ];
  }, [payload.region.provider]);

  const updateValue = (path: string | string[], nextValue: unknown) => {
    onChange((previous) => {
      const base = ensureDefaults(previous);
      const updated = clone(base) as Record<string, unknown>;
      setNestedValue(updated, path, nextValue);

      if (path === "has_datacenter_node" && nextValue === false) {
        setNestedValue(updated, "region", clone(DEFAULT_PAYLOAD.region));
      }

      if (path === "region.fulfillment_mode" && nextValue !== "automated") {
        setNestedValue(
          updated,
          "region.msp_credentials",
          clone(DEFAULT_PAYLOAD.region.msp_credentials)
        );
      }

      if (path === "region.msp_credentials.object_storage.enabled" && !nextValue) {
        setNestedValue(
          updated,
          "region.msp_credentials.object_storage",
          clone(DEFAULT_PAYLOAD.region.msp_credentials.object_storage)
        );
      }

      return updated;
    });
  };

  const handleProviderChange = (providerValue: string) => {
    onChange((previous) => {
      const base = ensureDefaults(previous);
      const updated = clone(base) as Record<string, unknown>;
      const normalized = providerValue.toLowerCase();
      setNestedValue(updated, "region.provider", normalized);

      if (!AUTOMATED_PROVIDERS.has(normalized)) {
        setNestedValue(updated, "region.fulfillment_mode", "manual");
        setNestedValue(
          updated,
          "region.msp_credentials",
          clone(DEFAULT_PAYLOAD.region.msp_credentials)
        );
      }

      return updated;
    });
  };

  const handleVerifyCredentials = async () => {
    if (!AUTOMATED_PROVIDERS.has(payload.region.provider)) {
      ToastUtils.error("Credential verification is not yet available for this provider.");
      return;
    }

    try {
      const response = await verificationMutation.mutateAsync({
        payload,
      });

      const responseRecord = isRecord(response) ? response : {};
      const dataRecord = isRecord(responseRecord.data) ? responseRecord.data : {};
      const submissionRecord = isRecord(dataRecord.submission) ? dataRecord.submission : {};
      const nextPayload = isRecord(submissionRecord.payload) ? submissionRecord.payload : payload;
      const successMessage =
        typeof responseRecord.message === "string"
          ? responseRecord.message
          : "Credentials verified successfully.";

      onChange(() => ensureDefaults(nextPayload));
      ToastUtils.success(successMessage);
    } catch (error) {
      ToastUtils.error(getErrorMessage(error, "Unable to verify MSP credentials."));
    }
  };

  const hasNode = payload.has_datacenter_node === true;
  const submissionMeta = isRecord(meta) ? meta : {};
  const isVerified = submissionMeta.msp_verified === true;
  const verificationStatus = isVerified ? "verified" : "pending";
  const verificationMessage = useMemo(() => {
    if (isVerified) return "Credentials verified and pending region approval.";
    return "Verify credentials so we can automate provisioning.";
  }, [isVerified]);

  const statusBarMetaUpdatedAt =
    typeof submissionMeta.msp_verified_at === "string" ? submissionMeta.msp_verified_at : undefined;

  const canAttemptVerification =
    hasNode &&
    AUTOMATED_PROVIDERS.has(payload.region.provider) &&
    payload.region.fulfillment_mode === "automated" &&
    payload.region.msp_credentials.base_url &&
    payload.region.msp_credentials.password &&
    (payload.region.provider === "nobus"
      ? Boolean(
          payload.region.msp_credentials.username ||
            (payload.region.msp_credentials as { email?: string }).email
        )
      : Boolean(payload.region.msp_credentials.username && payload.region.msp_credentials.domain));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label htmlFor="operate-node" className="block text-sm font-medium text-gray-700 mb-2">
            Do you operate a partner-owned region or data centre node?
          </label>
          <div id="operate-node" className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateValue("has_datacenter_node", true)}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                hasNode
                  ? "border-[--theme-color] bg-[--theme-color-10] text-[--theme-color]"
                  : "border-gray-300 hover:border-[--theme-color]"
              }`}
            >
              Yes, we operate a node
            </button>
            <button
              type="button"
              onClick={() => updateValue("has_datacenter_node", false)}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                payload.has_datacenter_node === false
                  ? "border-[--theme-color] bg-[--theme-color-10] text-[--theme-color]"
                  : "border-gray-300 hover:border-[--theme-color]"
              }`}
            >
              No, we resell {brandName} regions
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selecting “No” keeps your onboarding optional. Select “Yes” to request your region for
            approval.
          </p>
        </div>
      </div>

      {hasNode ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="cloud-provider"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cloud provider <span className="text-red-500">*</span>
              </label>
              <select
                id="cloud-provider"
                value={payload.region.provider}
                onChange={(event) => handleProviderChange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3 bg-white"
              >
                <option value="">Select a provider</option>
                {providerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {payload.region.provider && !AUTOMATED_PROVIDERS.has(payload.region.provider) && (
                <p className="text-xs text-amber-600 mt-2">
                  Automated onboarding for {payload.region.provider.toUpperCase()} is coming soon.
                  We will request MSP credentials once the integration is available.
                </p>
              )}
            </div>
            <Field
              label="Region code"
              value={payload.region.code}
              onChange={(event) => updateValue("region.code", event.target.value)}
              placeholder="e.g. nigeria-1"
              required
            />
            <Field
              label="Display name"
              value={payload.region.name}
              onChange={(event) => updateValue("region.name", event.target.value)}
              placeholder="e.g. Nigeria"
            />
            <Field
              label="Country ISO"
              value={payload.region.country_code}
              onChange={(event) =>
                updateValue("region.country_code", event.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="e.g. NG"
              required
            />
            <Field
              label="City"
              value={payload.region.city}
              onChange={(event) => updateValue("region.city", event.target.value)}
              placeholder="e.g. Lagos"
            />
            <div>
              <label
                htmlFor="fulfillment-mode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fulfilment mode <span className="text-red-500">*</span>
              </label>
              <select
                id="fulfillment-mode"
                value={payload.region.fulfillment_mode}
                onChange={(event) =>
                  updateValue("region.fulfillment_mode", event.target.value || "manual")
                }
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
              >
                <option value="manual">Manual – we will manage provisioning</option>
                <option value="automated">
                  Automated – we want {brandName} automation to provision
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CRM automation</label>
              <div className="flex items-center gap-3 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payload.region.meta.crm_sync}
                    onChange={(event) => updateValue("region.meta.crm_sync", event.target.checked)}
                    className="rounded border-gray-300 text-[--theme-color] focus:ring-[--theme-color]"
                  />
                  Sync leads to {brandName} CRM
                </label>
              </div>
              <div className="flex items-center gap-3 text-sm mt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payload.region.meta.crm_auto_onboard}
                    onChange={(event) =>
                      updateValue("region.meta.crm_auto_onboard", event.target.checked)
                    }
                    className="rounded border-gray-300 text-[--theme-color] focus:ring-[--theme-color]"
                  />
                  Auto-onboard verified accounts
                </label>
              </div>
            </div>

            <Field
              label="CRM pricing profile"
              value={payload.region.meta.pricing_profile}
              onChange={(event) => updateValue("region.meta.pricing_profile", event.target.value)}
              placeholder="Optional pricing profile identifier"
            />

            <Field
              label="Support / operations email"
              value={payload.region.meta.support_lead_email}
              onChange={(event) =>
                updateValue("region.meta.support_lead_email", event.target.value)
              }
              placeholder="ops@partner.io"
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-5 space-y-4">
            {AUTOMATED_PROVIDERS.has(payload.region.provider) ? (
              payload.region.fulfillment_mode === "automated" ? (
                <>
                  <MspCredentialsSection
                    payload={payload}
                    onUpdate={updateValue}
                    onVerify={handleVerifyCredentials}
                    isVerifying={verificationMutation.isPending}
                    canVerify={canAttemptVerification}
                  />

                  <ObjectStorageSection payload={payload} onUpdate={updateValue} />

                  <VerificationStatus
                    status={verificationStatus}
                    message={verificationMessage}
                    updatedAt={statusBarMetaUpdatedAt}
                  />
                </>
              ) : (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">Manual fulfilment selected</p>
                  <p className="mt-1">
                    You can manage provisioning in your own consoles. Credentials are optional
                    unless you switch to automated fulfilment later.
                  </p>
                </div>
              )
            ) : (
              <div className="text-sm text-gray-600">
                Automated provisioning for {payload.region.provider || "this provider"} is coming
                soon. We will ask for the specific credentials once the integration is live.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Let us know whenever you operate a region, and we’ll help with approval and automated
          provisioning.
        </div>
      )}
    </div>
  );
};

interface MspCredentialsSectionProps {
  payload: PartnerRegionPayload;
  onUpdate: (path: string, value: unknown) => void;
  onVerify: () => void;
  isVerifying: boolean;
  canVerify: boolean;
}

const MspCredentialsSection = ({
  payload,
  onUpdate,
  onVerify,
  isVerifying,
  canVerify,
}: MspCredentialsSectionProps) => (
  <>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-base font-semibold text-gray-800">MSP credentials (platform admin)</p>
        <p className="text-sm text-gray-500">
          We keep these encrypted. Required for automated fulfilment.
        </p>
      </div>
      <button
        type="button"
        onClick={onVerify}
        disabled={!canVerify || isVerifying}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[--theme-color] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            Verify credentials
          </>
        )}
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field
        label="MSP base URL"
        value={payload.region.msp_credentials.base_url}
        onChange={(event) => onUpdate("region.msp_credentials.base_url", event.target.value)}
        placeholder="https://compute.partner.example"
        required
      />
      <Field
        label="Domain"
        value={payload.region.msp_credentials.domain}
        onChange={(event) => onUpdate("region.msp_credentials.domain", event.target.value)}
        required
      />
      <Field
        label="Username"
        value={payload.region.msp_credentials.username}
        onChange={(event) => onUpdate("region.msp_credentials.username", event.target.value)}
        required
      />
      <Field
        label="Password"
        type="password"
        value={payload.region.msp_credentials.password}
        onChange={(event) => onUpdate("region.msp_credentials.password", event.target.value)}
        required
      />
      <Field
        label="Domain ID"
        value={payload.region.msp_credentials.domain_id}
        onChange={(event) => onUpdate("region.msp_credentials.domain_id", event.target.value)}
      />
      <Field
        label="Default project"
        value={payload.region.msp_credentials.default_project}
        onChange={(event) => onUpdate("region.msp_credentials.default_project", event.target.value)}
      />
    </div>
  </>
);

interface ObjectStorageSectionProps {
  payload: PartnerRegionPayload;
  onUpdate: (path: string, value: unknown) => void;
}

const ObjectStorageSection = ({ payload, onUpdate }: ObjectStorageSectionProps) => {
  const isEnabled = payload.region.msp_credentials.object_storage.enabled;

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Object storage automation (optional)
          </p>
          <p className="text-xs text-gray-500">
            Provide access keys if you want us to manage silos and quotas.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) =>
              onUpdate("region.msp_credentials.object_storage.enabled", event.target.checked)
            }
            className="rounded border-gray-300 text-[--theme-color] focus:ring-[--theme-color]"
          />
          Enable automation
        </label>
      </div>

      {isEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Object storage base URL"
            value={payload.region.msp_credentials.object_storage.base_url}
            onChange={(event) =>
              onUpdate("region.msp_credentials.object_storage.base_url", event.target.value)
            }
            placeholder="https://object.partner.example"
          />
          <Field
            label="Service account / tenant"
            value={payload.region.msp_credentials.object_storage.account}
            onChange={(event) =>
              onUpdate("region.msp_credentials.object_storage.account", event.target.value)
            }
          />
          <Field
            label="Access key"
            value={payload.region.msp_credentials.object_storage.access_key}
            onChange={(event) =>
              onUpdate("region.msp_credentials.object_storage.access_key", event.target.value)
            }
          />
          <Field
            label="Default quota (GB)"
            value={payload.region.msp_credentials.object_storage.default_quota_gb}
            onChange={(event) =>
              onUpdate(
                "region.msp_credentials.object_storage.default_quota_gb",
                event.target.value.replaceAll(/[^\d]/g, "")
              )
            }
            placeholder="500"
          />
          <Field
            label="Notification email"
            value={payload.region.msp_credentials.object_storage.notification_email}
            onChange={(event) =>
              onUpdate(
                "region.msp_credentials.object_storage.notification_email",
                event.target.value
              )
            }
            placeholder="alerts@partner.io"
          />
        </div>
      )}
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: FieldProps) => {
  const id = useMemo(() => `field-${label.toLowerCase().replaceAll(/\s+/g, "-")}`, [label]);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
      />
    </div>
  );
};

interface VerificationStatusProps {
  status: "verified" | "pending";
  message: string;
  updatedAt?: string;
}

const VerificationStatus = ({ status, message, updatedAt }: VerificationStatusProps) => {
  const icon =
    status === "verified" ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-none" />
    ) : (
      <AlertCircle className="w-5 h-5 text-amber-500 flex-none" />
    );

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        status === "verified"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {icon}
      <div className="text-sm">
        <p className="font-medium">
          {status === "verified" ? "Credentials verified" : "Awaiting verification"}
        </p>
        <p className="mt-1">{message}</p>
        {updatedAt && (
          <p className="mt-2 text-xs opacity-80">
            Verified at {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export const buildDefaultPartnerRegionPayload = (): PartnerRegionPayload => clone(DEFAULT_PAYLOAD);

export default PartnerRegionQualificationForm;
