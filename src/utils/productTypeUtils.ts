const PRODUCT_TYPE_ALIASES: Record<string, string[]> = {
  compute_instance: ["compute_instance", "instance_type"],
  cross_connect: ["cross_connect"],
  os_image: ["os_image"],
  bandwidth: ["bandwidth"],
  ip: ["ip", "floating_ip"],
  volume_type: ["volume_type"],
  object_storage_configuration: [
    "object_storage_configuration",
    "object_storage.storage",
    "object_storage_storage",
    "object_storage",
  ],
};

const ALIAS_TO_CANONICAL = Object.entries(PRODUCT_TYPE_ALIASES).reduce(
  (acc, [canonical, aliases]) => {
    aliases.forEach((alias) => {
      acc[alias] = canonical;
    });
    return acc;
  },
  {} as Record<string, string>
);

const toSnakeCase = (value: string): string =>
  value
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s./\\]+/g, "_")
    .toLowerCase()
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export const normalizeProductType = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const lowerNormalized = lower.replace(/[-\s]+/g, "_");
  const lowerNoDots = lowerNormalized.replace(/\./g, "_");
  const base = trimmed.split(/[\\/]/).pop() || trimmed;
  const baseLower = base.toLowerCase();
  const baseSnake = toSnakeCase(base);
  const rawSnake = toSnakeCase(trimmed);

  const candidates = [lowerNormalized, lowerNoDots, baseSnake, baseLower, rawSnake, lower].filter(
    Boolean
  );

  for (const candidate of candidates) {
    const canonical = ALIAS_TO_CANONICAL[candidate];
    if (canonical) {
      return canonical;
    }
  }

  return baseSnake || lowerNoDots || lowerNormalized || lower;
};

export const matchesProductType = (
  rawType?: string | null,
  productType?: string | null
): boolean => {
  if (!productType) return true;
  if (!rawType) return false;
  const normalizedTarget = normalizeProductType(productType);
  const normalizedValue = normalizeProductType(rawType);
  if (!normalizedTarget || !normalizedValue) return false;
  return normalizedValue === normalizedTarget;
};
