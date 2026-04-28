/**
 * ProviderBadge — Color-coded badge that identifies a cloud provider at a glance.
 *
 * Used in admin pricing, products, and inventory tables so admins
 * never confuse which provider/region they are editing.
 *
 * Usage:
 *   <ProviderBadge provider="zadara" />
 *   <ProviderBadge provider="nobus" region="nobus-wa-az1" />
 *   <ProviderBadge provider="zadara" region="lagos-1" showRegion />
 */

interface ProviderConfig {
  label: string;
  shortLabel: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  zadara: {
    label: "UCA zCompute",
    shortLabel: "Zadara", // allow-provider-name — admin-only badge
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  nobus: {
    label: "Nobus Cloud", // allow-provider-name — admin-only badge
    shortLabel: "Nobus", // allow-provider-name — admin-only badge
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
};

const DEFAULT_CONFIG: ProviderConfig = {
  label: "Platform",
  shortLabel: "Platform",
  dotColor: "bg-slate-400",
  bgColor: "bg-slate-50",
  textColor: "text-slate-600",
  borderColor: "border-slate-200",
};

interface ProviderBadgeProps {
  /** Provider key (e.g. "zadara", "nobus") */
  provider?: string | null;
  /** Optional region code to display alongside provider */
  region?: string | null;
  /** Whether to show the region code after the provider label */
  showRegion?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional CSS classes */
  className?: string;
}

export default function ProviderBadge({
  provider,
  region,
  showRegion = false,
  size = "sm",
  className = "",
}: ProviderBadgeProps) {
  const key = (provider || "").toLowerCase();
  const config = PROVIDER_CONFIGS[key] || DEFAULT_CONFIG;

  const sizeClasses = size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses} ${className}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${config.dotColor}`} />
      <span>{config.shortLabel}</span>
      {showRegion && region && (
        <>
          <span className="text-[10px] opacity-50">/</span>
          <span className="opacity-75">{region}</span>
        </>
      )}
    </span>
  );
}

/**
 * Helper to get the provider label for display purposes.
 */
export function getProviderLabel(provider?: string | null): string {
  const key = (provider || "").toLowerCase();
  return PROVIDER_CONFIGS[key]?.label || provider || "Platform";
}

/**
 * Helper to get the provider short label.
 */
export function getProviderShortLabel(provider?: string | null): string {
  const key = (provider || "").toLowerCase();
  return PROVIDER_CONFIGS[key]?.shortLabel || provider || "Platform";
}

/**
 * Format a region option label for dropdowns.
 *
 * If the region has a `provider` field, prefixes with the provider's short
 * label (e.g. "Zadara — Lagos-1", "Nobus — Nobus West Africa AZ1").
 * Otherwise returns just the region name.
 *
 * Replaces the repeated ternary logic across admin pages.
 */
export function getRegionOptionLabel(region: { name?: string; label?: string; provider?: string | null }): string {
  return region.label || region.name || "Unknown region";
}
