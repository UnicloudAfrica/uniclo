/**
 * CloudAccountCreateForm — Multi-step form to connect a cloud provider.
 *
 * Step 1: Pick provider (visual grid)
 * Step 2: Enter credentials (dynamic fields per provider)
 * Step 3: Optional verification + save
 */
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cloud,
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useCreateCloudAccount,
  useFetchCloudAccountProviders,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ─── Provider Data ────────────────────────────────────────────────

interface ProviderConfig {
  name: string;
  label: string;
  description: string;
  color: string;
  bgGradient: string;
  fields: { key: string; label: string; hint: string; secret: boolean; multiline: boolean }[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "aws",
    label: "Amazon Web Services",
    description: "EC2, RDS-compatible provisioning across all AWS regions",
    color: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    fields: [
      { key: "access_key_id", label: "Access Key ID", hint: "IAM access key (starts with AKIA...)", secret: false, multiline: false },
      { key: "secret_access_key", label: "Secret Access Key", hint: "IAM secret access key", secret: true, multiline: false },
    ],
  },
  {
    name: "gcp",
    label: "Google Cloud Platform",
    description: "Compute Engine provisioning with service account credentials",
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    fields: [
      { key: "project_id", label: "Project ID", hint: "GCP project ID (e.g. my-project-123)", secret: false, multiline: false },
      { key: "credentials_json", label: "Service Account JSON", hint: "Paste the full service account key JSON", secret: true, multiline: true },
    ],
  },
  {
    name: "azure",
    label: "Microsoft Azure",
    description: "Virtual Machines via Azure Resource Manager API",
    color: "from-sky-500 to-blue-600",
    bgGradient: "from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20",
    fields: [
      { key: "subscription_id", label: "Subscription ID", hint: "Azure subscription UUID", secret: false, multiline: false },
      { key: "tenant_id", label: "Tenant ID", hint: "Azure AD tenant UUID", secret: false, multiline: false },
      { key: "client_id", label: "Client ID", hint: "App registration client ID", secret: false, multiline: false },
      { key: "client_secret", label: "Client Secret", hint: "App registration client secret", secret: true, multiline: false },
    ],
  },
  {
    name: "digitalocean",
    label: "DigitalOcean",
    description: "Droplets and volumes via the DigitalOcean API",
    color: "from-indigo-500 to-violet-500",
    bgGradient: "from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20",
    fields: [
      { key: "api_token", label: "API Token", hint: "Personal access token from DO control panel", secret: true, multiline: false },
    ],
  },
  {
    name: "linode",
    label: "Linode (Akamai)",
    description: "Linodes and volumes via the Linode API",
    color: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    fields: [
      { key: "api_token", label: "API Token", hint: "Personal access token from Linode Cloud Manager", secret: true, multiline: false },
    ],
  },
  {
    name: "vultr",
    label: "Vultr",
    description: "Cloud compute instances via the Vultr API",
    color: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
    fields: [
      { key: "api_key", label: "API Key", hint: "API key from Vultr account settings", secret: true, multiline: false },
    ],
  },
  {
    name: "hetzner",
    label: "Hetzner Cloud",
    description: "Cloud servers via the Hetzner Cloud API",
    color: "from-red-500 to-rose-500",
    bgGradient: "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20",
    fields: [
      { key: "api_token", label: "API Token", hint: "API token from Hetzner Cloud Console", secret: true, multiline: false },
    ],
  },
  {
    name: "openstack",
    label: "OpenStack",
    description: "Nova compute + Cinder volumes via Keystone v3 auth",
    color: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20",
    fields: [
      { key: "auth_url", label: "Auth URL", hint: "Keystone v3 endpoint (e.g. https://keystone.example.com:5000/v3)", secret: false, multiline: false },
      { key: "username", label: "Username", hint: "OpenStack username", secret: false, multiline: false },
      { key: "password", label: "Password", hint: "OpenStack password", secret: true, multiline: false },
      { key: "project_id", label: "Project ID", hint: "OpenStack project/tenant UUID", secret: false, multiline: false },
    ],
  },
  {
    name: "nutanix",
    label: "Nutanix AHV",
    description: "VMs on Nutanix AHV via Prism Central v3 API",
    color: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
    fields: [
      { key: "prism_url", label: "Prism Central URL", hint: "e.g. https://prism.example.com:9440", secret: false, multiline: false },
      { key: "username", label: "Username", hint: "Prism Central admin username", secret: false, multiline: false },
      { key: "password", label: "Password", hint: "Prism Central password", secret: true, multiline: false },
      { key: "cluster_uuid", label: "Cluster UUID", hint: "Target Nutanix cluster UUID", secret: false, multiline: false },
    ],
  },
  {
    name: "custom",
    label: "Custom Provider",
    description: "Any provider with a REST API for VM provisioning",
    color: "from-gray-500 to-slate-500",
    bgGradient: "from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20",
    fields: [
      { key: "base_url", label: "Base URL", hint: "API base URL (e.g. https://api.provider.com)", secret: false, multiline: false },
      { key: "api_key", label: "API Key", hint: "Authentication API key", secret: true, multiline: false },
    ],
  },
];

// ─── Secret Field with Toggle ─────────────────────────────────────

const SecretInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}> = ({ value, onChange, placeholder, multiline }) => {
  const [visible, setVisible] = useState(false);

  if (multiline) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pr-10 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────

interface CloudAccountCreateFormProps {
  listPath: string;
}

const CloudAccountCreateForm: React.FC<CloudAccountCreateFormProps> = ({ listPath }) => {
  const navigate = useNavigate();
  const createMutation = useCreateCloudAccount();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [accountName, setAccountName] = useState("");
  const [defaultRegion, setDefaultRegion] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [verifyOnSave, setVerifyOnSave] = useState(true);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const provider = useMemo(
    () => PROVIDERS.find((p) => p.name === selectedProvider),
    [selectedProvider]
  );

  const isCredentialsComplete = useMemo(() => {
    if (!provider) return false;
    return provider.fields.every((f) => (credentials[f.key] ?? "").trim().length > 0);
  }, [provider, credentials]);

  const canSubmit = accountName.trim().length > 0 && isCredentialsComplete;

  const handleSelectProvider = useCallback((name: string) => {
    setSelectedProvider(name);
    setCredentials({});
    setAccountName("");
    setDefaultRegion("");
    setSaveResult(null);
    setStep(2);
  }, []);

  const updateCredential = useCallback((key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSaveResult(null);

    try {
      const result = await createMutation.mutateAsync({
        name: accountName.trim(),
        provider: selectedProvider,
        credentials,
        default_region: defaultRegion.trim() || null,
        verify: verifyOnSave,
      });

      const data = result as Record<string, unknown>;
      const verified = data?.verified === true;

      setSaveResult({
        success: true,
        message: verified
          ? "Cloud account connected and verified successfully!"
          : "Cloud account saved. Credentials have not been verified yet.",
      });

      // Navigate back after short delay
      setTimeout(() => navigate(listPath), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create cloud account.";
      setSaveResult({ success: false, message });
    }
  }, [canSubmit, accountName, selectedProvider, credentials, defaultRegion, verifyOnSave, createMutation, navigate, listPath]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
        }`}>
          1
        </div>
        <div className={`h-0.5 flex-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
        }`}>
          2
        </div>
      </div>

      {/* Step 1: Provider Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Choose Your Cloud Provider
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select the cloud platform where you want to deploy databases using your own credentials.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleSelectProvider(p.name)}
                className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md ${
                  selectedProvider === p.name
                    ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {/* Gradient accent */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${p.bgGradient}`}>
                    <Cloud size={18} className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {p.label}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {p.description}
                    </div>
                    <div className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                      {p.fields.length} credential{p.fields.length !== 1 ? "s" : ""} required
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Credentials */}
      {step === 2 && provider && (
        <div className="space-y-5">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={14} />
            Change provider
          </button>

          {/* Provider header */}
          <div className={`rounded-xl p-4 bg-gradient-to-r ${provider.bgGradient} border border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${provider.color}`}>
                <Cloud size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{provider.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
              </div>
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={`My ${provider.label} Account`}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">A friendly name to identify this account</p>
          </div>

          {/* Credential Fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Credentials</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">(encrypted at rest)</span>
            </div>

            {provider.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label}
                </label>
                {field.secret ? (
                  <SecretInput
                    value={credentials[field.key] ?? ""}
                    onChange={(v) => updateCredential(field.key, v)}
                    placeholder={field.hint}
                    multiline={field.multiline}
                  />
                ) : (
                  <input
                    type="text"
                    value={credentials[field.key] ?? ""}
                    onChange={(e) => updateCredential(field.key, e.target.value)}
                    placeholder={field.hint}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
                <p className="mt-0.5 text-[10px] text-gray-400">{field.hint}</p>
              </div>
            ))}
          </div>

          {/* Default Region (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Region <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={defaultRegion}
              onChange={(e) => setDefaultRegion(e.target.value)}
              placeholder="e.g. us-east-1"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Used as default when creating databases with this account
            </p>
          </div>

          {/* Verify on save toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
            <button
              type="button"
              onClick={() => setVerifyOnSave(!verifyOnSave)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                verifyOnSave ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                verifyOnSave ? "translate-x-4 ml-0.5" : "translate-x-0.5"
              }`} />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verify credentials on save
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                We&apos;ll test the connection to make sure your credentials work before saving
              </p>
            </div>
          </div>

          {/* Security notice */}
          <div className="flex gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-3">
            <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">Your credentials are secure</p>
              <p>All credentials are encrypted with AES-256 before storage. They are only decrypted at provisioning time and never logged or transmitted to third parties.</p>
            </div>
          </div>

          {/* Result message */}
          {saveResult && (
            <div className={`flex items-start gap-2 rounded-lg p-3 ${
              saveResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
            }`}>
              {saveResult.success ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <XCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              )}
              <p className={`text-sm ${
                saveResult.success ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
              }`}>
                {saveResult.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <ModernButton variant="ghost" onClick={() => navigate(listPath)}>
              Cancel
            </ModernButton>
            <ModernButton
              variant="primary"
              disabled={!canSubmit}
              loading={createMutation.isPending}
              onClick={handleSubmit}
            >
              <ShieldCheck size={16} className="mr-1.5" />
              {verifyOnSave ? "Verify & Connect" : "Connect Account"}
            </ModernButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudAccountCreateForm;
