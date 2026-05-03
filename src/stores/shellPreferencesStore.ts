/**
 * Shell preferences store — controls the dashboard chrome's appearance.
 *
 * Three independent dimensions:
 *
 * 1. **Nav variant** — pinned / twotier / rail / palette. Each renders the
 *    same menu data through different sidebar geometry. Persists across
 *    sessions so a tenant who likes the icon-only rail keeps it.
 *
 * 2. **Density** — comfortable / compact. Compact reduces page padding
 *    so monitoring/NOC users see more rows without scrolling.
 *
 * 3. **Tenant theme** — flips the brand variables on `<html>` via
 *    `data-tenant`. Used by superadmin demos and by tenants that want a
 *    quick preview before settling on a custom palette.
 *
 * Each setter also writes the matching attribute (`data-variant`,
 * `data-density`, `data-tenant`) onto `document.documentElement` so the
 * CSS in `index.css` can react without React knowing the DOM root.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NavVariant = "pinned" | "twotier" | "rail" | "palette";
export type ShellDensity = "comfortable" | "compact";
export type TenantTheme = "default" | "emerald" | "indigo" | "sunset";

interface ShellPreferencesState {
  navVariant: NavVariant;
  density: ShellDensity;
  tenant: TenantTheme;
  /** Slide-in settings drawer open state. Not persisted. */
  settingsOpen: boolean;

  setNavVariant: (variant: NavVariant) => void;
  setDensity: (density: ShellDensity) => void;
  setTenant: (tenant: TenantTheme) => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
}

/**
 * Apply the relevant `data-*` attribute to `<html>` so CSS picks it up.
 * Called on every setter and on hydration.
 */
const applyAttribute = (key: "variant" | "density" | "tenant", value: string) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (key === "tenant" && value === "default") {
    root.removeAttribute("data-tenant");
    return;
  }
  root.setAttribute(`data-${key}`, value);
};

/**
 * The brand-related CSS variables that `useApplyBrandingTheme` writes as
 * INLINE styles on `<html>`. Because inline styles always beat stylesheet
 * rules, swapping a tenant theme via a `[data-tenant=…]` CSS rule alone
 * never takes effect — the branding hook's inline values win.
 *
 * Workaround: write our tenant overrides as inline styles too, and
 * snapshot the originals on first apply so picking "Default" restores
 * them perfectly.
 */
/**
 * Every brand-related CSS variable that needs to follow the tenant.
 *
 * Includes the full Tailwind colour scale (`--theme-color-300` through
 * `--theme-color-900`) because Tailwind classes like `bg-primary-500`,
 * `bg-blue-500`, `text-primary-700` are aliased in `tailwind.config.js`
 * to `rgb(var(--theme-color-{shade}) / <alpha-value>)`. Without these,
 * a tenant override only reaches inline-styled elements and `--theme-color`
 * users — Tailwind classes stay on the original brand.
 */
const TENANT_THEME_VARS = [
  "--theme-color",
  "--secondary-color",
  "--theme-color-rgb",
  "--secondary-color-rgb",
  "--theme-color-10",
  "--theme-color-20",
  "--secondary-color-10",
  "--secondary-color-20",
  "--theme-color-300",
  "--theme-color-400",
  "--theme-color-500",
  "--theme-color-600",
  "--theme-color-700",
  "--theme-color-800",
  "--theme-color-900",
  "--secondary-color-300",
  "--secondary-color-400",
  "--secondary-color-500",
  "--secondary-color-600",
  "--secondary-color-700",
  "--theme-tag-bg",
  "--theme-tag-text",
  "--theme-focus-ring",
  "--theme-border-color",
  "--theme-hero-start",
  "--theme-hero-end",
  "--theme-button-primary-bg",
  "--theme-button-secondary-bg",
] as const;

type TenantPaletteKey = "emerald" | "indigo" | "sunset";

/**
 * Pre-computed shade scales (300–900) for each tenant.
 *
 * Mixed with white at 0.56/0.32 for lighter shades (300/400) and with
 * black at 0.18/0.32/0.46/0.6 for darker shades (600–900) — matching
 * the formula `useApplyBrandingTheme` uses so visual feel is consistent.
 */
