import { useEffect, useState } from "react";
import { Plus, Trash2, Send, ArrowRight } from "lucide-react";
import {
  ModernModal,
  ModernButton,
  ModernInput,
  ModernSelect,
  ModernTextarea,
  Tabs,
  type TabItem,
} from "@/shared/components/ui";
import {
  useSubmitMigrationRequest,
  useSubmitBatchMigrationRequests,
} from "@/hooks/migrationRequestHooks";
import { useRegionOptions } from "@/hooks/useRegionOptions";

/**
 * Customer-facing "New migration request" modal.
 *
 * Two modes:
 *   • Single — one source/target pair. Most customers start here.
 *   • Batch  — up to 10 pairs at once. Power users with workloads spread
 *              across multiple regions.
 *
 * Both modes share the source-provider selector, the preferred window,
 * and the customer notes field. Submission goes through the matching
 * mutation hook so toast feedback + cache invalidation is uniform.
 *
 * Validation lives in the form requests on the backend; we only do the
 * minimum here (required fields, batch ≤ 10) to keep the UX snappy.
 */
interface NewMigrationRequestModalProps {
  open: boolean;
  onClose: () => void;
  defaultSourceProvider?: "zadara" | "nobus";
}

const PROVIDER_OPTIONS: { label: string; value: "zadara" | "nobus" }[] = [
  // Customer-facing labels intentionally avoid leaking the provider brand.
  { label: "Current cloud (region A)", value: "zadara" },
  { label: "Current cloud (region B)", value: "nobus" },
];

export default function NewMigrationRequestModal({
  open,
  onClose,
  defaultSourceProvider = "zadara",
}: NewMigrationRequestModalProps) {
  const [activeTab, setActiveTab] = useState("single");
  const [sourceProvider, setSourceProvider] =
    useState<"zadara" | "nobus">(defaultSourceProvider);
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [notes, setNotes] = useState("");

  // Lifted form state so it survives tab switches (Tabs.renderPanel
  // unmounts the inactive panel — without this lift, single→batch→single
  // would lose what the user typed).
  const [singleSourceRegion, setSingleSourceRegion] = useState("");
  const [singleTargetRegion, setSingleTargetRegion] = useState("");
  const [batchPairs, setBatchPairs] = useState<
    { source_region: string; target_region: string }[]
  >([{ source_region: "", target_region: "" }]);

  const { options: regionOptions, isLoading: regionsLoading } = useRegionOptions();
  const submitSingle = useSubmitMigrationRequest();
  const submitBatch = useSubmitBatchMigrationRequests();

  const reset = () => {
    setSourceProvider(defaultSourceProvider);
    setWindowStart("");
    setWindowEnd("");
    setNotes("");
    setSingleSourceRegion("");
    setSingleTargetRegion("");
    setBatchPairs([{ source_region: "", target_region: "" }]);
  };

  const handleClose = () => {
    if (submitSingle.isPending || submitBatch.isPending) {
      return; // don't lose the form mid-submit
    }
    reset();
    onClose();
  };

  const tabs: TabItem[] = [
    { value: "single", label: "Single region" },
    { value: "batch", label: "Multiple regions (batch)" },
  ];

  const renderPanel = (active: string) => {
    if (active === "batch") {
      return (
        <BatchForm
          sourceProvider={sourceProvider}
          windowStart={windowStart}
          windowEnd={windowEnd}
          notes={notes}
          onWindowStart={setWindowStart}
          onWindowEnd={setWindowEnd}
          onNotes={setNotes}
          isSubmitting={submitBatch.isPending}
          regionOptions={regionOptions}
          regionsLoading={regionsLoading}
          pairs={batchPairs}
          setPairs={setBatchPairs}
          onSubmit={async (pairs) => {
            await submitBatch.mutateAsync({
              source_provider: sourceProvider,
              pairs,
              preferred_window_start: windowStart || null,
              preferred_window_end: windowEnd || null,
              customer_notes: notes || null,
            });
            handleClose();
          }}
        />
      );
    }
    return (
      <SingleForm
        sourceProvider={sourceProvider}
        windowStart={windowStart}
        windowEnd={windowEnd}
        notes={notes}
        onWindowStart={setWindowStart}
        onWindowEnd={setWindowEnd}
        onNotes={setNotes}
        isSubmitting={submitSingle.isPending}
        regionOptions={regionOptions}
        regionsLoading={regionsLoading}
        sourceRegion={singleSourceRegion}
        targetRegion={singleTargetRegion}
        setSourceRegion={setSingleSourceRegion}
        setTargetRegion={setSingleTargetRegion}
        onSubmit={async (sourceRegion, targetRegion) => {
          await submitSingle.mutateAsync({
            source_provider: sourceProvider,
            source_region: sourceRegion,
            target_region: targetRegion,
            preferred_window_start: windowStart || null,
            preferred_window_end: windowEnd || null,
            customer_notes: notes || null,
          });
          handleClose();
        }}
      />
    );
  };

  return (
    <ModernModal
      isOpen={open}
      onClose={handleClose}
      title="New migration request"
      size="lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Describe the move. Our team plans + executes during your preferred
          window. Source data stays untouched; we only spin up the new region
          and cut over once you approve.
        </p>

        <div className="grid gap-3">
          <ModernSelect
            label="Source"
            value={sourceProvider}
            onChange={(e) => setSourceProvider(e.target.value as "zadara" | "nobus")}
            options={PROVIDER_OPTIONS}
          />
        </div>

        <Tabs
          items={tabs}
          value={activeTab}
          onChange={setActiveTab}
          renderPanel={renderPanel}
        />
      </div>
    </ModernModal>
  );
}

