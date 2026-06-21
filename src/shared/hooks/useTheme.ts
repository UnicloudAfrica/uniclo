import { useEffect } from "react";
import { create } from "zustand";

type Theme = "light" | "dark";

const STORAGE_KEY = "unicloud-theme";
const SAVED_LIGHT_PREFIX = "--light-saved-";

/**
 * Dark-mode values for every CSS variable that useBrandingTheme sets
 * as inline styles on <html>. Because inline styles beat any CSS rule,
 * we must also set them inline to override.
 */
const DARK_OVERRIDES: Record<string, string> = {
  "--theme-card-bg": "#1e293b",
  "--theme-surface-alt": "#0f172a",
  "--theme-heading-color": "#f1f5f9",
  "--theme-text-color": "#cbd5e1",
  "--theme-muted-color": "#94a3b8",
  "--theme-border-color": "rgba(148, 163, 184, 0.2)",
  "--theme-input-bg": "#1e293b",
  "--theme-input-border": "rgb(51 65 85)",
  "--theme-input-hover-border": "rgb(71 85 105)",
  "--theme-input-text": "#f1f5f9",
  "--theme-input-placeholder": "#94a3b8",
  "--theme-badge-success-bg": "rgba(34, 197, 94, 0.15)",
  "--theme-badge-success-text": "rgb(74 222 128)",
  "--theme-badge-pending-bg": "rgba(245, 158, 11, 0.15)",
  "--theme-badge-pending-text": "rgb(251 191 36)",
  "--theme-badge-failed-bg": "rgba(239, 68, 68, 0.15)",
  "--theme-badge-failed-text": "rgb(248 113 113)",
  "--theme-tag-bg": "rgba(56, 163, 235, 0.18)",
  "--theme-tag-text": "#7dd3fc",
  "--theme-focus-ring": "rgba(56, 163, 235, 0.4)",
  "--theme-on-color": "#ffffff",
  "--surface-page": "#0f172a",
  "--surface-card": "#1e293b",
  "--text-primary": "#f1f5f9",
  "--text-secondary": "#cbd5e1",
  "--text-muted": "#94a3b8",
  "--border-default": "rgba(148, 163, 184, 0.2)",
  "--theme-color-10": "rgba(56, 163, 235, 0.12)",
  "--theme-color-20": "rgba(56, 163, 235, 0.22)",
  "--theme-neutral-50": "15 23 42",
  "--theme-neutral-100": "30 41 59",
  "--theme-neutral-200": "51 65 85",
  "--theme-neutral-300": "71 85 105",
  "--theme-neutral-400": "100 116 139",
  "--theme-neutral-500": "148 163 184",
  "--theme-neutral-600": "203 213 225",
  "--theme-neutral-700": "226 232 240",
  "--theme-neutral-800": "241 245 249",
  "--theme-neutral-900": "248 250 252",
  "--theme-color-50": "15 23 42",
  "--theme-color-100": "30 41 59",
  "--theme-color-200": "51 65 85",
};

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return null;
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");

    // Save current light-mode inline values, then override with dark values
    for (const [prop, darkVal] of Object.entries(DARK_OVERRIDES)) {
      const current = root.style.getPropertyValue(prop);
      if (current) {
        root.style.setProperty(SAVED_LIGHT_PREFIX + prop, current);
      }
      root.style.setProperty(prop, darkVal);
    }
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");

    // Restore saved light-mode values
    for (const prop of Object.keys(DARK_OVERRIDES)) {
      const saved = root.style.getPropertyValue(SAVED_LIGHT_PREFIX + prop);
      if (saved) {
        root.style.setProperty(prop, saved);
        root.style.removeProperty(SAVED_LIGHT_PREFIX + prop);
      } else {
        // Remove inline override so CSS :root values take effect
        root.style.removeProperty(prop);
      }
    }
  }
}

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Single shared source of truth for the theme. Every `useTheme()` consumer
 * (admin/tenant/client headers, settings drawer, NOC map, …) reads and writes
 * this ONE store, so the whole app flips in a single update.
 *
 * Previously each consumer held its own `useState`, synced only loosely via the
 * DOM class + localStorage — they re-rendered at slightly different times, which
 * is what produced the brief light-header/dark-content mismatch on toggle.
 */
export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getStoredTheme() ?? "light",
  setTheme: (theme) => {
    applyTheme(theme);
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));

/**
 * One-time DOM bootstrap, installed by the first consumer to mount:
 *   1. apply the stored theme so the DOM matches on load, and
 *   2. install a single MutationObserver that re-applies the dark overrides if
 *      the branding system (useBrandingTheme) overwrites them while in dark mode.
 * Guarded so it runs exactly once for the app's lifetime.
 */
let bootstrapped = false;
function bootstrapThemeOnce(): void {
  if (bootstrapped || typeof document === "undefined") {
    return;
  }
  bootstrapped = true;

  applyTheme(useThemeStore.getState().theme);

  const root = document.documentElement;
  const observer = new MutationObserver(() => {
    if (useThemeStore.getState().theme !== "dark") {
      return;
    }
    const currentCardBg = root.style.getPropertyValue("--theme-card-bg");
    if (currentCardBg && currentCardBg !== DARK_OVERRIDES["--theme-card-bg"]) {
      for (const [prop, darkVal] of Object.entries(DARK_OVERRIDES)) {
        const current = root.style.getPropertyValue(prop);
        if (current && current !== darkVal) {
          root.style.setProperty(SAVED_LIGHT_PREFIX + prop, current);
        }
        root.style.setProperty(prop, darkVal);
      }
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ["style"] });
}

/**
 * useTheme — dark/light mode backed by the shared {@link useThemeStore}.
 * Public API is unchanged, so existing callers need no changes.
 */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  useEffect(() => {
    bootstrapThemeOnce();
  }, []);

  return { theme, toggleTheme, setTheme, isDark: theme === "dark" };
}
