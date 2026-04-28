import { useEffect, useMemo, useState } from "react";
import { Check, Globe, Loader2, X } from "lucide-react";

import { useFlowApi } from "@/shared/hooks/useFlowApi";

/**
 * Customer-driven claim flow for the temporary subdomain.
 *
 *   acme[.unicloudafrica.ng]   ← input + suffix label
 *   ✓ available  /  ✗ "subdomain is reserved"  /  ✗ "already taken — try acme-x9k2"
 *   [Claim]
 *
 * Used inline on:
 *   - Sites tab (per-site row): claim/rename the site's URL
 *   - Servers tab (per-server card): claim/rename the underlying VM's URL
 *
 * Behaviour:
 *   - Debounces availability checks at 350ms
 *   - Suggests an alternative when the typed name is taken
 *   - Disables Claim until availability is confirmed
 *   - Surfaces 409/422 server errors back into the inline status text
 */
export interface TemporaryDomainClaimProps {
  /** "flow" for sites; "compute" for VMs. Drives the zone suffix shown. */
  scope: "flow" | "compute";
  /**
   * The input's initial value. If the row already has a custom domain,
   * pass its label (without the zone suffix) so the user can edit.
   */
  initialName?: string;
  /**
   * Submit callback — receives the validated label. The parent owns the
   * actual API call (which is different for sites vs servers) and is
   * responsible for refreshing the surrounding list afterwards.
   *
   * Throw a `wrapped Error` (status + payload) to let this component
   * render the error inline. Errors with status 409 → "taken", 422 →
   * "invalid format", anything else → generic.
   */
  onClaim: (name: string) => Promise<void>;
  /**
   * Optional cancel handler — when set, a "Cancel" button appears.
   * If the parent renders this inside an open/close toggle, wire it
   * to close the form.
   */
  onCancel?: () => void;
  /** Override the suffix shown next to the input. Defaults to config. */
  suffixOverride?: string;
}

const DEFAULT_SUFFIX = ".unicloudafrica.ng";

export function TemporaryDomainClaim({
  scope,
  initialName = "",
  onClaim,
  onCancel,
  suffixOverride,
}: TemporaryDomainClaimProps) {
  const api = useFlowApi();
  const [name, setName] = useState(initialName);
  const [debounced, setDebounced] = useState(initialName);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<{
    available: boolean;
    reason?: string;
    suggestion?: string;
    hostname?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const suffix = suffixOverride ?? DEFAULT_SUFFIX;

  // Debounce so we don't hammer Cloudflare on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebounced(name.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    let cancelled = false;
    if (debounced.length < 3) {
      setCheck(null);
      return;
    }

    setChecking(true);
    api
      .checkTemporaryDomainAvailability(debounced, scope)
      .then((res) => {
        if (cancelled) return;
        setCheck(res.data ?? (res as unknown as typeof res.data));
      })
      .catch(() => {
        if (cancelled) return;
        setCheck({ available: false, reason: "Could not check availability." });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, scope, api]);

  const canClaim = useMemo(
    () => !!check?.available && !checking && !submitting && name.trim().length >= 3,
    [check, checking, submitting, name],
  );

  const onSubmit = async () => {
    setServerError(null);
    setSubmitting(true);
    try {
      await onClaim(name.trim().toLowerCase());
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 409) {
        setServerError("That subdomain was just taken — try another.");
      } else if (e.status === 422) {
        setServerError(e.message || "Invalid subdomain.");
      } else {
        setServerError(e.message || "Could not claim the subdomain.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const status = (() => {
    if (checking) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
        </span>
      );
    }
    if (serverError) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <X className="h-3 w-3" /> {serverError}
        </span>
      );
    }
    if (!check) {
      return (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Type at least 3 characters. Lowercase letters, digits, hyphens.
        </span>
      );
    }
    if (check.available) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <Check className="h-3 w-3" /> Available — {check.hostname}
        </span>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
          <X className="h-3 w-3" /> {check.reason || "Not available."}
        </span>
        {check.suggestion && (
          <button
            type="button"
            className="inline-flex items-center rounded border border-slate-300 px-1.5 py-0.5 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => setName(check.suggestion!)}
          >
            Try “{check.suggestion}”
          </button>
        )}
      </div>
    );
  })();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-stretch gap-2">
        <div className="flex flex-1 items-stretch overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-600 dark:bg-slate-800">
          <span className="flex items-center pl-2 text-slate-400">
            <Globe className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="my-app"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s+/g, ""))}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <span className="flex items-center bg-slate-50 px-2 py-1.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            {suffix}
          </span>
        </div>
        <button
          type="button"
          disabled={!canClaim}
          onClick={onSubmit}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {submitting ? "Claiming…" : "Claim"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        )}
      </div>
      <div>{status}</div>
    </div>
  );
}
