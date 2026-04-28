import React, { memo } from "react";
import { useUiMessages } from "./messages";

/**
 * SectionHeader — title (with optional count badge + leading icon) and trailing actions.
 *
 * Used above lists, tables, and grids to give consistent section semantics.
 * Heading level is configurable via `as` (defaults to h2).
 */
type HeadingLevel = "h2" | "h3" | "h4";

export interface SectionHeaderProps {
  title: React.ReactNode;
  /** Optional numeric count rendered as a muted suffix in parentheses */
  count?: number;
  /** Optional secondary description below the title */
  description?: React.ReactNode;
  /** Leading icon */
  icon?: React.ReactNode;
  /** Right-aligned actions (buttons, links, filters) */
  actions?: React.ReactNode;
  as?: HeadingLevel;
  className?: string;
  /** Smaller variant — fits inside cards and dense layouts */
  size?: "sm" | "md" | "lg";
}

const TITLE_SIZE: Record<NonNullable<SectionHeaderProps["size"]>, string> = {
  sm: "text-sm font-semibold",
  md: "text-base font-semibold",
  lg: "text-lg font-semibold",
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  description,
  icon,
  actions,
  as: HeadingTag = "h2",
  className = "",
  size = "sm",
}) => {
  const messages = useUiMessages();
  return (
    <header
      className={`flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between font-outfit ${className}`}
    >
      <div className="min-w-0 flex-1">
        <HeadingTag
          className={`flex items-center gap-2 text-[color:var(--theme-heading-color)] ${TITLE_SIZE[size]}`}
        >
          {icon && (
            <span className="shrink-0 text-[color:var(--theme-muted-color)]">{icon}</span>
          )}
          <span className="truncate">{title}</span>
          {typeof count === "number" && (
            <span
              aria-label={messages.itemsLabel(count)}
              className="font-normal text-[color:var(--theme-muted-color)]"
            >
              ({count.toLocaleString()})
            </span>
          )}
        </HeadingTag>
        {description && (
          <p className="mt-1 text-xs text-[color:var(--theme-muted-color)]">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
};

export default memo(SectionHeader);
