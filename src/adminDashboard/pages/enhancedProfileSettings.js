import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Camera,
  Clock,
  Download,
  Globe,
  Loader2,
  Mail,
  Palette,
  RefreshCw,
  Save,
  Settings,
  Shield,
  X,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ResourceHero from "../components/ResourceHero";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import ToastUtils from "../../utils/toastUtil";
import {
  useSetupTwoFactor,
  useEnableTwoFactor,
  useDisableTwoFactor,
} from "../../hooks/authHooks";
import {
  useFetchProfileSettings,
  useUpdateProfileSettingsBatch,
  useResetProfileSettings,
  useExportProfileSettings,
  useImportProfileSettings,
} from "../../hooks/settingsHooks";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "America/Chicago", label: "Central (US)" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
  { value: "Europe/London", label: "GMT / London" },
  { value: "Africa/Lagos", label: "West Africa / Lagos" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const LAYOUT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "compact", label: "Compact" },
  { value: "analytics", label: "Analytics" },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: "10 rows" },
  { value: 25, label: "25 rows" },
  { value: 50, label: "50 rows" },
  { value: 100, label: "100 rows" },
];

const PROFILE_TABS = [
  {
    id: "profile",
    name: "Profile",
    description:
      "Keep your personal details accurate so teammates know who they are collaborating with.",
    icon: User,
    categories: ["profile", "contact"],
    groups: [
      {
        title: "Identity",
        description: "Update how your profile appears across the admin console.",
        fields: [
          {
            stateKey: "profile.name",
            label: "Full name",
            placeholder: "Jane Doe",
            type: "text",
            icon: User,
            required: true,
          },
          {
            stateKey: "contact.email",
            label: "Email address",
            placeholder: "mail@company.com",
            type: "text",
            icon: Mail,
            readOnly: true,
            help: "Email can only be changed by the platform administrator.",
          },
          {
            stateKey: "contact.phone",
            label: "Phone number",
            placeholder: "+234 801 234 5678",
            type: "text",
            icon: Activity,
          },
          {
            stateKey: "profile.timezone",
            label: "Primary timezone",
            placeholder: "Select timezone",
            type: "select",
            options: TIMEZONE_OPTIONS,
            icon: Clock,
            includeWhenUndefined: true,
          },
          {
            stateKey: "profile.location",
            label: "Location",
            placeholder: "City, State, Country",
            type: "text",
            icon: Globe,
          },
        ],
      },
      {
        title: "About you",
        description: "Share a short bio so teams understand your background.",
        fields: [
          {
            stateKey: "profile.bio",
            label: "Bio",
            placeholder: "Tell us about your role, focus areas, and interests.",
            type: "textarea",
            rows: 4,
          },
        ],
      },
    ],
  },
  {
    id: "notifications",
    name: "Notifications",
    description:
      "Choose which alerts you want to receive to stay ahead of infrastructure activity.",
    icon: Bell,
    categories: ["notifications"],
    groups: [
      {
        title: "Notification channels",
        description: "Toggle the channels that should stay active for your profile.",
        layout: "grid",
        fields: [
          {
            stateKey: "notifications.email_notifications",
            label: "Email alerts",
            help: "Receive key operational updates in your inbox.",
            type: "toggle",
          },
          {
            stateKey: "notifications.sms_notifications",
            label: "SMS alerts",
            help: "Get urgent SMS alerts when capacity or billing thresholds are hit.",
            type: "toggle",
          },
          {
            stateKey: "notifications.instance_alerts",
            label: "Instance alerts",
            help: "Be notified when compute instances provision, fail, or scale.",
            type: "toggle",
          },
          {
            stateKey: "notifications.billing_alerts",
            label: "Billing alerts",
            help: "Enable summaries for invoices, renewals, and late payments.",
            type: "toggle",
          },
          {
            stateKey: "notifications.security_alerts",
            label: "Security alerts",
            help: "Critical notifications when security baselines change.",
            type: "toggle",
          },
          {
            stateKey: "notifications.marketing_emails",
            label: "Product updates",
            help: "Opt into release briefings and early product previews.",
            type: "toggle",
          },
        ],
      },
    ],
  },
  {
    id: "preferences",
    name: "Preferences",
    description:
      "Tailor the admin experience to match the way you work day to day.",
    icon: Palette,
    categories: ["preferences"],
    groups: [
      {
        title: "Interface preferences",
        description: "These options impact the appearance and density of data tables.",
        fields: [
          {
            stateKey: "preferences.theme",
            label: "Theme",
            type: "select",
            options: THEME_OPTIONS,
            icon: Palette,
          },
          {
            stateKey: "preferences.language",
            label: "Language",
            type: "select",
            options: LANGUAGE_OPTIONS,
            icon: Globe,
          },
          {
            stateKey: "preferences.dashboard_layout",
            label: "Dashboard layout",
            type: "select",
            options: LAYOUT_OPTIONS,
            icon: Settings,
          },
          {
            stateKey: "preferences.items_per_page",
            label: "Rows per page",
            type: "select",
            options: ITEMS_PER_PAGE_OPTIONS,
            icon: Activity,
            cast: (value) => Number(value) || 25,
          },
        ],
      },
    ],
  },
  {
    id: "security",
    name: "Security",
    description:
      "Increase the protection around your account and keep suspicious access at bay.",
    icon: Shield,
    categories: ["security"],
    groups: [
      {
        title: "Multi-factor authentication",
        description:
          "Require a secondary factor when signing in to this admin account.",
        fields: [],
      },
    ],
  },
];

