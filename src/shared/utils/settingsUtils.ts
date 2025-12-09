import { FieldConfig } from "../types/settings";

export const flattenSettings = (settings: Record<string, any> = {}) => {
  const flattened: Record<string, any> = {};

  Object.entries(settings).forEach(([category, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([key, inner]) => {
        flattened[`\${category}.\${key}`] = inner;
      });
    } else {
      flattened[category] = value;
    }
  });

  return flattened;
};

export const normalizeFieldValue = (field: FieldConfig, raw: any) => {
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

export const transformValueForSave = (field: FieldConfig, raw: any) => {
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

export const buildSavePayload = (fields: FieldConfig[], formState: Record<string, any>) => {
  return fields
    .filter((field) => field.stateKey && !field.readOnly && field.type !== "description")
    .map((field) => {
      const [category, key] = field.stateKey!.split(".");
      if (!category || !key) return null;
      const currentValue = formState[field.stateKey!];
      if (currentValue === undefined && !field.includeWhenUndefined) {
        return null;
      }
      return {
        category,
        key,
        value: transformValueForSave(field, currentValue !== undefined ? currentValue : null),
      };
    })
    .filter(Boolean);
};

export const normalizeTwoFactorSetup = (response: any) => {
  const data = response?.data ?? response?.message ?? response ?? {};
  const rawQrCode = data.qrCode ?? data.qr_code ?? null;
  const qrCodeSvg =
    data.qrCodeSvg ||
    data.qr_code_svg ||
    data.qr_svg ||
    (typeof rawQrCode === "string" && rawQrCode.startsWith("<svg") ? rawQrCode : null) ||
    null;
  const qrCodeUrl =
    data.qrCodeUrl ||
    data.qr_code_url ||
    data.qr_url ||
    (typeof rawQrCode === "string" && !rawQrCode.startsWith("<svg") ? rawQrCode : null) ||
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

export const flattenObjectToSettingsArray = (settingsObject: Record<string, any> = {}) => {
  const payload: any[] = [];
  Object.entries(settingsObject).forEach(([category, values]) => {
    if (values && typeof values === "object" && !Array.isArray(values)) {
      Object.entries(values).forEach(([key, value]) => {
        payload.push({ category, key, value });
      });
    }
  });
  return payload;
};
