import { useState, useEffect, useCallback } from "react";

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

function applyTheme(theme: Theme): void {
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

/**
 * useTheme — manages dark/light mode with localStorage persistence.
 *
 * Overrides inline CSS variables set by the branding system (useBrandingTheme)
 * so that dark mode actually takes effect. Saves/restores light-mode values
 * when toggling.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme() ?? "light";
  });

  // Apply on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  // Re-apply dark overrides whenever branding might re-run
  // (branding hooks run on mount and when theme data loads)
  useEffect(() => {
    if (theme !== "dark") return;

    // MutationObserver: if branding resets inline styles, re-apply dark overrides
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const currentCardBg = root.style.getPropertyValue("--theme-card-bg");
      // If branding overwrote our dark value, re-apply
      if (currentCardBg && currentCardBg !== DARK_OVERRIDES["--theme-card-bg"]) {
        // Save the new light value first
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
    return () => observer.disconnect();
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return { theme, toggleTheme, setTheme, isDark: theme === "dark" };
}