interface SharedFormProps {
  sourceProvider: "zadara" | "nobus";
  windowStart: string;
  windowEnd: string;
  notes: string;
  onWindowStart: (v: string) => void;
  onWindowEnd: (v: string) => void;
  onNotes: (v: string) => void;
  isSubmitting: boolean;
  regionOptions: { label: string; value: string }[];
  regionsLoading: boolean;
}

function SingleForm({
  windowStart,
  windowEnd,
  notes,
  onWindowStart,
  onWindowEnd,
  onNotes,
  isSubmitting,
  regionOptions,
  regionsLoading,
  sourceRegion,
  targetRegion,
  setSourceRegion,
  setTargetRegion,
  onSubmit,
}: SharedFormProps & {
  sourceRegion: string;
  targetRegion: string;
  setSourceRegion: (v: string) => void;
  setTargetRegion: (v: string) => void;
  onSubmit: (sourceRegion: string, targetRegion: string) => Promise<void>;
}) {
  // Default to first two distinct regions once the list resolves.
  useEffect(() => {
    if (!sourceRegion && regionOptions[0]?.value) {
      setSourceRegion(regionOptions[0].value);
    }
    if (!targetRegion && regionOptions[1]?.value) {
      setTargetRegion(regionOptions[1].value);
    } else if (!targetRegion && regionOptions[0]?.value) {
      setTargetRegion(regionOptions[0].value);
    }
  }, [regionOptions, sourceRegion, targetRegion, setSourceRegion, setTargetRegion]);

  const valid =
    !!sourceRegion && !!targetRegion && sourceRegion !== targetRegion;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(sourceRegion, targetRegion);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModernSelect
          label="From region"
          value={sourceRegion}
          onChange={(e) => setSourceRegion(e.target.value)}
          options={regionOptions}
          disabled={regionsLoading}
        />
        <ModernSelect
          label="To region"
          value={targetRegion}
          onChange={(e) => setTargetRegion(e.target.value)}
          options={regionOptions}
          disabled={regionsLoading}
        />
      </div>

      {sourceRegion === targetRegion && (
        <p className="text-xs text-amber-600">
          Source and target regions must be different.
        </p>
      )}

      <PreferredWindow
        start={windowStart}
        end={windowEnd}
        onStart={onWindowStart}
        onEnd={onWindowEnd}
      />

      <ModernTextarea
        label="Notes for our team (optional)"
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        rows={3}
        placeholder="Anything we should know? Maintenance windows, app dependencies…"
      />

      <div className="flex justify-end gap-2">
        <ModernButton
          type="submit"
          variant="primary"
          leftIcon={<Send className="h-4 w-4" />}
          disabled={!valid || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Submitting…" : "Submit request"}
        </ModernButton>
      </div>
    </form>
  );
}

