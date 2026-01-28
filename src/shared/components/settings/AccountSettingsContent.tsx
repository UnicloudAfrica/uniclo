// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Cloud,
  Download,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { ModernCard, ModernButton, ResourceHero } from "../ui";
import ToastUtils from "../../../utils/toastUtil";
import {
  useSetupTwoFactor,
  useEnableTwoFactor,
  useDisableTwoFactor,
} from "../../../hooks/authHooks";
import { useContextAwareSettings } from "../../../hooks/useContextAwareSettings";
import config from "../../../config";
import { getTabsForContext } from "../../constants/profileTabs";
import {
  flattenSettings,
  normalizeFieldValue,
  buildSavePayload,
  normalizeTwoFactorSetup,
  flattenObjectToSettingsArray,
} from "../../utils/settingsUtils";
import {
  ProfileAvatar,
  FieldControl,
  SecurityTwoFactorPanel,
  NetworkPolicySettingsCard,
} from "./index";
import {
  useAdminNetworkPolicySettings,
  useUpdateAdminNetworkPolicySettings,
} from "../../../hooks/useAdminNetworkPolicySettings";
import { TenantBrandingSettingsPanel } from "../../../tenantDashboard/pages/TenantBrandingSettings";
import { AdminBrandingSettingsPanel } from "./AdminBrandingSettingsPanel";

interface AccountSettingsContentProps {
  context: "admin" | "tenant" | "client";
}

