import React, { memo } from "react";
import { ChevronRight } from "lucide-react";
import { Link, type LinkProps } from "react-router-dom";
import { useUiMessages } from "./messages";

/**
 * Breadcrumbs — hierarchical navigation trail.
 *
 * Wrapped in `<nav aria-label="Breadcrumb">` per WAI-ARIA APG.
 * Last item is the current page (rendered as text, not a link, with
 * `aria-current="page"`).
 *
 * Items can be react-router `<Link>` destinations or plain strings.
 */

export interface BreadcrumbItem {
  label: React.ReactNode;
  to?: LinkProps["to"];
  /** Optional leading icon (lucide / svg). */
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Custom separator. Defaults to a chevron. */
  separator?: React.ReactNode;
  className?: string;
  /** Truncate long labels at this many chars (still announced fully). */
  maxLabelLength?: number;
}

const truncate = (label: React.ReactNode, max?: number): React.ReactNode => {
  if (!max || typeof label !== "string") return label;
  if (label.length <= max) return label;
  return <span title={label}>{label.slice(0, max - 1)}…</span>;
};

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator,
  className = "",
  maxLabelLength,
}) => {
  const messages = useUiMessages();
  if (items.length === 0) return null;
  const sep = separator ?? <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />;

  return (
    <nav aria-label={messages.breadcrumbLandmark} className={`font-outfit ${className}`}>
      <ol className="flex items-center gap-1.5 text-xs">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const label = (
            <span className="inline-flex items-center gap-1">
              {item.icon && (
                <span className="shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {truncate(item.label, maxLabelLength)}
            </span>
          );

          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "font-semibold text-gray-800"
                      : "text-gray-500"
                  }
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-gray-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 rounded"
                >
                  {label}
                </Link>
              )}
              {!isLast && <span aria-hidden="true">{sep}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default memo(Breadcrumbs);