const flattenSettings = (settings = {}) => {
  const flattened = {};

  Object.entries(settings).forEach(([category, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([key, inner]) => {
        flattened[`${category}.${key}`] = inner;
      });
    } else {
      flattened[category] = value;
    }
  });

  return flattened;
};

const normalizeFieldValue = (field, raw) => {
  if (field?.type === "toggle") {
    return Boolean(raw);
  }
  if (field?.cast) {
    return field.cast(raw);
  }
  if (field?.type === "select" && raw === undefined) {
    return field.options?.[0]?.value ?? "";
  }
  if (raw === undefined || raw === null) {
    return field?.type === "textarea" ? "" : "";
  }
  return raw;
};

const transformValueForSave = (field, raw) => {
  if (field?.cast) {
    return field.cast(raw);
  }
  if (field?.type === "toggle") {
    return Boolean(raw);
  }
  if (field?.type === "select" && typeof raw === "string") {
    return raw;
  }
  return raw;
};

const ProfileAvatar = ({ name, email, avatarUrl, onAvatarChange }) => {
  const token = useAdminAuthStore((state) => state.token);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const initials =
    name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  const uploadEndpoint = `${config.baseURL}/settings/profile/avatar`;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      ToastUtils.error("Please select an image file (PNG, JPG, SVG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      ToastUtils.error("Avatar must be smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to upload avatar");
      }
      const nextUrl =
        data?.data?.avatar_url || data?.data?.setting?.value || null;
      onAvatarChange(nextUrl);
      ToastUtils.success("Profile picture updated");
    } catch (error) {
      console.error(error);
      ToastUtils.error(
        error.message || "Unable to upload profile picture right now."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      const response = await fetch(uploadEndpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to remove avatar");
      }
      onAvatarChange(null);
      ToastUtils.success("Profile picture removed");
    } catch (error) {
      console.error(error);
      ToastUtils.error(
        error.message || "Unable to remove your profile picture right now."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModernCard
      className="flex flex-col gap-4 border border-slate-200/80 bg-white/90"
      padding="lg"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-slate-200">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name || "Profile avatar"}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-900/5 text-xl font-semibold text-slate-500">
              {initials}
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-500">
            <Camera className="h-4 w-4" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {name || "Unknown administrator"}
            </h3>
            <p className="text-sm text-slate-500">{email || "No email set"}</p>
          </div>
          <p className="text-xs text-slate-400">
            Recommended size: 320 × 320px PNG, JPG, SVG (max 5MB)
          </p>
          <div className="flex flex-wrap gap-2">
            <ModernButton
              size="sm"
              className="flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              Upload new photo
            </ModernButton>
            {avatarUrl && (
              <ModernButton
                size="sm"
                variant="outline"
                className="flex items-center gap-2 text-red-500 hover:text-red-600"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </ModernButton>
            )}
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

const FieldControl = ({ field, value, onChange }) => {
  const {
    label,
    placeholder,
    type,
    help,
    readOnly,
    icon: Icon,
    options = [],
    rows = 3,
  } = field;
  const [isFocused, setFocused] = useState(false);

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          rows={rows}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      );
    }

    if (type === "select") {
      return (
        <select
          value={value ?? options[0]?.value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "toggle") {
      const active = Boolean(value);
      return (
        <button
          type="button"
          onClick={() => onChange(!active)}
          className={`relative inline-flex h-9 w-16 items-center rounded-full border transition ${active
            ? "border-primary-200 bg-primary-500/90"
            : "border-slate-200 bg-slate-200/60"
            }`}
        >
          <span
            className={`ml-1 inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white text-xs font-semibold transition ${active ? "translate-x-7 text-primary-600" : "translate-x-0 text-slate-500"
              }`}
          >
            {active ? "On" : "Off"}
          </span>
        </button>
      );
    }

    const inputType = type === "number" ? "number" : "text";
    return (
      <div className="relative">
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isFocused ? "text-primary-500" : ""
              }`}
          />
        )}
        <input
          type={inputType}
          value={value ?? ""}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full rounded-xl border ${readOnly
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 shadow-sm transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            } px-4 py-3 text-sm ${Icon ? "pl-11" : ""}`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {readOnly && (
          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
            Read only
          </span>
        )}
      </div>
      {renderInput()}
      {help && <p className="text-xs text-slate-400">{help}</p>}
    </div>
  );
};

const SecurityTwoFactorPanel = ({
  enabled,
  onEnable,
  onDisable,
  isBusy,
  isFetching,
}) => {
  const statusLabel = enabled ? "Enabled" : "Disabled";
  const statusStyles = enabled
    ? "bg-emerald-50 text-emerald-600"
    : "bg-slate-200 text-slate-600";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Two-factor authentication (2FA)
          </p>
          <p className="text-sm text-slate-500">
            Add a second verification step to keep your administrative access
            secure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}
          >
            {statusLabel}
          </span>
          <ModernButton
            size="sm"
            variant={enabled ? "outline" : "primary"}
            className={`flex items-center gap-2 ${
              enabled
                ? "hover:!bg-[#e8f4fd] !text-[#288DD1] !border-[#288DD1]"
                : "!bg-[#288DD1] hover:!bg-[#0f6cad] !text-white !border-transparent"
            }`}
            onClick={enabled ? onDisable : onEnable}
            disabled={isBusy || isFetching}
          >
            {isBusy || isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {enabled ? "Disable 2FA" : "Enable 2FA"}
          </ModernButton>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
        {enabled ? (
          <p>
            You will need the 6-digit code from your authenticator app whenever
            you sign in. Keep your backup codes somewhere safe.
          </p>
        ) : (
          <p>
            Use Google Authenticator, Authy, or any compatible authenticator app
            to scan our QR code and confirm a 6-digit code to complete setup.
          </p>
        )}
      </div>
    </div>
  );
};

const buildSavePayload = (fields, formState) => {
  return fields
    .filter((field) => field.stateKey && !field.readOnly && field.type !== "description")
    .map((field) => {
      const [category, key] = field.stateKey.split(".");
      if (!category || !key) return null;
      const currentValue = formState[field.stateKey];
      if (currentValue === undefined && !field.includeWhenUndefined) {
        return null;
      }
      return {
        category,
        key,
        value: transformValueForSave(
          field,
          currentValue !== undefined ? currentValue : null
        ),
      };
    })
    .filter(Boolean);
};

const flattenObjectToSettingsArray = (settingsObject = {}) => {
  const payload = [];
  Object.entries(settingsObject).forEach(([category, values]) => {
    if (values && typeof values === "object" && !Array.isArray(values)) {
      Object.entries(values).forEach(([key, value]) => {
        payload.push({ category, key, value });
      });
    }
  });
  return payload;
};

export default function EnhancedProfileSettings() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(PROFILE_TABS[0].id);
  const [formState, setFormState] = useState({});
  const [savingSection, setSavingSection] = useState(null);
  const [resettingSection, setResettingSection] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
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

  const {
    data: profileSettingsData,
    isFetching,
    isRefetching,
    refetch,
  } = useFetchProfileSettings();

  const {
    mutateAsync: updateSettingsBatch,
    isPending: isUpdatingSettings,
  } = useUpdateProfileSettingsBatch();
  const { mutateAsync: resetSettings, isPending: isResetting } =
    useResetProfileSettings();
  const { mutateAsync: exportProfileSettings, isPending: isExporting } =
    useExportProfileSettings();
  const { mutateAsync: importProfileSettings } = useImportProfileSettings();
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

  const availableCategories = useMemo(
    () => profileSettingsData?.available_categories ?? [],
    [profileSettingsData?.available_categories]
  );

  const tabs = useMemo(() => {
    if (!availableCategories.length) {
      return PROFILE_TABS;
    }
    return PROFILE_TABS.filter((tab) => {
      if (!tab.categories?.length) {
        return true;
      }
      return tab.categories.some((category) =>
        availableCategories.includes(category)
      );
    });
  }, [availableCategories]);

  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const activeTabConfig =
    tabs.find((tab) => tab.id === activeTab) ?? tabs[0] ?? null;

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
    const notificationsEnabled = notificationKeys.filter(
      (key) => formState[key]
    ).length;

    const theme =
      formState["preferences.theme"]?.toString().replace(/^\w/, (c) =>
        c.toUpperCase()
      ) || "Light";

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

  const twoFactorEnabled = Boolean(
    formState["security.two_factor_enabled"]
  );

  const normalizeTwoFactorSetup = (response) => {
    const data = response?.data ?? response?.message ?? response ?? {};
    const rawQrCode = data.qrCode ?? data.qr_code ?? null;
    let qrCodeSvg =
      data.qrCodeSvg ||
      data.qr_code_svg ||
      data.qr_svg ||
      (typeof rawQrCode === "string" && rawQrCode.startsWith("<svg")
        ? rawQrCode
        : null) ||
      null;
    const qrCodeUrl =
      data.qrCodeUrl ||
      data.qr_code_url ||
      data.qr_url ||
      (typeof rawQrCode === "string" && !rawQrCode.startsWith("<svg")
        ? rawQrCode
        : null) ||
      null;

    let secret =
      data.secret ||
      data.google2fa_secret ||
      data.manual_entry_key ||
      data.base32 ||
      data.base32_secret ||
      null;

    if (!secret && typeof data.otpauth_url === "string") {
      const match = data.otpauth_url.match(/secret=([^&]+)/i);
      if (match?.[1]) {
        secret = match[1];
      }
    }

    return { qrCodeSvg, qrCodeUrl, secret };
  };

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

  const startEnableTwoFactor = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log("Starting 2FA setup...");
    if (isFetchingTwoFactor || isTwoFactorProcessing) return;
    setIsFetchingTwoFactor(true);
    try {
      const response = await setupTwoFactor();
      console.log("2FA Setup Response:", response);
      const data = normalizeTwoFactorSetup(response);
      console.log("Normalized 2FA Data:", data);

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
    } catch (error) {
      console.error("2FA Setup Error:", error);
      ToastUtils.error(
        error.message || "Unable to start two-factor authentication setup."
      );
    } finally {
      setIsFetchingTwoFactor(false);
    }
  };

  const startDisableTwoFactor = (event) => {
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
    } catch (error) {
      console.error(error);
      ToastUtils.error(
        error.message || "Unable to enable two-factor authentication."
      );
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
    } catch (error) {
      console.error(error);
      ToastUtils.error(
        error.message || "Unable to disable two-factor authentication."
      );
    } finally {
      setIsTwoFactorProcessing(false);
    }
  };

  const handleFieldChange = (stateKey, value) => {
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

  const handleAvatarChange = (nextUrl) => {
    handleFieldChange("profile.profile_picture_url", nextUrl);
    refetch();
  };

  const handleSaveSection = async (tab) => {
    const fields = tab.groups.flatMap((group) => group.fields || []);
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
    } catch (error) {
      console.error(error);
      ToastUtils.error(
        error.message || "We could not save your settings right now."
      );
    } finally {
      setSavingSection(null);
    }
  };

  const handleResetSection = async (tab) => {
    if (!tab.categories?.length) return;
    setResettingSection(tab.id);
    try {
      await Promise.all(
        tab.categories.map((category) =>
          resetSettings({ category }).catch((error) => {
            console.error(error);
            throw error;
          })
        )
      );
      ToastUtils.success("Settings reset to defaults");
      await refetch();
    } catch (error) {
      ToastUtils.error(
        error.message || "Unable to reset this section right now."
      );
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
      link.download = `profile-settings-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      ToastUtils.success("Profile settings exported");
    } catch (error) {
      console.error(error);
      ToastUtils.error("Export failed. Please try again in a moment.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let settingsArray = [];
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
        ToastUtils.error(
          "Import file did not contain any valid settings entries."
        );
        return;
      }

      await importProfileSettings({ settings: settingsArray });
      ToastUtils.success("Profile settings imported");
      await refetch();
    } catch (error) {
      console.error(error);
      ToastUtils.error(
        error.message || "Unable to import settings. Please verify the file."
      );
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
      <AdminHeadbar onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <AdminPageShell
        contentClassName="space-y-8"
        description="Control how the admin console recognises you and where important notifications land."
      >
        <ResourceHero
          title="Profile settings"
          subtitle="Account"
          description="Curate your admin identity, preferences, and notifications so the console works the way you do."
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
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${isActive
                        ? "bg-primary-500 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {tab.name}
                        </span>
                        <span
                          className={`block text-xs ${isActive ? "text-white/80" : "text-slate-400"
                            }`}
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
                  {activeTabConfig.id === "profile" && (
                    <ProfileAvatar
                      name={formState["profile.name"]}
                      email={formState["contact.email"]}
                      avatarUrl={formState["profile.profile_picture_url"]}
                      onAvatarChange={handleAvatarChange}
                    />
                  )}

                  {activeTabConfig.groups.map((group) => (
                    <ModernCard
                      key={`${activeTabConfig.id}-${group.title}`}
                      className="space-y-6 border border-slate-200/80 bg-white/95 shadow-sm"
                      padding="lg"
                    >
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">
                          {group.title}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-slate-500">
                            {group.description}
                          </p>
                        )}
                      </div>

                      {group.fields?.length ? (
                        <div
                          className={`grid gap-5 ${group.layout === "grid"
                            ? "sm:grid-cols-2"
                            : "grid-cols-1"
                            }`}
                        >
                          {group.fields.map((field) => (
                            <FieldControl
                              key={field.stateKey}
                              field={field}
                              value={normalizeFieldValue(
                                field,
                                formState[field.stateKey]
                              )}
                              onChange={(nextValue) =>
                                handleFieldChange(field.stateKey, nextValue)
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
            disabled={
                            resettingSection === activeTabConfig.id ||
                            isUpdatingSettings
                          }
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
            className="flex items-center gap-2 !bg-[#288DD1] hover:!bg-[#0f6cad] !text-white !border-transparent"
            onClick={() => handleSaveSection(activeTabConfig)}
            disabled={
              savingSection === activeTabConfig.id ||
              isUpdatingSettings
            }
          >
            {savingSection === activeTabConfig.id ||
              isUpdatingSettings ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save changes
                        </ModernButton>
                      </div>
                    </ModernCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminPageShell>

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
                    <img
                      src={qrCodeSrc}
                      alt="Authenticator QR code"
                      className="h-40 w-40"
                    />
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
                  setTwoFactorOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
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
                disabled={
                  isTwoFactorProcessing || twoFactorOtp.trim().length !== 6
                }
                className="flex items-center gap-2 !bg-[#288DD1] hover:!bg-[#0f6cad] !text-white !border-transparent"
              >
                {isTwoFactorProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {twoFactorModal.mode === "enable"
                  ? "Verify & enable"
                  : "Verify & disable"}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
