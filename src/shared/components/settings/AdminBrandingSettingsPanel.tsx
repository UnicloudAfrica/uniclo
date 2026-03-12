import { useEffect, useState } from "react";
import ToastUtils from "@/utils/toastUtil";
import {
  generateColorPalette,
  useFetchAdminBranding,
  useResetAdminBranding,
  useUpdateAdminBranding,
} from "@/hooks/brandingHooks";
import {
  BrandingSettingsActions,
  BrandingSettingsSections,
  BrandingSettingsSkeleton,
} from "../../../tenantDashboard/pages/TenantBrandingSettings";

interface AdminBrandingFormData {
  primary_color: string;
  secondary_color: string;
  surface_alt: string;
  company_name: string;
  support_email: string;
  support_phone: string;
  website: string;
}

const useAdminBrandingSettingsState = () => {
  const { data: brandingData, isLoading } = useFetchAdminBranding();
  const { mutate: updateBranding, isPending: isSaving } = useUpdateAdminBranding();
  const { mutate: resetBranding, isPending: isResetting } = useResetAdminBranding();

  const [formData, setFormData] = useState<AdminBrandingFormData>({
    primary_color: "var(--theme-color)",
    secondary_color: "var(--secondary-color)",
    surface_alt: "var(--theme-surface-alt)",
    company_name: "",
    support_email: "",
    support_phone: "",
    website: "",
  });

  const [files, setFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const data = brandingData as Record<string, any>;
    if (data?.settings) {
      const { branding, business } = data.settings;
      setFormData({
        primary_color: branding?.primary_color || "var(--theme-color)",
        secondary_color: branding?.secondary_color || "var(--secondary-color)",
        surface_alt: branding?.surface_alt || "var(--theme-surface-alt)",
        company_name: business?.company_name || "",
        support_email: business?.support_email || "",
        support_phone: business?.support_phone || "",
        website: business?.website || "",
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
    const data = brandingData as Record<string, any>;
    const hasExistingFavicon = Boolean(
      data?.resolved?.favicon ||
      data?.settings?.branding?.favicon_url ||
      data?.settings?.branding?.favicon_path
    );
    const isLogoUpdate = Boolean(files.logo);
    const isFaviconUpdate = Boolean(files.favicon);

    if (isLogoUpdate && !isFaviconUpdate && !hasExistingFavicon) {
      ToastUtils.error("Please upload a favicon when setting your logo.");
      return;
    }

    updateBranding({ ...formData, ...files });
  };

  const handleReset = () => {
    if (globalThis.window.confirm("Reset all branding to platform defaults?")) {
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

export const AdminBrandingSettingsPanel = ({
  showActions = false,
  actionsClassName = "",
}: {
  showActions?: boolean;
  actionsClassName?: string;
}) => {
  const state = useAdminBrandingSettingsState();

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
        showDomain={false}
      />
    </div>
  );
};

export default AdminBrandingSettingsPanel;
