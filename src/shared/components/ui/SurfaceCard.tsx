import React, { forwardRef, memo } from "react";

/**
 * SurfaceCard — the foundational brand surface primitive.
 *
 * One component covers every surface variant in the design system, all driven
 * by CSS variables (whitelabel-aware via tenant theme overrides).
 *
 * Variants map onto the brand utility classes in src/index.css:
 *   - card          → .db-surface-card    (white card with brand shadow)
 *   - soft          → .db-surface-soft    (muted alt-surface)
 *   - inset         → .db-surface-inset   (frosted blur, used inside hero)
 *   - hero          → .db-surface-hero    (light hero with radial brand tints)
 *   - signal-panel  → .db-signal-panel    (dark hero, brand → secondary gradient)
 *   - brand-hero    → .brand-hero         (full-bleed brand gradient hero)
 *
 * A11y:
 *   - `as="button"` / `as="a"` get appropriate native semantics, focus ring,
 *     and keyboard activation for free.
 *   - `as="div"` (default) with an `onClick` is auto-promoted to ARIA button
 *     semantics (role="button", tabIndex=0, Enter/Space activation) so click
 *     handlers don't leave keyboard users stranded.
 *   - `disabled` (button/anchor mode) fades the surface and blocks pointer
 *     events. Anchors get `aria-disabled` since `disabled` isn't valid HTML
 *     for `<a>`.
 */

export type SurfaceVariant = "card" | "soft" | "inset" | "hero" | "signal-panel" | "brand-hero";
export type SurfacePadding = "none" | "sm" | "md" | "lg" | "xl";
export type SurfaceRadius = "md" | "lg" | "xl" | "2xl";

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  card: "db-surface-card",
  soft: "db-surface-soft",
  inset: "db-surface-inset",
  hero: "db-surface-hero",
  "signal-panel": "db-signal-panel",
  "brand-hero": "brand-hero",
};

const PADDING_CLASS: Record<SurfacePadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

const RADIUS_CLASS: Record<SurfaceRadius, string> = {
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-[28px]",
};

type SurfaceCardOwnProps = {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  radius?: SurfaceRadius;
  /** Adds hover/focus styles. Implied when `onClick` is set. */
  interactive?: boolean;
  /** When true, lays out as a flex column with consistent gap. */
  stack?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type AsButton = SurfaceCardOwnProps & {
  as: "button";
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SurfaceCardOwnProps>;

type AsLink = SurfaceCardOwnProps & {
  as: "a";
  href: string;
  /** Anchor-equivalent of disabled: applies aria-disabled + fade. */
  disabled?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof SurfaceCardOwnProps | "href">;

type AsDiv = SurfaceCardOwnProps & {
  as?: "div" | "section" | "article" | "aside";
} & Omit<React.HTMLAttributes<HTMLDivElement>, keyof SurfaceCardOwnProps>;

export type SurfaceCardProps = AsButton | AsLink | AsDiv;

const buildInteractiveClasses = (disabled: boolean): string =>
  [
    "transition-shadow motion-safe:transition-all",
    disabled
      ? "opacity-60 cursor-not-allowed"
      : "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2",
  ].join(" ");

const SurfaceCardInner = forwardRef<HTMLElement, SurfaceCardProps>(
  function SurfaceCard(props, ref) {
    const {
      variant = "card",
      padding = "md",
      radius = "lg",
      interactive,
      stack,
      className = "",
      children,
      ...rest
    } = props;

    const asProp = (rest as { as?: string }).as ?? "div";
    const onClick = (rest as { onClick?: unknown }).onClick;
    const disabled = (rest as { disabled?: boolean }).disabled === true;

    const isInteractive =
      interactive === true ||
      onClick !== undefined ||
      asProp === "button" ||
      asProp === "a";

    const stackClasses = stack ? "flex flex-col gap-3" : "";

    const composed = [
      VARIANT_CLASS[variant],
      PADDING_CLASS[padding],
      RADIUS_CLASS[radius],
      "font-outfit",
      isInteractive ? buildInteractiveClasses(disabled) : "",
      stackClasses,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (asProp === "button") {
      const { as: _as, type, ...buttonRest } =
        rest as React.ButtonHTMLAttributes<HTMLButtonElement> & { as: "button" };
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type={type ?? "button"}
          className={composed}
          {...buttonRest}
        >
          {children}
        </button>
      );
    }

    if (asProp === "a") {
      const { as: _as, onClick: anchorClick, ...anchorRest } =
        rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; disabled?: boolean };
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={composed}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={
            disabled
              ? (e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()
              : (anchorClick as React.MouseEventHandler<HTMLAnchorElement> | undefined)
          }
          {...anchorRest}
        >
          {children}
        </a>
      );
    }

    // Default container element. If onClick is provided we promote ARIA
    // semantics so keyboard users can activate the surface.
    const Tag = asProp as "div" | "section" | "article" | "aside";
    const {
      as: _as,
      onKeyDown,
      onClick: divClick,
      role: roleProp,
      tabIndex: tabIndexProp,
      ...divRest
    } = rest as React.HTMLAttributes<HTMLDivElement> & { as?: typeof Tag };

    const promote = divClick !== undefined;
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (promote && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        (divClick as React.MouseEventHandler<HTMLDivElement>)?.(
          event as unknown as React.MouseEvent<HTMLDivElement>
        );
      }
      onKeyDown?.(event);
    };

    return React.createElement(
      Tag,
      {
        ref,
        className: composed,
        role: promote ? roleProp ?? "button" : roleProp,
        tabIndex: promote ? tabIndexProp ?? 0 : tabIndexProp,
        onKeyDown: promote || onKeyDown ? handleKeyDown : undefined,
        onClick: promote ? (divClick as React.MouseEventHandler<HTMLDivElement>) : undefined,
        ...divRest,
      },
      children
    );
  }
);

const SurfaceCard = memo(SurfaceCardInner);

export default SurfaceCard;
