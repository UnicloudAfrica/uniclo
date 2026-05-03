import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  ModernButton,
  ModernCard,
  ModernInput,
  ModernModal,
  ModernStatsCard,
  ModernTextarea,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import {
  formatFxRate,
  formatRelativeTime,
  toDatetimeLocalInputValue,
  useLookupFxRate,
  usePublishedFxRates,
  usePublishFxRate,
  type PublishedFxRate,
  type PublishedFxRateGroup,
} from "@/shared/hooks/resources/exchangeRateHooks";

/**
 * AdminExchangeRates — operations dashboard for the platform's
 * customer-facing FX rates.
 *
 * Layout: stats row → grid of one card per (source, target) active pair
 * with a collapsible history toggle, plus a single "+ Publish" entry
 * point that opens a modal pre-filled for arbitrary new pairs.
 */

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
};

const sourceLabel = (source: string | null | undefined): string => {
  if (!source) return "manual";
  if (source === "auto_refresh") return "auto refresh";
  if (source === "admin") return "manual";
  return source;
};

const sourcePillClasses = (source: string | null | undefined): string => {
  if (source === "auto_refresh") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  }
  return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
};

const publisherName = (
  rate: PublishedFxRate | null | undefined
): string | null => {
  if (!rate) return null;
  if (rate.published_by_name) return rate.published_by_name;
  if (rate.published_by !== undefined && rate.published_by !== null) {
    return `User #${rate.published_by}`;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────
// Publish modal
// ─────────────────────────────────────────────────────────────────

interface PublishFxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: string;
  initialTarget?: string;
}

const PublishFxRateModal = ({
  isOpen,
  onClose,
  initialSource,
  initialTarget,
}: PublishFxRateModalProps) => {
  const publish = usePublishFxRate();
  const lookup = useLookupFxRate();

  const [source, setSource] = useState((initialSource ?? "USD").toUpperCase());
  const [target, setTarget] = useState((initialTarget ?? "NGN").toUpperCase());
  const [rate, setRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    toDatetimeLocalInputValue(new Date())
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupSource, setLookupSource] = useState<string | null>(null);

  // Reset the form when the parent opens the modal with a fresh
  // (source, target) pair so each open starts from a known state.
  useMemo(() => {
    if (isOpen) {
      setSource((initialSource ?? "USD").toUpperCase());
      setTarget((initialTarget ?? "NGN").toUpperCase());
      setRate("");
      setNotes("");
      setEffectiveFrom(toDatetimeLocalInputValue(new Date()));
      setLookupSource(null);
    }
  }, [isOpen, initialSource, initialTarget]);

  const canFetch =
    source.length === 3 && target.length === 3 && source !== target;

  const handleFetchLatest = async () => {
    if (!canFetch || lookup.isPending) return;
    try {
      const result = await lookup.mutateAsync({
        source_currency: source,
        target_currency: target,
      });
      setRate(String(result.rate));
      setLookupSource(result.fx_source ?? "live");
      ToastUtils.success(
        `Fetched 1 ${source} = ${formatFxRate(result.rate)} ${target} from ${
          result.fx_source ?? "live source"
        }`
      );
    } catch (err) {
      ToastUtils.error(
        `Couldn't fetch live rate: ${(err as Error).message ?? "unknown error"}`
      );
    }
  };

  const sanitizeCurrency = (value: string) =>
    value
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 3);

  const numericRate = Number(rate);
  const formValid =
    source.length === 3 &&
    target.length === 3 &&
    source !== target &&
    Number.isFinite(numericRate) &&
    numericRate > 0;

  const handleSubmit = async () => {
    if (!formValid || submitting) return;
    setSubmitting(true);
    try {
      await publish.mutateAsync({
        source_currency: source,
        target_currency: target,
        rate: numericRate,
        ...(effectiveFrom
          ? { effective_from: new Date(effectiveFrom).toISOString() }
          : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      ToastUtils.success(
        `Published 1 ${source} = ${formatFxRate(numericRate)} ${target}`
      );
      onClose();
    } catch (err) {
      ToastUtils.error(
        `Could not publish rate: ${(err as Error).message ?? "unknown error"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish a new exchange rate"
      subtitle="The new rate becomes active immediately. The previous rate for this pair is automatically retired."
      size="md"
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: onClose,
          disabled: submitting,
        },
        {
          label: submitting ? "Publishing…" : "Publish rate",
          variant: "primary",
          onClick: handleSubmit,
          disabled: !formValid || submitting,
        },
      ]}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <ModernInput
            label="Source currency"
            value={source}
            onChange={(e) => setSource(sanitizeCurrency(e.target.value))}
            placeholder="USD"
            maxLength={3}
            required
            helper="The currency the customer pays in (3-letter code)"
          />
          <ModernInput
            label="Target currency"
            value={target}
            onChange={(e) => setTarget(sanitizeCurrency(e.target.value))}
            placeholder="NGN"
            maxLength={3}
            required
            helper="The currency the customer sees prices in"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              className="block text-sm font-medium text-neutral-600 dark:text-neutral-300"
              htmlFor="fx-rate-input"
            >
              Rate <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleFetchLatest}
              disabled={!canFetch || lookup.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              aria-label={`Fetch latest ${source}/${target} rate`}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${lookup.isPending ? "animate-spin" : ""}`}
              />
              {lookup.isPending ? "Fetching…" : "Fetch latest"}
            </button>
          </div>
          <ModernInput
            id="fx-rate-input"
            type="number"
            inputMode="decimal"
            step="0.000001"
            min="0"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              setLookupSource(null);
            }}
            placeholder="1600"
            required
            helper={
              source && target
                ? `1 ${source} = ${rate ? formatFxRate(Number(rate)) : "X"} ${target}${
                    lookupSource ? ` (from ${lookupSource} — edit before publishing if needed)` : ""
                  }`
                : "1 SOURCE = X TARGET"
            }
            {...(source === target && source.length === 3
              ? { error: "Source and target must differ" }
              : {})}
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-neutral-600 dark:text-neutral-300"
            htmlFor="effective-from"
          >
            Effective from
          </label>
          <input
            id="effective-from"
            type="datetime-local"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            Defaults to right now. Leave as-is for an immediate change.
          </p>
        </div>

        <ModernTextarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Monthly close, market spike, etc."
          rows={3}
          helper="Anything future-you should know about why this rate was published."
        />
      </div>
    </ModernModal>
  );
};

// ─────────────────────────────────────────────────────────────────
// Per-pair card
// ─────────────────────────────────────────────────────────────────

interface PairCardProps {
  group: PublishedFxRateGroup;
  onPublishNew: (source: string, target: string) => void;
}

const PairCard = ({ group, onPublishNew }: PairCardProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const active = group.active;
  const predecessors = group.history.filter((row) => row.id !== active?.id);

  return (
    <ModernCard
      variant="outlined"
      padding="lg"
      className="flex flex-col gap-4 dark:!border-neutral-800 dark:!bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {group.source_currency} → {group.target_currency}
          </div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            1 {group.source_currency} ={" "}
            <span className="text-blue-600 dark:text-blue-400">
              {formatFxRate(active?.rate)}
            </span>{" "}
            <span className="text-base font-medium text-neutral-500 dark:text-neutral-400">
              {group.target_currency}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${sourcePillClasses(active?.source)}`}
        >
          {sourceLabel(active?.source)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Effective since {formatDate(active?.effective_from)}
        </span>
        {publisherName(active) ? (
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" />
            Published by {publisherName(active)}
          </span>
        ) : null}
      </div>

      {active?.notes ? (
        <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs italic text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400">
          {active.notes}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <ModernButton
          variant="primary"
          size="sm"
          onClick={() =>
            onPublishNew(group.source_currency, group.target_currency)
          }
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Publish new rate
        </ModernButton>
        {predecessors.length > 0 ? (
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {historyOpen ? "Hide" : "View"} history ({predecessors.length})
            {historyOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            No prior rates
          </span>
        )}
      </div>

      {historyOpen && predecessors.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-neutral-100 dark:border-neutral-800">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">Effective from</th>
                <th className="px-3 py-2 font-medium">Effective until</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th>
                <th className="px-3 py-2 font-medium">Published by</th>
              </tr>
            </thead>
            <tbody>
              {predecessors.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-neutral-100 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
                >
                  <td className="px-3 py-2">{formatDate(row.effective_from)}</td>
                  <td className="px-3 py-2">{formatDate(row.effective_until)}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatFxRate(row.rate)}
                  </td>
                  <td className="px-3 py-2">{publisherName(row) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </ModernCard>
  );
};

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function AdminExchangeRates() {
  const { data, isLoading, isError, error, refetch } = usePublishedFxRates();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState<{
    source?: string;
    target?: string;
  }>({});

  const groups = data?.groups ?? [];
  const rows = data?.rows ?? [];

  const stats = useMemo(() => {
    const activePairs = groups.filter((g) => g.active !== null).length;

    const lastUpdatedRow = rows.reduce<PublishedFxRate | null>((acc, row) => {
      if (!row.effective_from) return acc;
      if (!acc) return row;
      return Date.parse(row.effective_from) >
        Date.parse(acc.effective_from ?? "")
        ? row
        : acc;
    }, null);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const ratesThisMonth = rows.filter((row) => {
      if (!row.effective_from) return false;
      const t = Date.parse(row.effective_from);
      return Number.isFinite(t) && t >= monthStart;
    }).length;

    const lastPublisher = publisherName(lastUpdatedRow);

    return {
      activePairs,
      lastUpdated: lastUpdatedRow
        ? formatRelativeTime(lastUpdatedRow.effective_from)
        : "Never",
      ratesThisMonth,
      lastPublisher: lastPublisher ?? "—",
    };
  }, [groups, rows]);

  const handleOpenForPair = (source?: string, target?: string) => {
    setModalDefaults({ ...(source ? { source } : {}), ...(target ? { target } : {}) });
    setModalOpen(true);
  };

  return (
    <AdminPageShell
      title="Exchange Rates"
      description="Manage display FX rates customers see across the platform. Each new publish supersedes the prior rate atomically."
    >
      <div className="space-y-6">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          These are the conversion rates customers see when buying in different
          currencies. Updating a rate takes effect immediately.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ModernStatsCard
            title="Active pairs"
            value={stats.activePairs}
            icon={<ArrowLeftRight />}
            color="primary"
          />
          <ModernStatsCard
            title="Last updated"
            value={stats.lastUpdated}
            icon={<Calendar />}
            color="info"
          />
          <ModernStatsCard
            title="Rates added this month"
            value={stats.ratesThisMonth}
            icon={<TrendingUp />}
            color="success"
          />
          <ModernStatsCard
            title="Most recent publisher"
            value={stats.lastPublisher}
            icon={<UserIcon />}
            color="warning"
          />
        </div>

        {/* Card grid header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Currently active rates
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              One card per currency pair. Tap "View history" to see prior
              publishes.
            </p>
          </div>
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => handleOpenForPair()}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Publish new rate
          </ModernButton>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <ModernCard
                key={idx}
                variant="outlined"
                padding="lg"
                className="dark:!border-neutral-800 dark:!bg-neutral-900"
              >
                <div className="space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-7 w-44 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </ModernCard>
            ))}
          </div>
        ) : isError ? (
          <ModernCard
            variant="outlined"
            padding="lg"
            className="text-center dark:!border-neutral-800 dark:!bg-neutral-900"
          >
            <p className="text-sm text-red-600 dark:text-red-400">
              Couldn't load exchange rates: {error?.message ?? "unknown error"}
            </p>
            <ModernButton
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </ModernButton>
          </ModernCard>
        ) : groups.length === 0 ? (
          <ModernCard
            variant="outlined"
            padding="xl"
            className="text-center dark:!border-neutral-800 dark:!bg-neutral-900"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              No exchange rates published yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Publish your first rate so customers can see prices in their
              preferred currency.
            </p>
            <ModernButton
              variant="primary"
              size="md"
              className="mt-5"
              onClick={() => handleOpenForPair()}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Publish your first rate
            </ModernButton>
          </ModernCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <PairCard
                key={group.key}
                group={group}
                onPublishNew={(s, t) => handleOpenForPair(s, t)}
              />
            ))}
          </div>
        )}
      </div>

      <PublishFxRateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        {...(modalDefaults.source ? { initialSource: modalDefaults.source } : {})}
        {...(modalDefaults.target ? { initialTarget: modalDefaults.target } : {})}
      />
    </AdminPageShell>
  );
}
