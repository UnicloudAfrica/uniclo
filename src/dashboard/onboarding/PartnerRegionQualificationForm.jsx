import React, { useMemo } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import ToastUtils from "../../utils/toastUtil.ts";
import { useVerifyPartnerRegionQualification } from "../../hooks/onboardingHooks";

const PROVIDER_OPTIONS = [
  { value: "zadara", label: "Zadara" },
  { value: "aws", label: "AWS (coming soon)" },
  { value: "azure", label: "Azure (coming soon)" },
  { value: "openstack", label: "OpenStack (coming soon)" },
];

const DEFAULT_PAYLOAD = {
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

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureDefaults = (value) => {
  if (!value || typeof value !== "object") {
    return clone(DEFAULT_PAYLOAD);
  }

  const merged = clone(DEFAULT_PAYLOAD);

  merged.has_datacenter_node =
    typeof value.has_datacenter_node === "boolean" ? value.has_datacenter_node : null;

  if (value.region && typeof value.region === "object") {
    Object.assign(merged.region, value.region);

    if (value.region.meta && typeof value.region.meta === "object") {
      merged.region.meta = {
        ...DEFAULT_PAYLOAD.region.meta,
        ...value.region.meta,
      };
    }

    if (value.region.msp_credentials && typeof value.region.msp_credentials === "object") {
      merged.region.msp_credentials = {
        ...DEFAULT_PAYLOAD.region.msp_credentials,
        ...value.region.msp_credentials,
      };

      if (
        value.region.msp_credentials.object_storage &&
        typeof value.region.msp_credentials.object_storage === "object"
      ) {
        merged.region.msp_credentials.object_storage = {
          ...DEFAULT_PAYLOAD.region.msp_credentials.object_storage,
          ...value.region.msp_credentials.object_storage,
        };
      }
    }
  }

  merged.region.provider = (merged.region.provider ?? "").toLowerCase();

  return merged;
};

const setNestedValue = (object, path, value) => {
  const keys = Array.isArray(path) ? path : path.split(".");
  const finalKey = keys[keys.length - 1];
  let cursor = object;

  keys.slice(0, -1).forEach((key) => {
    if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key];
  });

  cursor[finalKey] = value;
};

