/**
 * Strip cloud provider names and internal codes from labels for display.
 *
 * Provider names must NEVER be shown in the UI per project policy.
 * Use this on any region, AZ, or resource label before rendering.
 *
 * With the new naming convention, API names no longer contain provider
 * prefixes (e.g. "Lagos AZ1" not "Zadara Lagos AZ1"). This function
 * still acts as a safety net for any legacy data that might slip through.
 *
 * Examples (legacy data):
 *   "UCA Lagos (UCA-LAGOS-U01) Zadara AZ1 (zadara)" → "Lagos AZ1"
 *   "lagos-nobus-az1"                                 → "lagos-az1"
 * Examples (new convention — passed through cleanly):
 *   "Lagos AZ1"                                       → "Lagos AZ1"
 *   "Nigeria"                                          → "Nigeria"
 */
export const sanitizeProviderLabel = (raw: string): string => {
  if (!raw || raw === "\u2014") return raw;
  return raw
    // Remove provider names (Zadara, Nobus, UCA, etc.) — safety net for legacy data
    .replace(/\b(zadara|nobus|uca)\b\s*/gi, "")
    // Remove parenthesized internal codes like (UCA-LAGOS-N03) or (zadara)
    .replace(/\(\s*[A-Z0-9]+-[A-Z0-9-]+\s*\)/gi, "")
    .replace(/\(\s*(zadara|nobus|uca)\s*\)/gi, "")
    .replace(/^[-_\s]+|[-_\s]+$/g, "")
    .replace(/[-_]{2,}/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim() || raw;
};

export default sanitizeProviderLabel;