const AccountSettingsContent: React.FC<AccountSettingsContentProps> = ({ context }) => {
  const [activeTab, setActiveTab] = useState(getTabsForContext(context)[0]?.id || "profile");
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [resettingSection, setResettingSection] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [twoFactorModal, setTwoFactorModal] = useState({
    open: false,
    mode: "enable",
    qrCodeSvg: "",
    qrCodeUrl: "",
    secret: "",
  });
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [isFetchingTwoFactor, setIsFetchingTwoFactor] = useState(false);
  const [isTwoFactorProcessing, setIsTwoFactorProcessing] = useState(false);

  const isAdminContext = context === "admin";
  const isTenantContext = context === "tenant";
  const showImportExport = context === "admin";

  const { data: networkPolicyData, isLoading: isNetworkPolicyLoading } =
    useAdminNetworkPolicySettings({ enabled: isAdminContext });
  const updateNetworkPolicy = useUpdateAdminNetworkPolicySettings();

  const defaultNetworkPolicy = useMemo(
    () => ({
      force_eip_for_public_preset: false,
      allow_preset_upgrade_for_eip: true,
      require_eip_preflight: false,
      strict_eip_preflight: false,
    }),
    []
  );

  const normalizeBool = (value: any, fallback: boolean) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.toLowerCase().trim();
      if (["1", "true", "yes", "on"].includes(normalized)) return true;
      if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
    return fallback;
  };

  const [networkPolicy, setNetworkPolicy] = useState(defaultNetworkPolicy);

  const {
    useFetchSettings,
    useUpdateSettings,
    useResetSettings,
    useExportSettings,
    useImportSettings,
  } = useContextAwareSettings();

  const { data: profileSettingsData, isFetching, isRefetching, refetch } = useFetchSettings();
  const { mutateAsync: updateSettingsBatch, isPending: isUpdatingSettings } = useUpdateSettings();
  const { mutateAsync: resetSettings, isPending: isResetting } = useResetSettings();
  const { mutateAsync: exportProfileSettings, isPending: isExporting } = useExportSettings();
  const { mutateAsync: importProfileSettings, isPending: isImporting } = useImportSettings();
  const { mutateAsync: setupTwoFactor } = useSetupTwoFactor();
  const { mutateAsync: enableTwoFactor } = useEnableTwoFactor();
  const { mutateAsync: disableTwoFactor } = useDisableTwoFactor();

  const flattenedSettings = useMemo(
    () => flattenSettings(profileSettingsData?.settings ?? {}),
    [profileSettingsData?.settings]
  );

  useEffect(() => {
    if (Object.keys(flattenedSettings).length) {
      setFormState(flattenedSettings);
    }
  }, [flattenedSettings]);

  useEffect(() => {
    if (!isAdminContext) return;
    const rawPolicy = networkPolicyData?.network_policy || {};
    setNetworkPolicy({
      force_eip_for_public_preset: normalizeBool(
        rawPolicy.force_eip_for_public_preset,
        defaultNetworkPolicy.force_eip_for_public_preset
      ),
      allow_preset_upgrade_for_eip: normalizeBool(
        rawPolicy.allow_preset_upgrade_for_eip,
        defaultNetworkPolicy.allow_preset_upgrade_for_eip
      ),
      require_eip_preflight: normalizeBool(
        rawPolicy.require_eip_preflight,
        defaultNetworkPolicy.require_eip_preflight
      ),
      strict_eip_preflight: normalizeBool(
        rawPolicy.strict_eip_preflight,
        defaultNetworkPolicy.strict_eip_preflight
      ),
    });
  }, [defaultNetworkPolicy, networkPolicyData, isAdminContext]);

  const availableCategories = useMemo(
    () => profileSettingsData?.available_categories ?? [],
    [profileSettingsData?.available_categories]
  );

  const networkPolicyTab = useMemo(
    () => ({
      id: "network-policy",
      name: "Network Policy",
      description: "Default EIP safeguards for provisioning.",
      icon: Cloud,
      categories: [],
      groups: [],
    }),
    []
  );

  const brandingTab = useMemo(
    () => ({
      id: "branding",
      name: "Branding",
      description: "Customize logos, colors, and domain.",
      icon: Palette,
      categories: [],
      groups: [],
    }),
    []
  );

  const tabs = useMemo(() => {
    const baseTabs = getTabsForContext(context);
    const filteredTabs = !availableCategories.length
      ? baseTabs
      : baseTabs.filter((tab: any) => {
          if (!tab.categories?.length) {
            return true;
          }
          return tab.categories.some((category: string) => availableCategories.includes(category));
        });

    const customTabs = [];
    if (isAdminContext) customTabs.push(networkPolicyTab);
    if (isTenantContext || isAdminContext) customTabs.push(brandingTab);

    return [...filteredTabs, ...customTabs];
  }, [
    availableCategories,
    brandingTab,
    context,
    isAdminContext,
    isTenantContext,
    networkPolicyTab,
  ]);

  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0] ?? null;

  const handleNetworkPolicyToggle = (key: string) => {
    setNetworkPolicy((prev) => {
      const nextValue = !prev[key];
      if (key === "require_eip_preflight" && !nextValue) {
        return {
          ...prev,
          require_eip_preflight: false,
          strict_eip_preflight: false,
        };
      }
      return { ...prev, [key]: nextValue };
    });
  };

  const handleNetworkPolicySave = () => {
    updateNetworkPolicy.mutate(networkPolicy);
  };

  const metrics = useMemo(() => {
    const categoriesCount = availableCategories.length;
    const notificationKeys = [
      "notifications.email_notifications",
      "notifications.sms_notifications",
      "notifications.instance_alerts",
      "notifications.billing_alerts",
      "notifications.security_alerts",
      "notifications.marketing_emails",
    ];
    const notificationsEnabled = notificationKeys.filter((key) => formState[key]).length;

    const theme =
      formState["preferences.theme"]?.toString().replace(/^\w/, (c: string) => c.toUpperCase()) ||
      "Light";

    return [
      {
        label: "Settings categories",
        value: categoriesCount || tabs.length,
        description: "Available for your role",
        icon: <Settings className="h-4 w-4" />,
      },
      {
        label: "Active alerts",
        value: notificationsEnabled,
        description: "Notification channels enabled",
        icon: <Bell className="h-4 w-4" />,
      },
      {
        label: "Theme preference",
        value: theme,
        description: "Interface appearance",
        icon: <Palette className="h-4 w-4" />,
      },
    ];
  }, [availableCategories, formState, tabs.length]);

  const twoFactorEnabled = Boolean(formState["security.two_factor_enabled"]);

  const closeTwoFactorModal = () => {
    setTwoFactorModal({
      open: false,
      mode: "enable",
      qrCodeSvg: "",
      qrCodeUrl: "",
      secret: "",
    });
    setTwoFactorOtp("");
    setIsFetchingTwoFactor(false);
    setIsTwoFactorProcessing(false);
  };

  const startEnableTwoFactor = async (event?: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (isFetchingTwoFactor || isTwoFactorProcessing) return;
    setIsFetchingTwoFactor(true);
    try {
      const response = await setupTwoFactor({});
      const data = normalizeTwoFactorSetup(response);

      if (!data?.qrCodeSvg && !data?.qrCodeUrl && !data?.secret) {
        throw new Error("Failed to initialize two-factor authentication.");
      }
      setTwoFactorModal({
        open: true,
        mode: "enable",
        qrCodeSvg: data.qrCodeSvg || "",
        qrCodeUrl: data.qrCodeUrl || "",
        secret: data.secret || "",
      });
      setTwoFactorOtp("");
    } catch (error: any) {
      ToastUtils.error(error.message || "Unable to start two-factor authentication setup.");
    } finally {
      setIsFetchingTwoFactor(false);
    }
  };

  const startDisableTwoFactor = (event?: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (isFetchingTwoFactor || isTwoFactorProcessing) return;
    setTwoFactorModal({
      open: true,
      mode: "disable",
      qrCodeSvg: "",
      qrCodeUrl: "",
      secret: "",
    });
    setTwoFactorOtp("");
  };

  const handleConfirmEnableTwoFactor = async () => {
    const sanitizedOtp = twoFactorOtp.trim();
    if (sanitizedOtp.length !== 6) {
      ToastUtils.warning("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsTwoFactorProcessing(true);
    try {
      await enableTwoFactor({
        otp: sanitizedOtp,
        code: sanitizedOtp,
        google2fa_code: sanitizedOtp,
      });
      setFormState((prev) => ({
        ...prev,
        "security.two_factor_enabled": true,
      }));
      ToastUtils.success("Two-factor authentication enabled.");
      closeTwoFactorModal();
      await refetch();
    } catch (error: any) {
      ToastUtils.error(error.message || "Unable to enable two-factor authentication.");
    } finally {
      setIsTwoFactorProcessing(false);
    }
  };

  const handleConfirmDisableTwoFactor = async () => {
    const sanitizedOtp = twoFactorOtp.trim();
    if (sanitizedOtp.length !== 6) {
      ToastUtils.warning("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsTwoFactorProcessing(true);
    try {
      await disableTwoFactor({
        otp: sanitizedOtp,
        code: sanitizedOtp,
        google2fa_code: sanitizedOtp,
      });
      setFormState((prev) => ({
        ...prev,
        "security.two_factor_enabled": false,
      }));
      ToastUtils.success("Two-factor authentication disabled.");
      closeTwoFactorModal();
      await refetch();
    } catch (error: any) {
      ToastUtils.error(error.message || "Unable to disable two-factor authentication.");
    } finally {
      setIsTwoFactorProcessing(false);
    }
  };

  const handleFieldChange = (stateKey: string, value: any) => {
    if (stateKey === "security.two_factor_enabled") {
      if (value) {
        setFormState((prev) => ({
          ...prev,
          "security.two_factor_enabled": prev["security.two_factor_enabled"],
        }));
        startEnableTwoFactor();
      } else {
        startDisableTwoFactor();
      }
      return;
    }

    setFormState((prev) => ({
      ...prev,
      [stateKey]: value,
    }));
  };

  const uploadBaseUrl =
    context === "admin"
      ? config.adminURL
      : context === "tenant"
        ? config.tenantURL
        : config.baseURL;

  const handleAvatarChange = (nextUrl: string | null) => {
    handleFieldChange("profile.profile_picture_url", nextUrl);
    refetch();
  };

  const handleSaveSection = async (tab: any) => {
    const fields = tab.groups.flatMap((group: any) => group.fields || []);
    const payload = buildSavePayload(fields, formState);

    if (!payload.length) {
      ToastUtils.warning("No editable settings available to save.");
      return;
    }

    setSavingSection(tab.id);
    try {
      await updateSettingsBatch({
        settings: payload,
      });
      ToastUtils.success("Profile settings updated");
      await refetch();
    } catch (error: any) {
      ToastUtils.error(error.message || "We could not save your settings right now.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleResetSection = async (tab: any) => {
    if (!tab.categories?.length) return;
    setResettingSection(tab.id);
    try {
      await Promise.all(
        tab.categories.map((category: any) =>
          resetSettings({ category }).catch((error) => {
            console.error(error);
            throw error;
          })
        )
      );
      ToastUtils.success("Settings reset to defaults");
      await refetch();
    } catch (error: any) {
      ToastUtils.error(error.message || "Unable to reset this section right now.");
    } finally {
      setResettingSection(null);
    }
  };

  const handleExport = async () => {
    try {
      const exportResult = await exportProfileSettings();
      const payload = exportResult?.settings ?? exportResult ?? {};
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `profile-settings-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      ToastUtils.success("Profile settings exported");
    } catch (error) {
      ToastUtils.error("Export failed. Please try again in a moment.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let settingsArray: any[] = [];
      if (Array.isArray(parsed)) {
        settingsArray = parsed;
      } else if (Array.isArray(parsed?.settings)) {
        settingsArray = parsed.settings;
      } else if (parsed?.settings && typeof parsed.settings === "object") {
        settingsArray = flattenObjectToSettingsArray(parsed.settings);
      } else if (typeof parsed === "object") {
        settingsArray = flattenObjectToSettingsArray(parsed);
      }

      if (!settingsArray.length) {
        ToastUtils.error("Import file did not contain any valid settings entries.");
        return;
      }

      await importProfileSettings({ settings: settingsArray });
      ToastUtils.success("Profile settings imported");
      await refetch();
    } catch (error: any) {
      ToastUtils.error(error.message || "Unable to import settings. Please verify the file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isLoading = isFetching && !profileSettingsData;

  const qrCodeSrc = useMemo(() => {
    if (twoFactorModal.qrCodeSvg) {
      const trimmed = twoFactorModal.qrCodeSvg.trim();
      const isRawSvg = trimmed.startsWith("<svg");
      return isRawSvg
        ? `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
        : `data:image/svg+xml;base64,${trimmed}`;
    }
    if (twoFactorModal.qrCodeUrl) {
      return twoFactorModal.qrCodeUrl;
    }
    return "";
  }, [twoFactorModal]);

  return (
    <>
      <ResourceHero
        title="Account settings"
        subtitle="Profile"
        description="Manage your profile, preferences, and notification channels in one place."
        metrics={metrics}
        accent="midnight"
        rightSlot={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </ModernButton>
              {showImportExport && (
                <>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export
                  </ModernButton>
                  <ModernButton
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleImportClick}
                    disabled={importing}
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Import
                  </ModernButton>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        }
      />

      {isLoading ? (
        <ModernCard className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            Loading your profile configuration…
          </div>
        </ModernCard>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex w-full max-w-full flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white/70 p-2 shadow-sm lg:w-72 lg:flex-col">
              {tabs.map((tab: any) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-primary-500 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{tab.name}</span>
                      <span
                        className={`block text-xs ${isActive ? "text-white/80" : "text-slate-400"}`}
                      >
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTabConfig && (
              <div className="flex-1 space-y-6">
                {activeTabConfig.id === "network-policy" ? (
                  <NetworkPolicySettingsCard
                    settings={networkPolicy}
                    isLoading={isNetworkPolicyLoading}
                    isSaving={updateNetworkPolicy.isPending}
                    onToggle={handleNetworkPolicyToggle}
                    onSave={handleNetworkPolicySave}
                    title="Network Policy Defaults"
                    description="Set the default Elastic IP safeguards applied to tenant provisioning."
                    footerNote="Applies to all tenants unless overridden."
                  />
                ) : activeTabConfig.id === "branding" ? (
                  isAdminContext ? (
                    <AdminBrandingSettingsPanel showActions />
                  ) : (
                    <TenantBrandingSettingsPanel showActions />
                  )
                ) : (
                  <>
                    {activeTabConfig.id === "profile" && (
                      <ProfileAvatar
                        name={formState["profile.name"]}
                        email={formState["contact.email"]}
                        avatarUrl={formState["profile.profile_picture_url"]}
                        onAvatarChange={handleAvatarChange}
                        uploadEndpoint={`${uploadBaseUrl}/settings/profile/avatar`}
                      />
                    )}

                    {activeTabConfig.groups.map((group: any) => (
                      <ModernCard
                        key={`${activeTabConfig.id}-${group.title}`}
                        className="space-y-6 border border-slate-200/80 bg-white/95 shadow-sm"
                        padding="lg"
                      >
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-slate-900">{group.title}</h3>
                          {group.description && (
                            <p className="text-sm text-slate-500">{group.description}</p>
                          )}
                        </div>

                        {group.fields?.length ? (
                          <div
                            className={`grid gap-5 ${
                              group.layout === "grid" ? "sm:grid-cols-2" : "grid-cols-1"
                            }`}
                          >
                            {group.fields.map((field: any) => (
                              <FieldControl
                                key={field.stateKey}
                                field={field}
                                value={normalizeFieldValue(field, formState[field.stateKey!])}
                                onChange={(nextValue) =>
                                  handleFieldChange(field.stateKey!, nextValue)
                                }
                              />
                            ))}
                          </div>
                        ) : activeTabConfig.id === "security" ? (
                          <SecurityTwoFactorPanel
                            enabled={twoFactorEnabled}
                            onEnable={startEnableTwoFactor}
                            onDisable={startDisableTwoFactor}
                            isBusy={isTwoFactorProcessing}
                            isFetching={isFetchingTwoFactor}
                          />
                        ) : null}

                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                          <ModernButton
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => handleResetSection(activeTabConfig)}
                            disabled={resettingSection === activeTabConfig.id || isUpdatingSettings}
                          >
                            {resettingSection === activeTabConfig.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Reset to defaults
                          </ModernButton>
                          <ModernButton
                            variant="primary"
                            className="flex items-center gap-2 !bg-[--theme-color] hover:opacity-90 !text-white !border-transparent"
                            onClick={() => handleSaveSection(activeTabConfig)}
                            disabled={savingSection === activeTabConfig.id || isUpdatingSettings}
                          >
                            {savingSection === activeTabConfig.id || isUpdatingSettings ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save changes
                          </ModernButton>
                        </div>
                      </ModernCard>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {twoFactorModal.open && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900">
                  {twoFactorModal.mode === "enable"
                    ? "Enable multi-factor authentication"
                    : "Disable multi-factor authentication"}
                </h2>
                <p className="text-sm text-slate-500">
                  {twoFactorModal.mode === "enable"
                    ? "Scan the QR code with your authenticator app and enter the 6-digit code to finish setup."
                    : "Enter the 6-digit code from your authenticator app to confirm disabling two-factor authentication."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTwoFactorModal}
                className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {twoFactorModal.mode === "enable" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  {qrCodeSrc ? (
                    <img src={qrCodeSrc} alt="Authenticator QR code" className="h-40 w-40" />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-slate-200">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Scan using Google Authenticator, Authy, or a compatible app.
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Manual code:</span>{" "}
                  <code className="select-all break-all text-primary-600">
                    {twoFactorModal.secret || "Not provided"}
                  </code>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Authentication code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={twoFactorOtp}
                onChange={(event) =>
                  setTwoFactorOtp(event.target.value.replace(/\\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <ModernButton
                variant="outline"
                onClick={closeTwoFactorModal}
                disabled={isTwoFactorProcessing}
              >
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={
                  twoFactorModal.mode === "enable"
                    ? handleConfirmEnableTwoFactor
                    : handleConfirmDisableTwoFactor
                }
                disabled={isTwoFactorProcessing || twoFactorOtp.trim().length !== 6}
                className="flex items-center gap-2 !bg-[--theme-color] hover:opacity-90 !text-white !border-transparent"
              >
                {isTwoFactorProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {twoFactorModal.mode === "enable" ? "Verify & enable" : "Verify & disable"}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountSettingsContent;
