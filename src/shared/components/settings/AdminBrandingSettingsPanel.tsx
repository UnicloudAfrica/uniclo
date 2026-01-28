// @ts-nocheck
import React, { useEffect, useState } from "react";
import ToastUtils from "../../../utils/toastUtil";
import {
  generateColorPalette,
  useFetchAdminBranding,
  useResetAdminBranding,
  useUpdateAdminBranding,
} from "../../../hooks/brandingHooks";
import {
  BrandingSettingsActions,
  BrandingSettingsSections,
  BrandingSettingsSkeleton,
} from "../../../tenantDashboard/pages/TenantBrandingSettings";

const useAdminBrandingSettingsState = () => {
  const { data: brandingData, isLoading } = useFetchAdminBranding();
  const { mutate: updateBranding, isPending: isSaving } = useUpdateAdminBranding();
  const { mutate: resetBranding, isPending: isResetting } = useResetAdminBranding();

  const [formData, setFormData] = useState({
    primary_color: "#288DD1",
    secondary_color: "#3FE0C8",
    surface_alt: "#F3F4F6",
    company_name: "",
    support_email: "",
    support_phone: "",
    website: "",
  });

  const [files, setFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    if (brandingData?.settings) {
      const { branding, business } = brandingData.settings;
      setFormData({
        primary_color: branding?.primary_color || "#288DD1",
        secondary_color: branding?.secondary_color || "#3FE0C8",
        surface_alt: branding?.surface_alt || "#F3F4F6",
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
