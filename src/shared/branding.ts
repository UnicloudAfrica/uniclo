/**
 * Branding source of truth — UniCloud-facing product names.
 *
 * The Resilience product (migrations + replication + DR + bucket sync +
 * automation) is powered by AnyCloudFlow under the hood, but customers
 * inside UniCloud only ever see the `RESILIENCE_PRODUCT` brand. AcF the
 * standalone product still exists for direct customers — it just never
 * surfaces in the UniCloud UI.
 *
 * To re-skin the white-label for a sub-licensee (Orange / MTN / partners),
 * point VITE_RESILIENCE_PRODUCT_NAME at their preferred brand at build time
 * and every customer-facing string flips with no code change.
 *
 * IMPORTANT: this only governs *display strings*. The internal integration
 * slug `"anycloudflow"` is a database key and MUST NOT be rewritten — the
 * IntegrationManager / AnyCloudFlowDriver / webhook handlers all key off it.
 */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const BRANDING = {
  /**
   * Customer-facing product name for the resilience surface.
   * Default: "Orbit". Override via env at build time.
   */
  resilienceProduct: env.VITE_RESILIENCE_PRODUCT_NAME ?? "Orbit",

  /**
   * URL-safe slug used in customer-visible routes (`/orbit/calculator`).
   * Internal API integration_key stays "anycloudflow" — see file header.
   */
  resilienceSlug: env.VITE_RESILIENCE_PRODUCT_SLUG ?? "orbit",
} as const;

/**
 * Convenience accessor — pulls the resilience brand for inline string
 * concatenation. Use in JSX as `{RESILIENCE}` for short forms.
 */
export const RESILIENCE = BRANDING.resilienceProduct;

/**
 * Backend integration_key — DO NOT rewrite for branding purposes.
 * Exists as a named constant so callers can pass it explicitly instead of
 * scattering the magic string across the codebase.
 */
export const RESILIENCE_INTEGRATION_KEY = "anycloudflow" as const;
