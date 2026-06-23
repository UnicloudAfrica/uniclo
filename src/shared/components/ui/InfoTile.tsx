import React from "react";

const accent = "var(--theme-color)";

/**
 * InfoTile — key/value summary tile.
 *
 * Shares the visual shell of {@link StatCard} (rounded-2xl border, dark mode,
 * accent ring-glow circle, the h-9 w-9 icon tile) but is built for KEY–VALUE
 * text rather than big numbers. The value lives in a `min-w-0` column and
 * `truncate`s so long strings (e.g. emails) ellipsize instead of overflowing.
 */
export interface InfoTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
}

const InfoTile: React.FC<InfoTileProps> = ({ label, value, hint, icon }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div
      className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.07]"
      style={{ background: accent }}
    />
    <div className="flex items-start gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div
          className={`mt-0.5 text-base font-semibold text-gray-900 dark:text-white sm:text-lg ${
            typeof value === "string" ? "truncate" : "flex flex-wrap items-center gap-1"
          }`}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
        {hint ? (
          <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">{hint}</p>
        ) : null}
      </div>
    </div>
  </div>
);

export default InfoTile;
