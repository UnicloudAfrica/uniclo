import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

/**
 * InlinePriceEditor — a single editable price field with async save +
 * optional revert, built for table-cell density.
 *
 * Why this exists
 * ---------------
 * Seven sites in /admin-dashboard/pricing rebuild the same shape from
 * scratch (numeric input, Save / Cancel / Revert buttons, dirty
 * tracking, min-floor validation, in-flight spinner, error toast). The
 * subtle differences across sites — keyboard behaviour, aria-busy
 * coverage, focus return, mobile collapse — drift apart over time and
 * become a maintenance burden. This component pins the contract.
 *
 * Out of scope
 * ------------
 * - Bulk-save spreadsheet rows (one Save button commits N fields per
 *   row, parent owns the dirty draft). The four "admin edit" pricing
 *   panes use that pattern; their cells share `compactInputClassName`
 *   from `./styles` instead of this component. If you find yourself
 *   reaching for `InlinePriceEditor` and the parent already tracks
 *   per-row dirtiness, you want a plain styled input, not this.
 * - Click-to-edit (read-only by default, click → edit). CatalogPane
 *   uses that pattern. Wrap this component in a visibility toggle if
 *   you need it.
 * - Currency conversion. The `currency` prop is display-only; numeric
 *   value is whatever the parent passes / receives.
 * - Optimistic updates. The parent owns the cache; on save success
 *   we mark pristine and trust the parent to refetch + re-prop.
 *
 * Accessibility contract
 * ----------------------
 * - Either `label` (visible) OR `ariaLabel` is required at runtime
 *   (TS prop signature accepts both as optional but throws a dev-time
 *   warning when neither is supplied — a11y is non-negotiable).
 * - The input announces validation errors via `role="alert"` and is
 *   linked via `aria-describedby` to both the baseline helper and the
 *   error region.
 * - The container goes `aria-busy="true"` for the duration of any
 *   in-flight async action.
 * - Icon-only adornments on Save / Revert buttons carry visually
 *   hidden text labels for screen readers.
 * - Keyboard:
 *     · Enter   — save (when valid + dirty)
 *     · Escape  — reset draft to last server value
 *     · Tab     — natural order: input → save → revert
 *
 * Loading / pending states
 * ------------------------
 * - `isLoading` — initial fetch; renders a skeleton, no buttons yet.
 * - `disabled` — parent global gate (e.g. another row is mid-save).
 * - Internal `pending` tracks which button is in flight so the spinner
 *   replaces only that button's icon, layout stays stable.
 */

export type InlinePriceEditorLayout = "inline" | "stacked" | "auto";

export interface InlinePriceEditorRef {
  focus: () => void;
  reset: () => void;
}

export interface InlinePriceEditorProps {
  /** Server-persisted value. `null` means "no value set yet". */
  value: number | null;
  /** Display currency (e.g. "USD"). Numeric input is unaffected. */
  currency: string;
  /** Floor for inline validation (e.g. admin price for tenant override). */
  minPrice?: number;
  /** Optional label shown beside / above the input. */
  label?: string;
  /** Required when `label` is omitted — ensures every input has an a11y name. */
  ariaLabel?: string;
  /** Placeholder text in the input (e.g. admin default to hint at floor). */
  placeholder?: string;
  /** Faint helper line under the input — typically the admin / list price. */
  baseline?: {
    amount: number | null;
    currency?: string;
    /** "currently", "list price", "platform default" — verb to caller. */
    label?: string;
  };
  /** Optional small status pill rendered under the buttons. */
  status?: ReactNode;
  /** Parent global disable. */
  disabled?: boolean;
  /** Show a skeleton in place of the input + buttons. */
  isLoading?: boolean;
  /** Persist the typed value. Throw to surface an error inline. */
  onSave: (next: number) => Promise<void> | void;
  /** Optional revert handler. Hides the revert button when omitted. */
  onClear?: () => Promise<void> | void;
  /** Layout mode. `"auto"` stacks below ~480px via Tailwind breakpoints. */
  layout?: InlinePriceEditorLayout;
  /** Save / revert button labels (text + sr-only label content). */
  saveLabel?: string;
  clearLabel?: string;
  /** Step + min for the underlying numeric input. */
  step?: number;
  /** Hide the Save button entirely until the user types something new. */
  hideSaveWhenPristine?: boolean;
  /** Test hook for query selectors. */
  "data-testid"?: string;
}