const TENANT_PALETTES: Record<TenantPaletteKey, Record<string, string>> = {
  emerald: {
    "--theme-color": "#10b981",
    "--secondary-color": "#34d399",
    "--theme-color-rgb": "16 185 129",
    "--secondary-color-rgb": "52 211 153",
    "--theme-color-10": "rgba(16, 185, 129, 0.12)",
    "--theme-color-20": "rgba(16, 185, 129, 0.22)",
    "--secondary-color-10": "rgba(52, 211, 153, 0.12)",
    "--secondary-color-20": "rgba(52, 211, 153, 0.22)",
    "--theme-color-300": "150 224 200",
    "--theme-color-400": "92 207 169",
    "--theme-color-500": "16 185 129",
    "--theme-color-600": "13 152 106",
    "--theme-color-700": "11 126 88",
    "--theme-color-800": "9 100 70",
    "--theme-color-900": "6 74 52",
    "--secondary-color-300": "171 235 199",
    "--secondary-color-400": "117 222 178",
    "--secondary-color-500": "52 211 153",
    "--secondary-color-600": "43 173 125",
    "--secondary-color-700": "35 144 104",
    "--theme-tag-bg": "rgba(16, 185, 129, 0.16)",
    "--theme-tag-text": "#10b981",
    "--theme-focus-ring": "rgba(16, 185, 129, 0.34)",
    "--theme-border-color": "rgba(52, 211, 153, 0.2)",
    "--theme-hero-start": "#10b981",
    "--theme-hero-end": "#34d399",
    "--theme-button-primary-bg": "#10b981",
    "--theme-button-secondary-bg": "#34d399",
  },
  indigo: {
    "--theme-color": "#4f46e5",
    "--secondary-color": "#a78bfa",
    "--theme-color-rgb": "79 70 229",
    "--secondary-color-rgb": "167 139 250",
    "--theme-color-10": "rgba(79, 70, 229, 0.12)",
    "--theme-color-20": "rgba(79, 70, 229, 0.22)",
    "--secondary-color-10": "rgba(167, 139, 250, 0.12)",
    "--secondary-color-20": "rgba(167, 139, 250, 0.22)",
    "--theme-color-300": "178 174 244",
    "--theme-color-400": "135 129 237",
    "--theme-color-500": "79 70 229",
    "--theme-color-600": "65 57 188",
    "--theme-color-700": "54 48 156",
    "--theme-color-800": "43 38 124",
    "--theme-color-900": "32 28 92",
    "--secondary-color-300": "215 204 252",
    "--secondary-color-400": "189 172 251",
    "--secondary-color-500": "167 139 250",
    "--secondary-color-600": "137 114 205",
    "--secondary-color-700": "114 95 170",
    "--theme-tag-bg": "rgba(79, 70, 229, 0.16)",
    "--theme-tag-text": "#4f46e5",
    "--theme-focus-ring": "rgba(79, 70, 229, 0.34)",
    "--theme-border-color": "rgba(167, 139, 250, 0.2)",
    "--theme-hero-start": "#4f46e5",
    "--theme-hero-end": "#a78bfa",
    "--theme-button-primary-bg": "#4f46e5",
    "--theme-button-secondary-bg": "#a78bfa",
  },
  sunset: {
    "--theme-color": "#ea580c",
    "--secondary-color": "#f59e0b",
    "--theme-color-rgb": "234 88 12",
    "--secondary-color-rgb": "245 158 11",
    "--theme-color-10": "rgba(234, 88, 12, 0.12)",
    "--theme-color-20": "rgba(234, 88, 12, 0.22)",
    "--secondary-color-10": "rgba(245, 158, 11, 0.12)",
    "--secondary-color-20": "rgba(245, 158, 11, 0.22)",
    "--theme-color-300": "246 182 148",
    "--theme-color-400": "241 141 90",
    "--theme-color-500": "234 88 12",
    "--theme-color-600": "192 72 10",
    "--theme-color-700": "159 60 8",
    "--theme-color-800": "126 48 6",
    "--theme-color-900": "94 35 5",
    "--secondary-color-300": "251 212 142",
    "--secondary-color-400": "248 185 76",
    "--secondary-color-500": "245 158 11",
    "--secondary-color-600": "201 130 9",
    "--secondary-color-700": "167 108 7",
    "--theme-tag-bg": "rgba(234, 88, 12, 0.16)",
    "--theme-tag-text": "#ea580c",
    "--theme-focus-ring": "rgba(234, 88, 12, 0.34)",
    "--theme-border-color": "rgba(245, 158, 11, 0.2)",
    "--theme-hero-start": "#ea580c",
    "--theme-hero-end": "#f59e0b",
    "--theme-button-primary-bg": "#ea580c",
    "--theme-button-secondary-bg": "#f59e0b",
  },
};

