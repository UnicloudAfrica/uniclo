/**
 * Strip cloud provider names (e.g. "zadara", "nobus") from labels for display.
 *
 * Provider names must NEVER be shown in the UI per project policy.
 * Use this on any region, AZ, or resource label before rendering.
 *
 * Examples:
 *   "UCA Lagos (UCA-LAGOS-U01) Zadara AZ1" → "UCA Lagos (UCA-LAGOS-U01) AZ1"
 *   "lagos-nobus-az1" → "lagos-az1"
 *   "UCA Lagos (UCA-LAGOS-N03) Nobus AZ2" → "UCA Lagos (UCA-LAGOS-N03) AZ2"
 */
export const sanitizeProviderLabel = (raw: string): string => {
  if (!raw || raw === "\u2014") return raw;
  return raw
    .replace(/\b(zadara|nobus|Zadara|Nobus|ZADARA|NOBUS)\b\s*/gi, "")
    .replace(/\(\s*(zadara|nobus)\s*\)/gi, "")
    .replace(/^[-_\s]+|[-_\s]+$/g, "")
    .replace(/[-_]{2,}/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim() || raw;
};

export default sanitizeProviderLabel;
