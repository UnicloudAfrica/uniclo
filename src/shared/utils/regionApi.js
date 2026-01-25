export const resolveRegionEndpoint = (context = "") => {
  if (context === "client") return "/business/cloud-regions";
  if (context === "tenant") return "/cloud-regions";
  if (context === "admin") return "/regions";
  return "/regions";
};

const resolveRegionValue = (region) =>
  region?.region ??
  region?.code ??
  region?.id ??
  region?.slug ??
  region?.name ??
  region?.label ??
  "";

const resolveRegionLabel = (region, fallback) =>
  region?.label ??
  region?.name ??
  region?.region ??
  region?.code ??
  region?.id ??
  region?.slug ??
  fallback;

export const normalizeRegionList = (payload) => {
  const raw =
    (Array.isArray(payload?.data?.data) && payload.data.data) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload) && payload) ||
    [];

  return raw
    .map((region) => {
      const value = resolveRegionValue(region);
      if (!value) return null;
      const label = resolveRegionLabel(region, value);
      return {
        ...region,
        region: region?.region ?? value,
        code: region?.code ?? region?.region ?? value,
        label,
      };
    })
    .filter(Boolean);
};