const formatMoney = (amount: number | null | undefined, currency: string) => {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

const inputClassName = [
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white",
  "px-3 py-2 text-right text-sm tabular-nums",
  "transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
  "aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-100",
].join(" ");

const InlinePriceEditor = forwardRef<InlinePriceEditorRef, InlinePriceEditorProps>(
  function InlinePriceEditor(
    {
      value,
      currency,
      minPrice,
      label,
      ariaLabel,
      placeholder,
      baseline,
      status,
      disabled = false,
      isLoading = false,
      onSave,
      onClear,
      layout = "auto",
      saveLabel = "Save",
      clearLabel = "Revert",
      step = 0.01,
      hideSaveWhenPristine = true,
      "data-testid": testId = "inline-price-editor",
    },
    ref,
  ) {
    if (import.meta.env.DEV && typeof window !== "undefined" && !label && !ariaLabel) {
      // Dev-only nudge so consumers don't accidentally ship an unlabelled
      // numeric input. We don't throw — a11y warnings shouldn't break
      // the page.
      // eslint-disable-next-line no-console
      console.warn(
        "[InlinePriceEditor] Missing accessible name. Pass either `label` or `ariaLabel`.",
      );
    }

    const inputRef = useRef<HTMLInputElement>(null);
    const errorId = useId();
    const baselineId = useId();
    const liveId = useId();

    const valueAsString = value === null || value === undefined ? "" : String(value);

    const [draft, setDraft] = useState<string>(valueAsString);
    const [dirty, setDirty] = useState(false);
    const [pending, setPending] = useState<"save" | "clear" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>("");

    const isBusy = pending !== null;
    const interactive = !disabled && !isBusy && !isLoading;

    // Sync from server prop only when the user isn't actively editing or
    // mid-flight. Without this guard, a parent re-render (e.g. unrelated
    // React Query refetch) would blow away in-progress typing.
    useEffect(() => {
      if (dirty || pending) return;
      setDraft(valueAsString);
      setError(null);
    }, [valueAsString, dirty, pending]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        reset: () => {
          setDraft(valueAsString);
          setDirty(false);
          setError(null);
        },
      }),
      [valueAsString],
    );

    type ValidationResult =
      | { ok: true; value: number }
      | { ok: false; reason: string };

    const validate = useCallback(
      (raw: string): ValidationResult => {
        const trimmed = raw.trim();
        if (trimmed === "") return { ok: false, reason: "Enter a price." };
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || parsed < 0) {
          return { ok: false, reason: "Enter a valid non-negative price." };
        }
        if (typeof minPrice === "number" && parsed < minPrice) {
          return {
            ok: false,
            reason: `Price cannot be below ${formatMoney(minPrice, currency)}.`,
          };
        }
        return { ok: true, value: parsed };
      },
      [minPrice, currency],
    );

    const handleSave = useCallback(async () => {
      if (!dirty || pending) return;
      const result: ValidationResult = validate(draft);
      if (result.ok === false) {
        setError(result.reason);
        // Move focus to the input so screen readers re-announce context.
        inputRef.current?.focus();
        return;
      }
      setPending("save");
      setError(null);
      try {
        await onSave(result.value);
        setDirty(false);
        setStatusMessage("Saved.");
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : "Could not save.");
      } finally {
        setPending(null);
      }
    }, [dirty, pending, draft, validate, onSave]);

    const handleClear = useCallback(async () => {
      if (!onClear || pending) return;
      setPending("clear");
      setError(null);
      try {
        await onClear();
        setDraft("");
        setDirty(false);
        setStatusMessage("Reverted to default.");
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : "Could not revert.");
      } finally {
        setPending(null);
      }
    }, [onClear, pending]);

    const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleSave();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setDraft(valueAsString);
        setDirty(false);
        setError(null);
      }
    };

    if (isLoading) {
      return (
        <div
          className="flex flex-col items-end gap-1.5"
          data-testid={`${testId}-loading`}
          aria-busy="true"
        >
          <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      );
    }

    const showSave = !hideSaveWhenPristine || dirty;
    const showRevert = typeof onClear === "function";

    // Layout primitives — keep this compact-readable rather than over-
    // abstracting into another component. Stacked stacks below sm.
    const containerLayout =
      layout === "stacked"
        ? "flex flex-col items-stretch gap-1.5"
        : layout === "auto"
          ? "flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-start sm:justify-end"
          : "flex flex-row items-start justify-end gap-1.5";

    return (
      <div
        className="flex flex-col items-stretch gap-1 sm:items-end"
        data-testid={testId}
        aria-busy={isBusy || undefined}
      >
        {label && (
          <label
            htmlFor={`${liveId}-input`}
            className="text-[11px] font-medium uppercase tracking-wide text-slate-500"
          >
            {label}
          </label>
        )}

        <div className={containerLayout}>
          <input
            ref={inputRef}
            id={`${liveId}-input`}
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            value={draft}
            placeholder={placeholder}
            disabled={!interactive}
            onChange={(event) => {
              setDraft(event.target.value);
              setDirty(true);
              if (error) setError(null);
            }}
            onKeyDown={handleKey}
            aria-label={ariaLabel}
            aria-invalid={error ? true : undefined}
            aria-describedby={[error ? errorId : null, baseline ? baselineId : null]
              .filter(Boolean)
              .join(" ") || undefined}
            className={`${inputClassName} sm:w-32`}
            data-testid={`${testId}-input`}
          />

          <div className="flex items-center justify-end gap-1.5">
            {showSave && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!interactive || !dirty}
                className={[
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                  "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
                  dirty && interactive
                    ? "border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100"
                    : "border-slate-200 text-slate-400",
                ].join(" ")}
                data-testid={`${testId}-save`}
                aria-label={`${saveLabel} price`}
              >
                {pending === "save" ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-3 w-3" aria-hidden="true" />
                )}
                <span>{saveLabel}</span>
              </button>
            )}

            {showRevert && (
              <button
                type="button"
                onClick={() => void handleClear()}
                disabled={!interactive || value === null}
                className={[
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                  "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40",
                  value !== null && interactive
                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-slate-200 text-slate-400",
                ].join(" ")}
                data-testid={`${testId}-clear`}
                aria-label={`${clearLabel} to default`}
                title={value !== null ? clearLabel : "Nothing to revert"}
              >
                {pending === "clear" ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                )}
                <span>{clearLabel}</span>
              </button>
            )}
          </div>
        </div>

        {baseline && (
          <span id={baselineId} className="text-[10px] text-slate-400" data-testid={`${testId}-baseline`}>
            {baseline.label ?? "Default"}{" "}
            {formatMoney(baseline.amount ?? null, baseline.currency || currency)}
          </span>
        )}

        {status && <span className="text-[10px] text-slate-500">{status}</span>}

        {error && (
          <span
            id={errorId}
            role="alert"
            className="text-[10px] font-medium text-rose-600"
            data-testid={`${testId}-error`}
          >
            {error}
          </span>
        )}

        {/*
         * Live region for non-error status updates ("Saved", "Reverted").
         * role="status" + aria-live="polite" so screen readers announce
         * without interrupting the user's typing flow.
         */}
        <span
          role="status"
          aria-live="polite"
          className="sr-only"
          data-testid={`${testId}-live`}
        >
          {statusMessage}
        </span>
      </div>
    );
  },
);

export default InlinePriceEditor;
export { InlinePriceEditor };
