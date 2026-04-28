import React, { memo, useState } from "react";

/**
 * Avatar — user / tenant identity circle.
 *
 * Renders the image when `src` loads; falls back to a colored circle
 * with the user's initials. Initials are derived from `name` if not
 * given explicitly. Tenant-themed by default so a tenant's brand colour
 * shows through.
 *
 * A11y:
 *   - `name` is the accessible label.
 *   - When the image fails to load (404, blocked), we fall through to
 *     initials without alt-empty image clutter.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

export interface AvatarProps {
  name: string;
  /** URL to image. If it fails to load, falls back to initials. */
  src?: string | null;
  /** Override derived initials (e.g. for company logos like "UC"). */
  initials?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Optional status dot in the lower-right (e.g. online indicator). */
  status?: "online" | "busy" | "offline" | null;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const STATUS_VAR: Record<NonNullable<AvatarProps["status"]>, string> = {
  online: "rgb(var(--theme-success-500))",
  busy: "rgb(var(--theme-warning-500))",
  offline: "rgb(var(--theme-neutral-400))",
};

const deriveInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  initials,
  size = "md",
  shape = "circle",
  status,
  className = "",
}) => {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(src) && !errored;
  const text = initials ?? deriveInitials(name);
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-md";

  return (
    <span
      className={`relative inline-flex items-center justify-center font-semibold font-outfit ${SIZE_CLASS[size]} ${shapeClass} ${className}`}
      style={
        showImage
          ? undefined
          : {
              background: "var(--theme-color-10)",
              color: "var(--theme-color)",
            }
      }
      role="img"
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src as string}
          alt=""
          aria-hidden="true"
          onError={() => setErrored(true)}
          className={`h-full w-full object-cover ${shapeClass}`}
        />
      ) : (
        <span aria-hidden="true">{text}</span>
      )}
      {status && (
        <span
          aria-label={status}
          className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full ring-2 ring-white"
          style={{ background: STATUS_VAR[status] }}
        />
      )}
    </span>
  );
};

export default memo(Avatar);
