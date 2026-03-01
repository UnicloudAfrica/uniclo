export const FALLBACK_LEAD_TYPES = ["client", "partner"] as const;

export interface LeadTypeOption {
  value: string;
  label: string;
}

type LeadTypeInput = string | Record<string, unknown>;

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

const normalizeLeadTypeValue = (input: unknown): string => {
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

const formatLeadTypeLabel = (value: unknown): string => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const extractLeadTypeValue = (item: LeadTypeInput): string => {
  if (typeof item === "string") {
    return normalizeLeadTypeValue(item);
  }

  const record = item;

  for (const key of valueCandidateKeys) {
    if (record[key] !== undefined && record[key] !== null) {
      const value = normalizeLeadTypeValue(record[key]);
      if (value) {
        return value;
      }
    }
  }

  return "";
};

const extractLeadTypeLabel = (item: LeadTypeInput, fallbackValue: string): string => {
  if (typeof item === "string") {
    return formatLeadTypeLabel(item);
  }

  for (const key of labelCandidateKeys) {
    const candidate = item[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return formatLeadTypeLabel(fallbackValue);
};

const resolveRawLeadTypeList = (payload: unknown): LeadTypeInput[] => {
  if (Array.isArray(payload)) {
    return payload as LeadTypeInput[];
  }

  const payloadRecord =
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : null;

  if (!payloadRecord) {
    return [];
  }

  const sources = [
    payloadRecord.data,
    (payloadRecord.data as Record<string, unknown> | undefined)?.data,
    (payloadRecord.data as Record<string, unknown> | undefined)?.lead_types,
    payloadRecord.lead_types,
    payloadRecord.message,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source as LeadTypeInput[];
    }
  }

  return [];
};

export const buildLeadTypeOptions = (
  payload: unknown,
  fallbackValues: string[] = [...FALLBACK_LEAD_TYPES]
): LeadTypeOption[] => {
  const rawList = resolveRawLeadTypeList(payload);
  const options = new Map<string, LeadTypeOption>();

  const addOption = (entry: LeadTypeInput, labelSource?: LeadTypeInput) => {
    const value = extractLeadTypeValue(entry);
    if (!value) {
      return;
    }

    const label = extractLeadTypeLabel(labelSource ?? entry, value);

    if (!options.has(value)) {
      options.set(value, { value, label });
    }
  };

  rawList.forEach((entry) => addOption(entry));
  fallbackValues.forEach((fallback) => addOption(fallback, fallback));

  return Array.from(options.values());
};

export const ensureLeadTypeValue = (value: string, options: LeadTypeOption[]): string => {
  if (!value) {
    return "";
  }

  const normalized = normalizeLeadTypeValue(value);
  const match = options.find((option) => option.value === normalized);
  return match ? normalized : "";
};

export { formatLeadTypeLabel };
