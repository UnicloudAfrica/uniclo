const isFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const formatCurrencyValue = (value, currency = "USD") => {
  const numeric = isFiniteNumber(value);
  const code = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (error) {
    return `${code} ${numeric.toFixed(2)}`;
  }
};

const ensureEntry = (map, region) => {
  if (!region) return null;
  if (!map[region]) {
    map[region] = { total: 0, count: 0 };
  }
  return map[region];
};

export const deriveFastTrackBreakdown = ({
  summary,
  configurations = [],
  pricingRequests = [],
  pricingLines = [],
  instances = [],
  currency = "USD",
  lineTotals,
} = {}) => {
  if (!summary) {
    return null;
  }

  const eligibleRegions = Array.isArray(summary.eligible_regions)
    ? summary.eligible_regions
    : [];
  const ineligibleRegions = Array.isArray(summary.ineligible_regions)
    ? summary.ineligible_regions
    : [];

  const totalsByRegion = {};

  pricingRequests.forEach((request, index) => {
    const region = configurations[index]?.region;
    if (!region) return;
    const entry = ensureEntry(totalsByRegion, region);
    if (!entry) return;
    entry.total += isFiniteNumber(request?.total);
    const count = Number(configurations[index]?.count || 0);
    if (Number.isFinite(count) && count > 0) {
      entry.count += count;
    }
  });

  pricingLines.forEach((line) => {
    const region = line?.meta?.region || line?.region;
    if (!region) return;
    const entry = ensureEntry(totalsByRegion, region);
    if (!entry) return;
    entry.total += isFiniteNumber(line?.total);
  });

  instances.forEach((instance) => {
    const region = instance?.region;
    if (!region) return;
    const entry = ensureEntry(totalsByRegion, region);
    if (!entry) return;
    entry.count += 1;
  });

  const aggregate = (regions, accessor) =>
    regions.reduce(
      (acc, regionEntry) => {
        const region = accessor(regionEntry);
        const stats = region ? totalsByRegion[region] : null;
        if (stats) {
          acc.total += stats.total;
          acc.count += stats.count;
        }
        return acc;
      },
      { total: 0, count: 0 }
    );

  const fastTrack = aggregate(eligibleRegions, (region) => region);
  const pay = aggregate(ineligibleRegions, (entry) => entry?.region);

  return {
    eligibleRegions,
    ineligibleRegions,
    fastTrack,
    pay,
    currency: summary.currency || currency,
  };
};

export default {
  deriveFastTrackBreakdown,
  formatCurrencyValue,
};
