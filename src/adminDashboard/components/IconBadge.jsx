import React from "react";
import { resolveIcon } from "./iconCatalog";

const TONE_STYLES = {
  primary: {
    wrapper: "bg-sky-50 text-sky-600 ring-sky-100",
    icon: "text-sky-600",
  },
  indigo: {
    wrapper: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    icon: "text-indigo-600",
  },
  emerald: {
    wrapper: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    icon: "text-emerald-600",
  },
  slate: {
    wrapper: "bg-slate-100 text-slate-600 ring-slate-200",
    icon: "text-slate-600",
  },
  warning: {
    wrapper: "bg-amber-50 text-amber-600 ring-amber-100",
    icon: "text-amber-600",
  },
};

/**
 * @typedef {Object} IconBadgeProps
 * @property {string} [iconKey]
 * @property {any} [icon]
 * @property {string} [tone]
 * @property {string} [className]
 * @property {string} [iconClassName]
 * @property {string} [size]
 */

/**
 * @param {IconBadgeProps} props
 */
const IconBadge = ({
  iconKey = null,
  icon: IconProp = null,
  tone = "primary",
  className = "",
  iconClassName = "",
  size = "md",
}) => {
  const IconComponent = IconProp || resolveIcon(iconKey);

  if (!IconComponent) {
    return null;
  }

  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.primary;

  const sizeClass =
    size === "sm"
      ? "h-8 w-8 rounded-lg"
      : size === "lg"
        ? "h-12 w-12 rounded-xl"
        : "h-9 w-9 rounded-xl";

  const wrapperClass = [
    "inline-flex items-center justify-center ring-1 ring-offset-0 transition",
    toneClass.wrapper,
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]";

  const iconClasses = [iconSizeClass, toneClass.icon, iconClassName].filter(Boolean).join(" ");

  return (
    <span className={wrapperClass}>
      <IconComponent className={iconClasses} />
    </span>
  );
};

export default IconBadge;
