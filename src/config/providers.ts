/**
 * Provider Capability Registry
 *
 * Central source of truth for what each cloud provider supports.
 * Components check capabilities instead of hardcoding provider names:
 *
 *   // Before: if (provider === 'zadara') { showVpcSection() }
 *   // After:  if (hasCapability(provider, 'vpc')) { showVpcSection() }
 *
 * This enables clean capability-based integration per provider.
 */

// ─── Capability Types ───────────────────────────────────────────────

export type ProviderCapability =
  | "compute"
  | "network"
  | "vpc"
  | "object-storage"
  | "block-storage"
  | "gpu"
  | "floating-ips"
  | "managed-database"
  | "keypairs"
  | "security-groups"
  | "load-balancer"
  | "snapshots"
  | "backups"
  | "identity";

export type AuthType = "keystone" | "jwt" | "api-key" | "cookie";

export type ProviderKey = "zadara" | "nobus";

export interface ProviderRegion {
  code: string;
  label: string;
  country?: string;
}

export interface ProviderConfig {
  /** Human-readable provider name */
  label: string;
  /** Short description for UI tooltips */
  description?: string;
  /** Capabilities this provider supports */
  capabilities: ProviderCapability[];
  /** Authentication mechanism */
  authType: AuthType;
  /** Available regions */
  regions: ProviderRegion[];
  /** Whether this provider is currently active/enabled */
  active: boolean;
  /** Whether this provider should appear in end-user selection UIs */
  frontendVisible?: boolean;
  /** Optional icon identifier for UI rendering */
  icon?: string;
}

// ─── Provider Registry ──────────────────────────────────────────────

export const providerRegistry: Record<ProviderKey, ProviderConfig> = {
  zadara: {
    label: "Zadara (zCompute)",
    description: "Full-stack IaaS with compute, networking, and storage",
    capabilities: [
      "compute",
      "network",
      "vpc",
      "object-storage",
      "block-storage",
      "gpu",
      "keypairs",
      "security-groups",
      "snapshots",
      "backups",
      "identity",
      "managed-database",
    ],
    authType: "keystone",
    regions: [{ code: "lagos-1", label: "Lagos 1", country: "NG" }],
    active: true,
    frontendVisible: true,
    icon: "zadara",
  },

  nobus: {
    label: "Nobus Cloud",
    description: "Compute and object storage",
    capabilities: [
      "compute",
      "object-storage",
      "floating-ips",
      "keypairs",
      "security-groups",
      "snapshots",
      "identity",
      "managed-database",
    ],
    authType: "jwt",
    regions: [{ code: "lagos", label: "Lagos", country: "NG" }],
    active: true,
    frontendVisible: false,
    icon: "nobus",
  },
};

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Check if a provider supports a specific capability.
 *
 * @example
 *   hasCapability("zadara", "vpc")          // true
 *   hasCapability("nobus", "vpc")          // false
 *   hasCapability("zadara", "compute")      // true
 */
export function hasCapability(provider: string, capability: ProviderCapability): boolean {
  const config = providerRegistry[provider as ProviderKey];
  if (!config) return false;
  return config.capabilities.includes(capability);
}

/**
 * Get all capabilities for a provider.
 *
 * @example
 *   getCapabilities("zadara")
 *   // ["compute", "network", "vpc", "object-storage", ...]
 */
export function getCapabilities(provider: string): ProviderCapability[] {
  const config = providerRegistry[provider as ProviderKey];
  return config?.capabilities ?? [];
}

/**
 * Get all providers that support a specific capability.
 *
 * @example
 *   getProvidersWithCapability("compute")
 *   // [{ key: "zadara", config: {...} }, { key: "nobus", config: {...} }]
 */
export function getProvidersWithCapability(
  capability: ProviderCapability
): Array<{ key: ProviderKey; config: ProviderConfig }> {
  return Object.entries(providerRegistry)
    .filter(([, config]) => config.capabilities.includes(capability))
    .map(([key, config]) => ({
      key: key as ProviderKey,
      config,
    }));
}

/**
 * Get the provider config for a given key.
 * Returns undefined if the provider is not registered.
 */
export function getProvider(provider: string): ProviderConfig | undefined {
  return providerRegistry[provider as ProviderKey];
}

/**
 * Get all active providers.
 */
export function getActiveProviders(): Array<{
  key: ProviderKey;
  config: ProviderConfig;
}> {
  return Object.entries(providerRegistry)
    .filter(([, config]) => config.active)
    .map(([key, config]) => ({
      key: key as ProviderKey,
      config,
    }));
}

export function isFrontendVisibleProvider(provider: string): boolean {
  const config = providerRegistry[provider as ProviderKey];
  if (!config) return false;
  return config.active && config.frontendVisible !== false;
}

export function getFrontendVisibleProvidersWithCapability(
  capability: ProviderCapability
): Array<{ key: ProviderKey; config: ProviderConfig }> {
  return Object.entries(providerRegistry)
    .filter(([, config]) => {
      return (
        config.active &&
        config.frontendVisible !== false &&
        config.capabilities.includes(capability)
      );
    })
    .map(([key, config]) => ({
      key: key as ProviderKey,
      config,
    }));
}

/**
 * Get regions for a specific provider.
 */
export function getProviderRegions(provider: string): ProviderRegion[] {
  const config = providerRegistry[provider as ProviderKey];
  return config?.regions ?? [];
}

/**
 * Check if a provider is registered and active.
 */
export function isProviderActive(provider: string): boolean {
  const config = providerRegistry[provider as ProviderKey];
  return config?.active ?? false;
}

/**
 * Get the label for a provider.
 * Returns the provider key titlecased if not registered.
 */
export function getProviderLabel(provider: string): string {
  const config = providerRegistry[provider as ProviderKey];
  if (config) return config.label;
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Get providers grouped by capability — useful for rendering
 * provider selection UI where items are grouped.
 */
export function getProvidersByCapability(): Record<
  ProviderCapability,
  Array<{ key: ProviderKey; config: ProviderConfig }>
> {
  const result = {} as Record<
    ProviderCapability,
    Array<{ key: ProviderKey; config: ProviderConfig }>
  >;

  for (const [key, config] of Object.entries(providerRegistry)) {
    for (const cap of config.capabilities) {
      if (!result[cap]) result[cap] = [];
      result[cap].push({ key: key as ProviderKey, config });
    }
  }

  return result;
}

export default providerRegistry;