function BatchForm({
  windowStart,
  windowEnd,
  notes,
  onWindowStart,
  onWindowEnd,
  onNotes,
  isSubmitting,
  regionOptions,
  regionsLoading,
  pairs,
  setPairs,
  onSubmit,
}: SharedFormProps & {
  pairs: { source_region: string; target_region: string }[];
  setPairs: (
    next: { source_region: string; target_region: string }[]
  ) => void;
  onSubmit: (
    pairs: { source_region: string; target_region: string }[]
  ) => Promise<void>;
}) {
  const defaultPair = (): { source_region: string; target_region: string } => ({
    source_region: regionOptions[0]?.value ?? "",
    target_region: regionOptions[1]?.value ?? regionOptions[0]?.value ?? "",
  });

  // Re-seed empty pairs once regions arrive (avoids flashing empty selects).
  useEffect(() => {
    if (regionOptions.length === 0) return;
    setPairs(
      pairs.map((p) => ({
        source_region: p.source_region || regionOptions[0]?.value || "",
        target_region:
          p.target_region ||
          regionOptions[1]?.value ||
          regionOptions[0]?.value ||
          "",
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionOptions]);

  const addPair = () => {
    if (pairs.length >= 10) return;
    setPairs([...pairs, defaultPair()]);
  };

  const removePair = (idx: number) =>
    setPairs(pairs.filter((_, i) => i !== idx));

  const updatePair = (
    idx: number,
    key: "source_region" | "target_region",
    value: string
  ) => {
    const next = [...pairs];
    next[idx] = { ...next[idx], [key]: value };
    setPairs(next);
  };

  const valid = pairs.every(
    (p) => p.source_region && p.target_region && p.source_region !== p.target_region
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(pairs);
      }}
    >
      <p className="text-xs text-slate-500">
        Up to 10 region pairs. We submit them as one batch so you don't have
        to chase 10 separate requests.
      </p>

      <div className="space-y-2">
        {pairs.map((pair, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/40 p-2 dark:border-slate-800 dark:bg-slate-900/30"
          >
            <ModernSelect
              value={pair.source_region}
              onChange={(e) => updatePair(idx, "source_region", e.target.value)}
              options={regionOptions}
              disabled={regionsLoading}
            />
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <ModernSelect
              value={pair.target_region}
              onChange={(e) => updatePair(idx, "target_region", e.target.value)}
              options={regionOptions}
              disabled={regionsLoading}
            />
            <button
              type="button"
              onClick={() => removePair(idx)}
              disabled={pairs.length === 1}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
              aria-label="Remove pair"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <ModernButton
        type="button"
        variant="ghost"
        size="sm"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={addPair}
        disabled={pairs.length >= 10}
      >
        Add pair {pairs.length >= 10 ? "(max 10)" : ""}
      </ModernButton>

      <PreferredWindow
        start={windowStart}
        end={windowEnd}
        onStart={onWindowStart}
        onEnd={onWindowEnd}
      />

      <ModernTextarea
        label="Notes for our team (optional)"
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        rows={3}
      />

      <div className="flex justify-end gap-2">
        <ModernButton
          type="submit"
          variant="primary"
          leftIcon={<Send className="h-4 w-4" />}
          disabled={!valid || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting
            ? "Submitting…"
            : `Submit ${pairs.length} request${pairs.length === 1 ? "" : "s"}`}
        </ModernButton>
      </div>
    </form>
  );
}

function PreferredWindow({
  start,
  end,
  onStart,
  onEnd,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ModernInput
        label="Preferred window — start"
        type="datetime-local"
        value={start}
        onChange={(e) => onStart(e.target.value)}
      />
      <ModernInput
        label="Preferred window — end"
        type="datetime-local"
        value={end}
        onChange={(e) => onEnd(e.target.value)}
      />
    </div>
  );
}