/**
 * Snapshot of the inline values that were on `<html>` BEFORE any tenant
 * override was applied — typically what `useApplyBrandingTheme` wrote.
 * Captured lazily on the first non-default `setTenant` call so we know
 * exactly what to restore when the user picks "Default" again.
 *
 * `null` value means the original was not an inline style at all (the
 * variable came from the stylesheet), so restoration removes the inline
 * override entirely.
 */
let originalThemeSnapshot: Record<string, string | null> | null = null;

const captureSnapshot = () => {
  if (originalThemeSnapshot || typeof document === "undefined") return;
  const root = document.documentElement;
  const inline = root.style;
  originalThemeSnapshot = {};
  for (const name of TENANT_THEME_VARS) {
    const value = inline.getPropertyValue(name);
    originalThemeSnapshot[name] = value ? value.trim() : null;
  }
};

const applyTenantPalette = (tenant: TenantTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (tenant === "default") {
    if (!originalThemeSnapshot) return; // Nothing was overridden yet.
    for (const name of TENANT_THEME_VARS) {
      const original = originalThemeSnapshot[name];
      if (original) {
        root.style.setProperty(name, original);
      } else {
        root.style.removeProperty(name);
      }
    }
    return;
  }

  // First application captures whatever the branding hook had written.
  captureSnapshot();
  const palette = TENANT_PALETTES[tenant];
  for (const [name, value] of Object.entries(palette)) {
    root.style.setProperty(name, value);
  }
};

const useShellPreferencesStore = create<ShellPreferencesState>()(
  persist(
    (set, get) => ({
      navVariant: "pinned",
      density: "comfortable",
      tenant: "default",
      settingsOpen: false,

      setNavVariant: (variant) => {
        applyAttribute("variant", variant);
        set({ navVariant: variant });
      },
      setDensity: (density) => {
        applyAttribute("density", density);
        set({ density });
      },
      setTenant: (tenant) => {
        applyAttribute("tenant", tenant);
        applyTenantPalette(tenant);
        set({ tenant });
      },
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      toggleSettings: () => set({ settingsOpen: !get().settingsOpen }),
    }),
    {
      name: "shell-preferences",
      partialize: (state): Pick<ShellPreferencesState, "navVariant" | "density" | "tenant"> => ({
        navVariant: state.navVariant,
        density: state.density,
        tenant: state.tenant,
      }),
      onRehydrateStorage: () => (state) => {
        // After zustand restores from localStorage, replay the attributes
        // onto <html> so the CSS picks up the saved choices on hard reload.
        if (!state) return;
        applyAttribute("variant", state.navVariant);
        applyAttribute("density", state.density);
        applyAttribute("tenant", state.tenant);
        // Don't apply the palette here — `useTenantThemeEnforcer` (mounted
        // at the app root) handles re-assertion AFTER the branding hook
        // runs, which is the only race-safe moment.
      },
    },
  ),
);

export default useShellPreferencesStore;

/**
 * Public helper for components / hooks that need to re-assert the
 * current tenant palette after some other code rewrote `<html>` style
 * (e.g. `useApplyBrandingTheme` finishing its first paint).
 */
export const reapplyTenantPalette = (): void => {
  const tenant = useShellPreferencesStore.getState().tenant;
  applyTenantPalette(tenant);
};
