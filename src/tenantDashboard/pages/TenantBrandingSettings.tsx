// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Globe,
  Image,
  Mail,
  Palette,
  RefreshCw,
  Save,
  Upload,
  X,
} from "lucide-react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import { ModernButton, ModernCard } from "../../shared/components/ui";
import ToastUtils from "../../utils/toastUtil";
import {
  useFetchBranding,
  useUpdateBranding,
  useVerifyDomain,
  useResetBranding,
  generateColorPalette,
} from "../../hooks/brandingHooks";

// ═══════════════════════════════════════════════════════════════════
// COLOR PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════════

const ColorPickerField: React.FC<{
  label: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ label, value, onChange }: any) => {
  const [showPicker, setShowPicker] = useState(false);
  const presets = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-12 h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3B82F6"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showPicker && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
          {presets.map((color: any) => (
            <button
              key={color}
              onClick={() => {
                onChange(color);
                setShowPicker(false);
              }}
              className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${value === color
                  ? "border-gray-800 ring-2 ring-offset-2 ring-blue-500"
                  : "border-transparent"
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// FILE UPLOAD COMPONENT
// ═══════════════════════════════════════════════════════════════════

const FileUploadField: React.FC<{
  label: string;
  accept: string;
  currentUrl?: string;
  onChange: (file: File | null) => void;
  hint?: string;
}> = ({ label, accept, currentUrl, onChange, hint }) => {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | null) => {
    if (file) {
      onChange(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="h-20 rounded-lg object-contain" />
            <button
              onClick={() => {
                onChange(null);
                setPreview(null);
              }}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="py-4">
            <Upload className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-500">Drop file here or click to upload</p>
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
          </div>
        )}
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ display: preview ? "none" : "block" }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// DOMAIN VERIFICATION COMPONENT
// ═══════════════════════════════════════════════════════════════════

const DomainVerification: React.FC<{
  currentDomain?: string;
  isVerified?: boolean;
}> = ({ currentDomain, isVerified }: any) => {
  const [domain, setDomain] = useState(currentDomain || "");
  const [verificationData, setVerificationData] = useState<any>(null);
  const { mutate: verifyDomain, isPending } = useVerifyDomain();

  const handleVerify = () => {
    (verifyDomain as any)(domain, {
      onSuccess: (data: any) => setVerificationData(data),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="app.yourdomain.com"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <ModernButton onClick={handleVerify} disabled={!domain || isPending}>
          {isPending ? "Checking..." : "Verify"}
        </ModernButton>
      </div>

      {isVerified && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">Domain verified</span>
        </div>
      )}

      {verificationData && !verificationData.verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Add DNS Record</p>
              <p className="text-xs text-yellow-600 mt-1">Add a TXT record to your DNS settings:</p>
              <div className="mt-2 flex items-center gap-2 bg-white px-3 py-2 rounded border border-yellow-200">
                <code className="text-xs flex-1 break-all">
                  {verificationData.verification_token}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(verificationData.verification_token)}
                  className="p-1 hover:bg-yellow-100 rounded"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const BrandingSettingsSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map((i: any) => (
      <div key={i} className="h-24 bg-gray-100 rounded-xl" />
    ))}
  </div>
);

export const BrandingSettingsActions = ({
  isResetting,
  isSaving,
  onReset,
  onSave,
}: {
  isResetting: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}) => (
  <>
    <ModernButton variant="outline" onClick={onReset} disabled={isResetting}>
      <RefreshCw size={16} className={isResetting ? "animate-spin" : ""} />
      Reset
    </ModernButton>
    <ModernButton onClick={onSave} disabled={isSaving}>
      <Save size={16} />
      {isSaving ? "Saving..." : "Save Changes"}
    </ModernButton>
  </>
);

export const BrandingSettingsSections = ({
  brandingData,
  formData,
  palette,
  onChange,
  onFileChange,
  showDomain = true,
}: {
  brandingData: any;
  formData: any;
  palette: Record<string, string> | null;
  onChange: (field: string, value: string) => void;
  onFileChange: (field: string, file: File | null) => void;
  showDomain?: boolean;
}) => (
  <>
    {/* Color Palette Preview */}
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Palette size={18} />
        Brand Colors
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ColorPickerField
          label="Primary Color"
          value={formData.primary_color}
          onChange={(c) => onChange("primary_color", c)}
        />
        <ColorPickerField
          label="Secondary Color"
          value={formData.secondary_color}
          onChange={(c) => onChange("secondary_color", c)}
        />
        <ColorPickerField
          label="Dashboard Background"
          value={formData.surface_alt}
          onChange={(c) => onChange("surface_alt", c)}
        />
      </div>

      {/* Color Preview */}
      {palette && (
        <div className="mt-4 flex gap-1">
          {Object.entries(palette).map(([shade, color]) => (
            <div
              key={shade}
              className="flex-1 h-8 first:rounded-l-lg last:rounded-r-lg"
              style={{ backgroundColor: color as string }}
              title={`${shade}: ${color}`}
            />
          ))}
        </div>
      )}
    </div>

    {/* Logo & Images */}
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Image size={18} />
        Logo & Images
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadField
          label="Logo"
          accept="image/png,image/jpeg,image/svg+xml"
          currentUrl={brandingData?.resolved?.logo}
          onChange={(f) => onFileChange("logo", f)}
          hint="PNG, JPG, or SVG. Max 2MB."
        />
        <FileUploadField
          label="Favicon"
          accept="image/png,image/x-icon"
          currentUrl={brandingData?.resolved?.favicon}
          onChange={(f) => onFileChange("favicon", f)}
          hint="ICO or PNG. 32x32px recommended."
        />
      </div>
    </div>

    {/* Business Information */}
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Mail size={18} />
        Business Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Company Name</label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => onChange("company_name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => onChange("website", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Support Email</label>
          <input
            type="email"
            value={formData.support_email}
            onChange={(e) => onChange("support_email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Support Phone</label>
          <input
            type="tel"
            value={formData.support_phone}
            onChange={(e) => onChange("support_phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    {showDomain && (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Globe size={18} />
          Custom Domain
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Use your own domain for a fully branded experience.
        </p>
        <DomainVerification
          currentDomain={brandingData?.settings?.branding?.custom_domain}
          isVerified={brandingData?.settings?.branding?.custom_domain_verified}
        />
      </div>
    )}
  </>
);

const useTenantBrandingSettingsState = () => {
  const { data: brandingData, isLoading } = useFetchBranding();
  const { mutate: updateBranding, isPending: isSaving } = useUpdateBranding();
  const { mutate: resetBranding, isPending: isResetting } = useResetBranding();

  const [formData, setFormData] = useState({
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    surface_alt: "#F3F4F6",
    company_name: "",
    email: "",
    support_email: "",
    support_phone: "",
    website: "",
    custom_domain: "",
  });

  const [files, setFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    if (brandingData?.settings) {
      const { branding, business } = brandingData.settings;
      setFormData({
        primary_color: branding?.primary_color || "#3B82F6",
        secondary_color: branding?.secondary_color || "#10B981",
        surface_alt: branding?.surface_alt || "#F3F4F6",
        company_name: business?.company_name || "",
        email: business?.email || "",
        support_email: business?.support_email || "",
        support_phone: business?.support_phone || "",
        website: business?.website || "",
        custom_domain: branding?.custom_domain || "",
      });
    }
  }, [brandingData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[field] = file;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSave = () => {
    const hasExistingFavicon = Boolean(
      brandingData?.resolved?.favicon ||
      brandingData?.settings?.branding?.favicon_url ||
      brandingData?.settings?.branding?.favicon_path
    );
    const isLogoUpdate = Boolean(files.logo);
    const isFaviconUpdate = Boolean(files.favicon);

    if (isLogoUpdate && !isFaviconUpdate && !hasExistingFavicon) {
      ToastUtils.error("Please upload a favicon when setting your logo.");
      return;
    }

    (updateBranding as any)({ ...formData, ...files });
  };

  const handleReset = () => {
    if (window.confirm("Reset all branding to platform defaults?")) {
      resetBranding();
    }
  };

  const palette = generateColorPalette(formData.primary_color);

  return {
    brandingData,
    isLoading,
    isSaving,
    isResetting,
    formData,
    palette,
    handleChange,
    handleFileChange,
    handleSave,
    handleReset,
  };
};

export const TenantBrandingSettingsPanel = ({
  showActions = false,
  actionsClassName = "",
}: {
  showActions?: boolean;
  actionsClassName?: string;
}) => {
  const state = useTenantBrandingSettingsState();

  if (state.isLoading) {
    return <BrandingSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {showActions && (
        <div
          className={["flex flex-wrap justify-end gap-2", actionsClassName]
            .filter(Boolean)
            .join(" ")}
        >
          <BrandingSettingsActions
            isResetting={state.isResetting}
            isSaving={state.isSaving}
            onReset={state.handleReset}
            onSave={state.handleSave}
          />
        </div>
      )}
      <BrandingSettingsSections
        brandingData={state.brandingData}
        formData={state.formData}
        palette={state.palette}
        onChange={state.handleChange}
        onFileChange={state.handleFileChange}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function TenantBrandingSettings() {
  const state = useTenantBrandingSettingsState();

  if (state.isLoading) {
    return (
      <TenantPageShell title="Branding Settings" description="Loading...">
        <BrandingSettingsSkeleton />
      </TenantPageShell>
    );
  }

  return (
    <TenantPageShell
      title="Branding Settings"
      description="Customize your white-label experience"
      actions={
        <div className="flex gap-2">
          <BrandingSettingsActions
            isResetting={state.isResetting}
            isSaving={state.isSaving}
            onReset={state.handleReset}
            onSave={state.handleSave}
          />
        </div>
      }
      contentClassName="space-y-6"
    >
      <BrandingSettingsSections
        brandingData={state.brandingData}
        formData={state.formData}
        palette={state.palette}
        onChange={state.handleChange}
        onFileChange={state.handleFileChange}
      />
    </TenantPageShell>
  );
}