const PartnerRegionQualificationForm = ({ value, meta, onChange }) => {
  const payload = useMemo(() => ensureDefaults(value), [value]);
  const verificationMutation = useVerifyPartnerRegionQualification();

  const updateValue = (path, nextValue) => {
    onChange((previous) => {
      const base = ensureDefaults(previous);
      const updated = clone(base);
      setNestedValue(updated, path, nextValue);

      if (path === "has_datacenter_node" && nextValue === false) {
        updated.region = clone(DEFAULT_PAYLOAD.region);
      }

      if (path === "region.fulfillment_mode") {
        if (nextValue !== "automated") {
          updated.region.msp_credentials = clone(DEFAULT_PAYLOAD.region.msp_credentials);
          updated.region.msp_credentials.object_storage = clone(
            DEFAULT_PAYLOAD.region.msp_credentials.object_storage
          );
        }
      }

      if (path === "region.msp_credentials.object_storage.enabled" && !nextValue) {
        updated.region.msp_credentials.object_storage = clone(
          DEFAULT_PAYLOAD.region.msp_credentials.object_storage
        );
      }

      return updated;
    });
  };

  const handleProviderChange = (providerValue) => {
    onChange((previous) => {
      const base = ensureDefaults(previous);
      const updated = clone(base);
      const normalized = providerValue.toLowerCase();
      setNestedValue(updated, "region.provider", normalized);

      if (normalized !== "zadara") {
        updated.region.fulfillment_mode = "manual";
        updated.region.msp_credentials = clone(DEFAULT_PAYLOAD.region.msp_credentials);
      }

      return updated;
    });
  };

  const handleVerifyCredentials = async () => {
    if (payload.region.provider !== "zadara") {
      ToastUtils.error("Credential verification is only available for Zadara at the moment.");
      return;
    }

    try {
      const response = await verificationMutation.mutateAsync({
        payload,
      });

      const nextPayload = response?.data?.submission?.payload ?? payload;
      onChange(() => ensureDefaults(nextPayload));
      ToastUtils.success(response?.message ?? "Credentials verified successfully.");
    } catch (error) {
      ToastUtils.error(error.message ?? "Unable to verify MSP credentials.");
    }
  };

  const hasNode = payload.has_datacenter_node === true;
  const submissionMeta = meta ?? {};
  const verificationStatus = submissionMeta.msp_verified ? "verified" : "pending";
  const verificationMessage =
    submissionMeta.msp_verification_message ??
    (submissionMeta.msp_verified
      ? "Credentials verified and pending region approval."
      : "Verify credentials so we can automate provisioning.");

  const canAttemptVerification =
    hasNode &&
    payload.region.provider === "zadara" &&
    payload.region.fulfillment_mode === "automated" &&
    payload.region.msp_credentials.username &&
    payload.region.msp_credentials.password &&
    payload.region.msp_credentials.domain &&
    payload.region.msp_credentials.base_url;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Do you operate a partner-owned region or data centre node?
          </label>
          <div className="flex items-center gap-4">
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
              No, we resell UniCloud regions
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selecting “No” keeps your onboarding optional. Select “Yes” to request your region for
            approval.
          </p>
        </div>
      </div>

      {!hasNode ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Let us know whenever you operate a region, and we’ll help with approval and automated
          provisioning.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cloud provider <span className="text-red-500">*</span>
              </label>
              <select
                value={payload.region.provider}
                onChange={(event) => handleProviderChange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3 bg-white"
              >
                <option value="">Select a provider</option>
                {PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {payload.region.provider && payload.region.provider !== "zadara" && (
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
              placeholder="e.g. lagos-2"
              required
            />
            <Field
              label="Display name"
              value={payload.region.name}
              onChange={(event) => updateValue("region.name", event.target.value)}
              placeholder="e.g. Lagos 2"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fulfilment mode <span className="text-red-500">*</span>
              </label>
              <select
                value={payload.region.fulfillment_mode}
                onChange={(event) =>
                  updateValue("region.fulfillment_mode", event.target.value || "manual")
                }
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
              >
                <option value="manual">Manual – we will manage provisioning</option>
                <option value="automated">Automated – we want UniCloud bots to provision</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CRM automation</label>
              <div className="flex items-center gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.region.meta?.crm_sync ?? false}
                    onChange={(event) => updateValue("region.meta.crm_sync", event.target.checked)}
                    className="rounded border-gray-300 text-[--theme-color] focus:ring-[--theme-color]"
                  />
                  Sync leads to UniCloud CRM
                </label>
              </div>
              <div className="flex items-center gap-3 text-sm mt-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.region.meta?.crm_auto_onboard ?? false}
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
              value={payload.region.meta?.pricing_profile ?? ""}
              onChange={(event) => updateValue("region.meta.pricing_profile", event.target.value)}
              placeholder="Optional pricing profile identifier"
            />

            <Field
              label="Support / operations email"
              value={payload.region.meta?.support_lead_email ?? ""}
              onChange={(event) =>
                updateValue("region.meta.support_lead_email", event.target.value)
              }
              placeholder="ops@partner.io"
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-5 space-y-4">
            {payload.region.provider !== "zadara" ? (
              <div className="text-sm text-gray-600">
                Automated provisioning for {payload.region.provider || "this provider"} is coming
                soon. We will ask for the specific credentials once the integration is live.
              </div>
            ) : payload.region.fulfillment_mode === "automated" ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-800">
                      MSP credentials (platform admin)
                    </p>
                    <p className="text-sm text-gray-500">
                      We keep these encrypted. Required for automated fulfilment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCredentials}
                    disabled={!canAttemptVerification || verificationMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[--theme-color] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {verificationMutation.isPending ? (
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
                    onChange={(event) =>
                      updateValue("region.msp_credentials.base_url", event.target.value)
                    }
                    placeholder="https://compute.partner.example"
                    required
                  />
                  <Field
                    label="Domain"
                    value={payload.region.msp_credentials.domain}
                    onChange={(event) =>
                      updateValue("region.msp_credentials.domain", event.target.value)
                    }
                    required
                  />
                  <Field
                    label="Username"
                    value={payload.region.msp_credentials.username}
                    onChange={(event) =>
                      updateValue("region.msp_credentials.username", event.target.value)
                    }
                    required
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={payload.region.msp_credentials.password}
                    onChange={(event) =>
                      updateValue("region.msp_credentials.password", event.target.value)
                    }
                    required
                  />
                  <Field
                    label="Domain ID"
                    value={payload.region.msp_credentials.domain_id}
                    onChange={(event) =>
                      updateValue("region.msp_credentials.domain_id", event.target.value)
                    }
                  />
                  <Field
                    label="Default project"
                    value={payload.region.msp_credentials.default_project}
                    onChange={(event) =>
                      updateValue("region.msp_credentials.default_project", event.target.value)
                    }
                  />
                </div>

                <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Object storage automation (optional)
                      </p>
                      <p className="text-xs text-gray-500">
                        Provide access keys if you want us to manage buckets and quotas.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={payload.region.msp_credentials.object_storage.enabled ?? false}
                        onChange={(event) =>
                          updateValue(
                            "region.msp_credentials.object_storage.enabled",
                            event.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-[--theme-color] focus:ring-[--theme-color]"
                      />
                      Enable automation
                    </label>
                  </div>

                  {payload.region.msp_credentials.object_storage.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field
                        label="Object storage base URL"
                        value={payload.region.msp_credentials.object_storage.base_url}
                        onChange={(event) =>
                          updateValue(
                            "region.msp_credentials.object_storage.base_url",
                            event.target.value
                          )
                        }
                        placeholder="https://object.partner.example"
                      />
                      <Field
                        label="Service account / tenant"
                        value={payload.region.msp_credentials.object_storage.account}
                        onChange={(event) =>
                          updateValue(
                            "region.msp_credentials.object_storage.account",
                            event.target.value
                          )
                        }
                      />
                      <Field
                        label="Access key"
                        value={payload.region.msp_credentials.object_storage.access_key}
                        onChange={(event) =>
                          updateValue(
                            "region.msp_credentials.object_storage.access_key",
                            event.target.value
                          )
                        }
                      />
                      <Field
                        label="Default quota (GB)"
                        value={payload.region.msp_credentials.object_storage.default_quota_gb}
                        onChange={(event) =>
                          updateValue(
                            "region.msp_credentials.object_storage.default_quota_gb",
                            event.target.value.replace(/[^\d]/g, "")
                          )
                        }
                        placeholder="500"
                      />
                      <Field
                        label="Notification email"
                        value={payload.region.msp_credentials.object_storage.notification_email}
                        onChange={(event) =>
                          updateValue(
                            "region.msp_credentials.object_storage.notification_email",
                            event.target.value
                          )
                        }
                        placeholder="alerts@partner.io"
                      />
                    </div>
                  )}
                </div>

                <VerificationStatus
                  status={verificationStatus}
                  message={verificationMessage}
                  updatedAt={submissionMeta.msp_verified_at}
                />
              </>
            ) : (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-800">Manual fulfilment selected</p>
                <p className="mt-1">
                  You can manage provisioning in your own consoles. Credentials are optional unless
                  you switch to automated fulfilment later.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, required = false, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
    />
  </div>
);

const VerificationStatus = ({ status, message, updatedAt }) => {
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

export const buildDefaultPartnerRegionPayload = () => clone(DEFAULT_PAYLOAD);

export default PartnerRegionQualificationForm;
