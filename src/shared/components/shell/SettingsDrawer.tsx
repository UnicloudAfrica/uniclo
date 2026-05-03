import React, { useEffect } from "react";
import {
  X,
  Sun,
  Moon,
  PanelLeft,
  Columns2,
  Sidebar as SidebarIcon,
  Square,
  Maximize2,
  Minimize2,
} from "lucide-react";
import useShellPreferencesStore, {
  type NavVariant,
  type ShellDensity,
} from "@/stores/shellPreferencesStore";
import { useTheme } from "@/shared/hooks/useTheme";
import ToastUtils from "@/utils/toastUtil";

/**
 * Slide-in settings drawer pinned to the right edge.
 *
 * Surfaces the three shell-level preferences that don't belong in the
 * account settings page because they're personal display choices, not
 * account state:
 *
 *  - **Navigation variant** — pinned / two-tier / rail / palette
 *  - **Density** — comfortable / compact
 *  - **Dark mode** — light / dark
 *
 * Triggered by the gear icon in the headbar or by `⌘,` (matching macOS
 * convention for application preferences).
 *
 * Closes on backdrop click, Escape, or the X button.
 */

interface NavOption {
  value: NavVariant;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}

const NAV_OPTIONS: NavOption[] = [
  {
    value: "pinned",
    label: "Pinned",
    description: "Full-width sidebar with labels — best for first-time users.",
    icon: PanelLeft,
  },
  {
    value: "twotier",
    label: "Two-tier",
    description: "Icon column plus a labelled column. Quick scanning.",
    icon: Columns2,
  },
  {
    value: "rail",
    label: "Rail",
    description: "Icon-only rail with hover labels. Maximises page width.",
    icon: SidebarIcon,
  },
  {
    value: "palette",
    label: "Palette",
    description: "Minimal 72px rail. Pair with ⌘K for keyboard-driven nav.",
    icon: Square,
  },
];

const DENSITY_OPTIONS: { value: ShellDensity; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "comfortable", label: "Comfortable", icon: Maximize2 },
  { value: "compact", label: "Compact", icon: Minimize2 },
];

const SettingsDrawer: React.FC = () => {
  const {
    navVariant,
    density,
    settingsOpen,
    setNavVariant,
    setDensity,
    setSettingsOpen,
  } = useShellPreferencesStore();
  const { isDark, toggleTheme } = useTheme();

  // Close on Escape.
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, setSettingsOpen]);

  const handleNavChange = (value: NavVariant) => {
    setNavVariant(value);
    const label = NAV_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
    ToastUtils.info(`Navigation: ${label}`);
  };

  const handleDensityChange = (value: ShellDensity) => {
    setDensity(value);
    ToastUtils.info(`Density: ${value === "compact" ? "Compact" : "Comfortable"}`);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    ToastUtils.info(`Mode: ${isDark ? "Light" : "Dark"}`);
  };

  if (!settingsOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Display settings"
      className="fixed inset-0 z-[2000]"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Panel */}
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l shadow-2xl"
        style={{
          background: "var(--theme-card-bg)",
          borderColor: "var(--theme-border-color)",
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <div>
            <h2 className="t-h3 m-0">Display</h2>
            <p className="t-xs mt-0.5">Personal preferences for this device.</p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded-md p-1 transition hover:bg-black/5"
            style={{ color: "var(--theme-muted-color)" }}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Navigation variant */}
          <section className="mb-6">
            <div className="t-eyebrow mb-3">Navigation</div>
            <div className="grid grid-cols-2 gap-2">
              {NAV_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = navVariant === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleNavChange(opt.value)}
                    className="flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition"
                    style={{
                      borderColor: active ? "var(--theme-color)" : "var(--theme-border-color)",
                      background: active ? "var(--theme-color-10)" : "var(--theme-card-bg)",
                      boxShadow: active ? "0 0 0 1px var(--theme-color)" : "none",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: active
                          ? "var(--theme-color)"
                          : "rgb(var(--theme-neutral-100))",
                        color: active ? "var(--theme-on-color)" : "var(--theme-muted-color)",
                      }}
                    >
                      <Icon size={16} />
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--theme-heading-color)" }}
                    >
                      {opt.label}
                    </span>
                    <span className="t-xs leading-snug">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Density */}
          <section className="mb-6">
            <div className="t-eyebrow mb-3">Density</div>
            <div
              className="inline-flex rounded-full border p-0.5"
              style={{
                borderColor: "var(--theme-border-color)",
                background: "rgb(var(--theme-neutral-100))",
              }}
            >
              {DENSITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = density === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDensityChange(opt.value)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition"
                    style={{
                      background: active ? "var(--theme-card-bg)" : "transparent",
                      color: active ? "var(--theme-heading-color)" : "var(--theme-muted-color)",
                      boxShadow: active ? "var(--shadow-xs)" : "none",
                    }}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="t-xs mt-2">
              Compact tightens vertical spacing on data-heavy pages (NOC, billing).
            </p>
          </section>

          {/* Mode */}
          <section className="mb-6">
            <div className="t-eyebrow mb-3">Mode</div>
            <button
              type="button"
              onClick={handleThemeToggle}
              className="flex w-full items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm"
              style={{
                borderColor: "var(--theme-border-color)",
                background: "var(--theme-card-bg)",
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    background: isDark
                      ? "rgba(251, 191, 36, 0.16)"
                      : "rgb(var(--theme-neutral-100))",
                    color: isDark ? "#fbbf24" : "var(--theme-muted-color)",
                  }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                <span className="flex flex-col items-start">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--theme-heading-color)" }}
                  >
                    {isDark ? "Dark" : "Light"} mode
                  </span>
                  <span className="t-xs">
                    {isDark ? "Tap to switch to light." : "Tap to switch to dark."}
                  </span>
                </span>
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--theme-muted-color)" }}
              >
                Toggle
              </span>
            </button>
          </section>
        </div>

        {/* Footer */}
        <footer
          className="border-t px-5 py-3"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <p className="t-xs">
            Press{" "}
            <kbd
              className="rounded border bg-[--theme-surface-alt] px-1.5 py-0.5 font-mono text-[10px]"
              style={{ borderColor: "var(--theme-border-color)" }}
            >
              ⌘ ,
            </kbd>{" "}
            to reopen this panel anywhere in the app.
          </p>
        </footer>
      </aside>
    </div>
  );
};

export default SettingsDrawer;
