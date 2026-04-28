import React, { memo } from "react";

/**
 * DescriptionList — semantic key/value pairs.
 *
 * Renders a `<dl>` with `<dt>` / `<dd>` for each item. Layout modes:
 *   - `inline`   (default) — terms float left, values right (responsive)
 *   - `stacked`  — term above, value below
 *   - `grid`     — two-column responsive grid (good for cards)
 *
 * Use this for "Uptime: 7d 3h" / "Access: 10.0.0.5" lists where the
 * relationship between key and value matters semantically.
 */

export interface DescriptionListItem {
  /** Visible term */
  term: React.ReactNode;
  /** Description / value */
  description: React.ReactNode;
  /** Override key (otherwise term coerced to string) */
  key?: string;
  /** Hide term visually but keep it in the DOM for screen readers */
  visuallyHiddenTerm?: boolean;
}

export interface DescriptionListProps {
  items: DescriptionListItem[];
  layout?: "inline" | "stacked" | "grid";
  className?: string;
  /** Size of the term/description text */
  size?: "xs" | "sm" | "md";
}

const SIZE_CLASS: Record<NonNullable<DescriptionListProps["size"]>, string> = {
  xs: "text-[11px]",
  sm: "text-xs",
  md: "text-sm",
};

const DescriptionList: React.FC<DescriptionListProps> = ({
  items,
  layout = "inline",
  className = "",
  size = "xs",
}) => {
  const sizeClass = SIZE_CLASS[size];

  if (layout === "grid") {
    return (
      <dl className={`grid grid-cols-2 gap-x-4 gap-y-1.5 font-outfit ${sizeClass} ${className}`}>
        {items.map((item, idx) => (
          <React.Fragment key={item.key ?? idx}>
            <dt
              className={`text-gray-500 ${item.visuallyHiddenTerm ? "sr-only" : ""}`}
            >
              {item.term}
            </dt>
            <dd className="text-gray-800 font-medium text-right">
              {item.description}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    );
  }

  if (layout === "stacked") {
    return (
      <dl className={`space-y-2 font-outfit ${sizeClass} ${className}`}>
        {items.map((item, idx) => (
          <div key={item.key ?? idx}>
            <dt
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 ${
                item.visuallyHiddenTerm ? "sr-only" : ""
              }`}
            >
              {item.term}
            </dt>
            <dd className="mt-0.5 text-gray-800">{item.description}</dd>
          </div>
        ))}
      </dl>
    );
  }

  // inline
  return (
    <dl className={`space-y-1.5 font-outfit ${sizeClass} ${className}`}>
      {items.map((item, idx) => (
        <div key={item.key ?? idx} className="flex items-center justify-between gap-2">
          <dt
            className={`text-gray-500 shrink-0 ${item.visuallyHiddenTerm ? "sr-only" : ""}`}
          >
            {item.term}
          </dt>
          <dd className="text-gray-800 font-medium text-right truncate">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default memo(DescriptionList);
