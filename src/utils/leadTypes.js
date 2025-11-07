const FALLBACK_LEAD_TYPES = ["client", "partner"];

const valueCandidateKeys = [
  "value",
  "code",
  "key",
  "slug",
  "identifier",
  "id",
  "type",
  "name",
  "title",
];

const labelCandidateKeys = ["label", "name", "title", "display", "text"];

const normalizeLeadTypeValue = (input) => {
  if (input === undefined || input === null) {
    return "";
  }

  const raw = String(input).trim();
  if (!raw) {
    return "";
  }

  if (/^\d+$/u.test(raw)) {
    return raw;
  }

  return raw.toLowerCase().replace(/[\s-]+/g, "_");
};

const formatLeadTypeLabel = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const extractLeadTypeValue = (item) => {
  if (typeof item === "string") {
    return normalizeLeadTypeValue(item);
  }

  if (typeof item !== "object" || item === null) {
    return "";
  }

  for (const key of valueCandidateKeys) {
    if (item[key] !== undefined && item[key] !== null) {
      const value = normalizeLeadTypeValue(item[key]);
      if (value) {
        return value;
      }
    }
  }

  return "";
};

const extractLeadTypeLabel = (item, fallbackValue) => {
  if (typeof item === "string") {
    return formatLeadTypeLabel(item);
  }

  if (typeof item === "object" && item !== null) {
    for (const key of labelCandidateKeys) {
      const candidate = item[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return formatLeadTypeLabel(fallbackValue);
};

const resolveRawLeadTypeList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const sources = [
    payload?.data,
    payload?.data?.data,
    payload?.data?.lead_types,
    payload?.lead_types,
    payload?.message,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source;
    }
  }

  return [];
};

export const buildLeadTypeOptions = (
  payload,
  fallbackValues = FALLBACK_LEAD_TYPES,
) => {
  const rawList = resolveRawLeadTypeList(payload);
  const options = new Map();

  const addOption = (entry, labelSource) => {
    const value = extractLeadTypeValue(entry);
    if (!value) {
      return;
    }

    const label = extractLeadTypeLabel(
      labelSource ?? entry,
      value,
    );

    if (!options.has(value)) {
      options.set(value, { value, label });
    }
  };

  rawList.forEach((entry) => addOption(entry));
  fallbackValues.forEach((fallback) => addOption(fallback, fallback));

  return Array.from(options.values());
};

export const ensureLeadTypeValue = (value, options) => {
  if (!value) {
    return "";
  }

  const normalized = normalizeLeadTypeValue(value);
  const match = options.find((option) => option.value === normalized);
  return match ? normalized : "";
};

export { FALLBACK_LEAD_TYPES, formatLeadTypeLabel };
