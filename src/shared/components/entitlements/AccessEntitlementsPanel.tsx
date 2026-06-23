import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import {
  useAccountTypes,
  useEntitlementCatalog,
  type AccountScope,
} from "@/hooks/adminHooks/adminAccountTypeHooks";
import {
  useAccountEntitlements,
  useAssignAccountType,
  useSetAccountEntitlements,
} from "@/hooks/adminHooks/adminEntitlementHooks";

const accent = "var(--theme-color)";

interface AccessEntitlementsPanelProps {
  scope: AccountScope;
  accountId: string;
}

/** Resolved source of a single entitlement key for this account. */
type KeySource = "from-tier" | "override-on" | "override-off" | "none";

const NO_TIER = "__none__";

const Badge: React.FC<{
  label: string;
  tone: "tier" | "accent" | "revoked";
}> = ({ label, tone }) => {
  if (tone === "accent") {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        {label}
      </span>
    );
  }
  if (tone === "revoked") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:bg-red-500/15 dark:text-red-400">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-300">
      {label}
    </span>
  );
};

/** One entitlement row — toggle + source badge + revert affordance. */
const EntitlementRow: React.FC<{
  entKey: string;
  source: KeySource;
  resolvedOn: boolean;
  busy: boolean;
  onToggle: () => void;
  onRevert: () => void;
}> = ({ entKey, source, resolvedOn, busy, onToggle, onRevert }) => {
  const isOverride = source === "override-on" || source === "override-off";
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
        resolvedOn ? "bg-primary/[0.06] dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-pressed={resolvedOn}
        aria-label={`${resolvedOn ? "Disable" : "Enable"} ${entKey}`}
        className="flex items-center gap-2.5 text-left disabled:opacity-50"
      >
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
          style={{
            background: resolvedOn ? accent : "transparent",
            borderColor: resolvedOn ? accent : "rgb(209 213 219)",
          }}
        >
          {resolvedOn ? <Check size={12} className="text-white" /> : null}
        </span>
        <span className="truncate font-mono text-xs text-gray-700 dark:text-gray-300">
          {entKey}
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {source === "from-tier" && <Badge label="From tier" tone="tier" />}
        {source === "override-on" && <Badge label="Override" tone="accent" />}
        {source === "override-off" && <Badge label="Revoked" tone="revoked" />}
        {isOverride && (
          <button
            type="button"
            onClick={onRevert}
            disabled={busy}
            title="Revert to tier default"
            aria-label={`Revert ${entKey} to tier default`}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

const AccessEntitlementsPanel: React.FC<AccessEntitlementsPanelProps> = ({ scope, accountId }) => {
  const {
    data: entitlements,
    isLoading: loadingEntitlements,
    isError: entitlementsError,
  } = useAccountEntitlements(scope, accountId);
  const { data: accountTypes } = useAccountTypes(scope);
  const { data: catalog, isLoading: loadingCatalog } = useEntitlementCatalog();

  const assignType = useAssignAccountType(scope, accountId);
  const setEntitlements = useSetAccountEntitlements(scope, accountId);

  // Track which key is mid-flight so only that row shows a busy state.
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const catalogGroups = useMemo<[string, string[]][]>(
    () => Object.entries(catalog ?? {}),
    [catalog]
  );

  const typeEntitlements = useMemo(
    () => new Set(entitlements?.type_entitlements ?? []),
    [entitlements]
  );
  const resolved = useMemo(() => new Set(entitlements?.resolved ?? []), [entitlements]);
  const overrides = entitlements?.overrides ?? {};

  const selectedType = accountTypes?.find((t) => t.id === entitlements?.account_type_id) ?? null;

  const typeOptions = useMemo(
    () => [
      { label: "No tier", value: NO_TIER },
      ...(accountTypes ?? []).map((t) => ({
        label: `${t.name} (${t.entitlements.length})`,
        value: String(t.id),
      })),
    ],
    [accountTypes]
  );

  const sourceFor = (key: string): KeySource => {
    if (overrides[key] === true) return "override-on";
    if (overrides[key] === false) return "override-off";
    if (typeEntitlements.has(key)) return "from-tier";
    return "none";
  };

  const handleAssignType = (value: string) => {
    const next = value === NO_TIER ? null : Number(value);
    assignType.mutate(next);
  };

  const handleToggle = (key: string, nextOn: boolean) => {
    setPendingKey(key);
    setEntitlements.mutate(
      { [key]: nextOn },
      { onSettled: () => setPendingKey(null) }
    );
  };

  const handleRevert = (key: string) => {
    setPendingKey(key);
    setEntitlements.mutate(
      { [key]: null },
      { onSettled: () => setPendingKey(null) }
    );
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        <KeyRound size={18} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Access &amp; Entitlements
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Assign this account a tier, then grant or revoke individual entitlements as
          overrides on top of it.
        </p>
      </div>
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loadingEntitlements || loadingCatalog) {
    return (
      <div className="space-y-5">
        {header}
        <Skeleton className="h-11 w-full max-w-xs" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (entitlementsError || !entitlements) {
    return (
      <div className="space-y-5">
        {header}
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-500" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Unable to load access &amp; entitlements for this account.
          </p>
        </div>
      </div>
    );
  }

  const activeCount = resolved.size;
  const writing = assignType.isPending || setEntitlements.isPending;

  return (
    <div className="space-y-6">
      {header}

      {/* Tier selector */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <ModernSelect
              label="Account tier"
              size="sm"
              value={
                entitlements.account_type_id === null
                  ? NO_TIER
                  : String(entitlements.account_type_id)
              }
              options={typeOptions}
              disabled={assignType.isPending}
              onChange={(e) => handleAssignType(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-1.5 text-sm text-gray-600 dark:text-gray-300">
            <ShieldCheck size={15} className="text-gray-400 dark:text-gray-500" />
            {selectedType ? (
              <span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedType.entitlements.length}
                </span>{" "}
                tier entitlement{selectedType.entitlements.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">No tier assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold" style={{ color: accent }}>
            {activeCount}
          </span>{" "}
          entitlement{activeCount === 1 ? "" : "s"} active
        </span>
        {writing && (
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Saving…</span>
        )}
      </div>

      {/* Grouped entitlement list */}
      {catalogGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No entitlement catalogue is available.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {catalogGroups.map(([group, keys]) => {
            const activeInGroup = keys.filter((k) => resolved.has(k)).length;
            return (
              <div
                key={group}
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-2.5 dark:bg-gray-900/40">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {group}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: activeInGroup > 0 ? "var(--theme-color-10)" : "transparent",
                      color: activeInGroup > 0 ? accent : "rgb(156 163 175)",
                    }}
                  >
                    {activeInGroup}/{keys.length} on
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
                  {keys.map((key) => {
                    const source = sourceFor(key);
                    const resolvedOn = resolved.has(key);
                    return (
                      <EntitlementRow
                        key={key}
                        entKey={key}
                        source={source}
                        resolvedOn={resolvedOn}
                        busy={pendingKey === key}
                        onToggle={() => handleToggle(key, !resolvedOn)}
                        onRevert={() => handleRevert(key)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccessEntitlementsPanel;
