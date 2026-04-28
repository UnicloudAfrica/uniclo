import { Check, Copy, ExternalLink, Globe, Loader2, Pencil } from "lucide-react";
import { useState } from "react";

import type { TemporaryDomain } from "@/shared/hooks/useFlowApi";
import { TemporaryDomainClaim } from "./TemporaryDomainClaim";

/**
 * Vercel/Heroku-style "your site is reachable at <slug>.flow.unicloudafrica.ng"
 * badge. Shown on the Flow site list, the Bridge server detail page, and any
 * other surface where a tenant needs the auto-issued URL handy.
 *
 * - Click the URL to open in a new tab.
 * - Copy button → clipboard, with a checkmark for 2 seconds on success.
 * - When `domain` is null, renders a "Generate URL" button that calls
 *   `onGenerate` (typically wired to POST /sites/{id}/temporary-domain).
 */
export interface TemporaryDomainBadgeProps {
  domain?: TemporaryDomain | null;
  /**
   * Auto-issue (no custom name) callback. Used when the user clicks
   * "Generate temporary URL" without typing a name first. Falls back
   * to the parent if not provided — the parent typically wires this
   * to `attachSiteTemporaryDomain(server, site)` with no name.
   */
  onGenerate?: () => Promise<void> | void;
  /**
   * Custom-name claim/rename callback. Called with the validated label
   * (no zone suffix). The parent decides which API to call (site vs
   * server) and refreshes the surrounding list afterwards.
   */
  onClaim?: (name: string) => Promise<void>;
  /** Pass-through to TemporaryDomainClaim — flow vs compute zone. */
  scope?: "flow" | "compute";
  isGenerating?: boolean;
  /**
   * Compact mode — used inside table rows where vertical space is tight.
   * Still includes the copy button but drops the "Temporary URL" label.
   */
  compact?: boolean;
}

export function TemporaryDomainBadge({
  domain,
  onGenerate,
  onClaim,
  scope = "flow",
  isGenerating = false,
  compact = false,
}: TemporaryDomainBadgeProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  // Empty state: show the claim form inline if onClaim is wired,
  // otherwise the legacy "Generate" button if onGenerate is wired,
  // otherwise a passive label.
  if (!domain || !domain.domain) {
    if (onClaim) {
      return (
        <div className="space-y-2">
          <TemporaryDomainClaim
            scope={scope}
            onClaim={onClaim}
          />
          {onGenerate && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => {
                void onGenerate();
              }}
              className="text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {isGenerating ? "Allocating…" : "Or auto-generate a URL"}
            </button>
          )}
        </div>
      );
    }
    if (onGenerate) {
      return (
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => {
            void onGenerate();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Globe className="h-3.5 w-3.5" />
          )}
          {isGenerating ? "Allocating…" : "Generate temporary URL"}
        </button>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Globe className="h-3.5 w-3.5" />
        No temporary URL
      </span>
    );
  }

  // Rename mode: replace the badge with the claim form, prefilled with
  // the existing label so the user can edit in place.
  if (editing && onClaim) {
    const currentLabel = domain.domain.split(".")[0] ?? "";
    return (
      <TemporaryDomainClaim
        scope={scope}
        initialName={currentLabel}
        onCancel={() => setEditing(false)}
        onClaim={async (name) => {
          await onClaim(name);
          setEditing(false);
        }}
      />
    );
  }

  const url = `${domain.https ? "https" : "http"}://${domain.domain}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* best-effort */
    }
  };

  return (
    <div className="inline-flex max-w-full items-center gap-2">
      {!compact && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Temporary URL
        </span>
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-1 truncate rounded-md bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
        title={url}
      >
        <span className="truncate">{domain.domain}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        title={copied ? "Copied!" : "Copy URL"}
        aria-label="Copy temporary URL"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      {onClaim && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={domain.custom ? "Rename" : "Customize this URL"}
          aria-label="Rename temporary URL"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
