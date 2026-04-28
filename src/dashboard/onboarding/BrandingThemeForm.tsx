import { useMemo, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import ToastUtils from "@/utils/toastUtil";
import FileDropInput from "./FileDropInput";
import type { OnboardingFileValue, UploadedFileValue } from "@/types/onboarding";

export interface BrandingThemePayload extends Record<string, unknown> {
  logo: OnboardingFileValue;
  logo_href: string;
  privacy_policy_url: string;
  help_center_url: string;
  unsubscription_url: string;
  theme_color: string;
  secondary_color: string;
  text_color: string;
  ahref_link_color: string;
}

const DEFAULT_PAYLOAD: BrandingThemePayload = {
  logo: "",
  logo_href: "",
  privacy_policy_url: "",
  help_center_url: "",
  unsubscription_url: "",
  theme_color: "var(--theme-heading-color)",
  secondary_color: "var(--theme-color)",
  text_color: "var(--theme-heading-color)",
  ahref_link_color: "var(--theme-color)",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const isUploadedFileValue = (value: unknown): value is UploadedFileValue => isRecord(value);

export const ensureBrandingThemeDefaults = (value: unknown): BrandingThemePayload => {
  if (!isRecord(value)) {
    return { ...DEFAULT_PAYLOAD };
  }

  const merged: BrandingThemePayload = { ...DEFAULT_PAYLOAD };

  (Object.keys(DEFAULT_PAYLOAD) as Array<keyof BrandingThemePayload>).forEach((key) => {
    const nextValue = value[key];

    if (key === "logo") {
      if (typeof nextValue === "string" || isUploadedFileValue(nextValue)) {
        merged.logo = nextValue;
      }
      return;
    }

    if (typeof nextValue === "string") {
      merged[key] = nextValue as BrandingThemePayload[typeof key];
    }
  });

  return merged;
};

interface BrandingThemeFormProps {
  value: Record<string, unknown> | null | undefined;
  onChange: Dispatch<SetStateAction<unknown>>;
}

const BrandingThemeForm = ({ value, onChange }: BrandingThemeFormProps) => {
  const payload = useMemo(() => ensureBrandingThemeDefaults(value), [value]);

  const updateValue = (
    path: keyof BrandingThemePayload,
    nextValue: BrandingThemePayload[keyof BrandingThemePayload]
  ) => {
    onChange((previous) => {
      const base = ensureBrandingThemeDefaults(previous);
      return { ...base, [path]: nextValue };
    });
  };

  const handleLogoUpload = (file: File | null) => {
    if (!file) {
      updateValue("logo", "");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updateValue("logo", event.target?.result ?? "");
    };
    reader.onerror = () => {
      ToastUtils.error("We couldn't read that logo. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Customer-facing URLs</h3>
        <p className="text-xs text-gray-500">
          These links power automatic redirects from the CRM and email footers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Privacy policy URL"
            value={payload.privacy_policy_url}
            onChange={(event) => updateValue("privacy_policy_url", event.target.value)}
            placeholder="https://example.com/privacy"
            required
          />
          <InputField
            label="Help centre URL"
            value={payload.help_center_url}
            onChange={(event) => updateValue("help_center_url", event.target.value)}
            placeholder="https://support.example.com"
          />
          <InputField
            label="Email unsubscription URL"
            value={payload.unsubscription_url}
            onChange={(event) => updateValue("unsubscription_url", event.target.value)}
            placeholder="https://example.com/unsubscribe"
          />
          <InputField
            label="Logo target URL"
            value={payload.logo_href}
            onChange={(event) => updateValue("logo_href", event.target.value)}
            placeholder="https://example.com"
            helperText="Where users land when they click your logo."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Brand assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company logo</label>
            <FileDropInput
              accept=".png,.jpg,.jpeg,.svg"
              value={payload.logo}
              onFileSelected={handleLogoUpload}
              helperText="Upload a square PNG, JPG, or SVG. We'll optimise it automatically."
            />
            {typeof payload.logo === "string" &&
              (payload.logo.startsWith("data:image") || payload.logo.startsWith("http")) && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-white shadow-sm">
                    <img
                      src={payload.logo}
                      alt="Company logo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Preview</p>
                </div>
              )}
            {isUploadedFileValue(payload.logo) && typeof payload.logo.url === "string" && (
              <a
                href={payload.logo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[--theme-color] mt-2"
              >
                View current logo
              </a>
            )}
          </div>

          <ColorField
            label="Theme colour"
            value={payload.theme_color}
            onChange={(event) => updateValue("theme_color", event.target.value)}
            placeholder="var(--theme-heading-color)"
          />
          <ColorField
            label="Secondary colour"
            value={payload.secondary_color}
            onChange={(event) => updateValue("secondary_color", event.target.value)}
            placeholder="var(--theme-color)"
            helperText="Optional accent colour."
          />
          <ColorField
            label="Text colour"
            value={payload.text_color}
            onChange={(event) => updateValue("text_color", event.target.value)}
            placeholder="var(--theme-heading-color)"
          />
          <ColorField
            label="Anchor link colour"
            value={payload.ahref_link_color}
            onChange={(event) => updateValue("ahref_link_color", event.target.value)}
            placeholder="var(--theme-color)"
          />
        </div>
      </section>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
}

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  helperText,
}: InputFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type="url"
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
    />
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  helperText?: string;
}

const ColorField = ({ label, value, onChange, placeholder, helperText }: ColorFieldProps) => {
  const swatchColor =
    typeof value === "string" && value.trim() !== "" ? value : "var(--theme-surface-alt)";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
        />
        <input
          type="color"
          value={swatchColor}
          onChange={(event) => onChange(event)}
          className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm cursor-pointer"
          aria-label={`${label} colour picker`}
        />
      </div>
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
};

export default BrandingThemeForm;
