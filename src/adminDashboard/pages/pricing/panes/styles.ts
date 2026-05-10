/**
 * Shared Tailwind class strings for the pricing panes.
 *
 * These were duplicated verbatim across CatalogPane, IntegrationPricingPane,
 * SlimDeployPane, and PayAsYouGoPane. Six identical literals → one shared
 * constant. Pulled here (rather than into a generic `ui/` primitive) so
 * the look stays scoped to the pricing shell — if another surface wants
 * this exact density, that's the moment to promote it.
 */

export const compactInputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
