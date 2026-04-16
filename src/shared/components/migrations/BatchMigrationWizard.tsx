/**
 * BatchMigrationWizard -- Single-page creation form for batch migrations.
 *
 * Left panel: settings (name, strategy, concurrency, wave size, transfer method,
 * include databases, exclude paths).
 * Right panel: VM pairs with N+1 auto-detection.
 */
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Merge,
  SplitSquareHorizontal,
  Loader2,
  XCircle,
  Info,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useCreateBatchMigration } from "@/shared/hooks/resources";
import { useFetchExternalEndpoints } from "@/shared/hooks/resources/externalEndpointHooks";

type AnyRecord = Record<string, unknown>;

interface BatchMigrationWizardProps {
  context: "admin" | "tenant" | "client";
  backPath: string;
}

interface VmPair {
  id: string;
  source_endpoint_id: string;
  target_endpoint_id: string;
}

type Strategy = "wave" | "parallel" | "sequential";
type ConsolidationMode = "namespace_isolated" | "merge";

let pairIdCounter = 0;
const nextPairId = () => `pair-${++pairIdCounter}`;

const BatchMigrationWizard: React.FC<BatchMigrationWizardProps> = ({
  context: _context,
  backPath,
}) => {
  const navigate = useNavigate();
  const createMutation = useCreateBatchMigration();
  const { data: endpointData } = useFetchExternalEndpoints();

  const endpoints = useMemo(() => {
    if (!endpointData) return [];
    return Array.isArray(endpointData) ? (endpointData as AnyRecord[]) : [];
  }, [endpointData]);

  // Settings state
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("wave");
  const [concurrency, setConcurrency] = useState(5);
  const [waveSize, setWaveSize] = useState(3);
  const [transferMethod, setTransferMethod] = useState<"rsync" | "dd">("rsync");
  const [includeDatabases, setIncludeDatabases] = useState(false);
  const [excludePaths, setExcludePaths] = useState("");
  const [consolidationMode, setConsolidationMode] =
    useState<ConsolidationMode>("namespace_isolated");
  const [error, setError] = useState<string | null>(null);

  // VM Pairs state
  const [pairs, setPairs] = useState<VmPair[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");

  // N+1 detection: find targets with 2+ sources
  const n1Targets = useMemo(() => {
    const targetMap = new Map<string, string[]>();
    for (const pair of pairs) {
      const sources = targetMap.get(pair.target_endpoint_id) ?? [];
      sources.push(pair.source_endpoint_id);
      targetMap.set(pair.target_endpoint_id, sources);
    }
    const result: Array<{ targetId: string; targetName: string; sourceNames: string[] }> = [];
    targetMap.forEach((sourceIds, targetId) => {
      if (sourceIds.length >= 2) {
        const targetEp = endpoints.find((e) => String(e.id) === targetId);
        const sourceNames = sourceIds.map((sid) => {
          const ep = endpoints.find((e) => String(e.id) === sid);
          return String(ep?.name ?? ep?.host ?? sid);
        });
        result.push({
          targetId,
          targetName: String(targetEp?.name ?? targetEp?.host ?? targetId),
          sourceNames,
        });
      }
    });
    return result;
  }, [pairs, endpoints]);

  const hasN1 = n1Targets.length > 0;

  const addPair = useCallback(() => {
    if (!selectedSource || !selectedTarget) return;
    if (selectedSource === selectedTarget) return;
    setPairs((prev) => [
      ...prev,
      {
        id: nextPairId(),
        source_endpoint_id: selectedSource,
        target_endpoint_id: selectedTarget,
      },
    ]);
    setSelectedSource("");
    setSelectedTarget("");
    setError(null);
  }, [selectedSource, selectedTarget]);

  const removePair = useCallback((id: string) => {
    setPairs((prev) => prev.filter((p) => p.id !== id));
    setError(null);
  }, []);

  const canSubmit = name.trim().length > 0 && pairs.length >= 2;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const payload: AnyRecord = {
      name: name.trim(),
      strategy,
      max_concurrent: concurrency,
      wave_size: strategy === "wave" ? waveSize : undefined,
      transfer_method: transferMethod,
      include_databases: includeDatabases,
      exclude_paths: excludePaths
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      migrations: pairs.map((p) => ({
        source_endpoint_id: p.source_endpoint_id,
        target_endpoint_id: p.target_endpoint_id,
      })),
      ...(hasN1 ? { consolidation_mode: consolidationMode } : {}),
      ...(hasN1 && consolidationMode === "merge"
        ? {
            merge_order: pairs
              .filter((p) => n1Targets.some((t) => t.targetId === p.target_endpoint_id))
              .map((p) => p.source_endpoint_id),
          }
        : {}),
    };

    setError(null);
    createMutation.mutate(payload as any, {
      onSuccess: (result: AnyRecord) => {
        const id = String(result.identifier ?? result.id ?? "");
        if (id) {
          navigate(`${backPath.replace(/\/new$/, "")}/${id}`);
        } else {
          navigate(backPath);
        }
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create batch migration. Please try again.";
        setError(message);
      },
    });
  }, [
    canSubmit,
    name,
    strategy,
    concurrency,
    waveSize,
    transferMethod,
    includeDatabases,
    excludePaths,
    pairs,
    hasN1,
    n1Targets,
    consolidationMode,
    createMutation,
    navigate,
    backPath,
  ]);

  const getEndpointLabel = useCallback(
    (id: string) => {
      const ep = endpoints.find((e) => String(e.id) === id);
      if (!ep) return id;
      return `${ep.name ?? ep.host}${ep.resource_type ? ` (${ep.resource_type})` : ""}`;
    },
    [endpoints],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(backPath)}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            New Batch Migration
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Configure settings and add VM pairs to migrate in bulk.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel: Settings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <div className="space-y-4">
            {/* Batch Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="e.g. Q1 Cloud Migration"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Strategy */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => { setStrategy(e.target.value as Strategy); setError(null); }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="wave">Wave</option>
                <option value="parallel">Parallel</option>
                <option value="sequential">Sequential</option>
              </select>
            </div>

            {/* Concurrency */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Concurrency
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={concurrency}
                onChange={(e) =>
                  setConcurrency(
                    Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Max VMs running at the same time within each wave.
              </p>
            </div>

            {/* Wave Size (shown only when strategy=wave) */}
            {strategy === "wave" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wave Size
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={waveSize}
                  onChange={(e) =>
                    setWaveSize(
                      Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  VMs grouped per wave. Each wave completes before the next starts.
                </p>
              </div>
            )}

            {/* Effective parallelism explanation */}
            {strategy === "wave" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    <span className="font-medium">How it works:</span> {waveSize} VMs per wave, {concurrency} running in parallel.{" "}
                    {waveSize < concurrency
                      ? <span className="text-amber-600 dark:text-amber-400">⚠ Wave size is smaller than concurrency — {concurrency - waveSize} parallel slots will be idle. Increase wave size to at least {concurrency}.</span>
                      : waveSize === concurrency
                      ? "All VMs in each wave run simultaneously."
                      : `Each wave processes ${waveSize} VMs, ${concurrency} at a time.`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Method */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transfer Method
              </label>
              <select
                value={transferMethod}
                onChange={(e) =>
                  setTransferMethod(e.target.value as "rsync" | "dd")
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="rsync">rsync</option>
                <option value="dd">dd</option>
              </select>
            </div>

            {/* Include Databases */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeDatabases}
                onChange={(e) => setIncludeDatabases(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include Databases
              </span>
            </label>

            {/* Exclude Paths */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exclude Paths
              </label>
              <textarea
                value={excludePaths}
                onChange={(e) => setExcludePaths(e.target.value)}
                placeholder="/tmp&#10;/var/cache&#10;/proc"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                One path per line. These paths will be excluded from migration.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: VM Pairs */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              VM Pairs
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                (minimum 2 required)
              </span>
            </h2>

            {/* Add pair row */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Source VM
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select source...</option>
                  {endpoints.map((ep) => (
                    <option key={String(ep.id)} value={String(ep.id)}>
                      {String(ep.name ?? ep.host ?? ep.identifier ?? ep.id)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Target VM
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select target...</option>
                  {endpoints.map((ep) => (
                    <option key={String(ep.id)} value={String(ep.id)}>
                      {String(ep.name ?? ep.host ?? ep.identifier ?? ep.id)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addPair}
                disabled={!selectedSource || !selectedTarget || selectedSource === selectedTarget}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {/* Pair list */}
            {pairs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-600">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No VM pairs added yet. Select source and target endpoints above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                      {getEndpointLabel(pair.source_endpoint_id)}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">→</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                      {getEndpointLabel(pair.target_endpoint_id)}
                    </span>
                    <button
                      onClick={() => removePair(pair.id)}
                      className="shrink-0 rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pairs.length > 0 && pairs.length < 2 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Add at least {2 - pairs.length} more pair{pairs.length === 0 ? "s" : ""} to continue.
              </p>
            )}
          </div>

          {/* N+1 Consolidation Warning */}
          {hasN1 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className="text-amber-600 dark:text-amber-400"
                />
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  N+1 Consolidation Detected
                </h3>
              </div>

              <div className="mb-3 space-y-1.5">
                {n1Targets.map((t) => (
                  <div
                    key={t.targetId}
                    className="text-xs text-amber-700 dark:text-amber-300"
                  >
                    <span className="font-medium">
                      {t.sourceNames.join(", ")}
                    </span>{" "}
                    → <span className="font-medium">{t.targetName}</span>
                  </div>
                ))}
              </div>

              {/* Consolidation Mode Selector */}
              <div className="space-y-2">
                <label className="mb-1 block text-xs font-medium text-amber-800 dark:text-amber-300">
                  Consolidation Mode
                </label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-white p-3 transition hover:border-amber-300 dark:border-amber-700 dark:bg-gray-800 dark:hover:border-amber-600">
                    <input
                      type="radio"
                      name="consolidation_mode"
                      value="namespace_isolated"
                      checked={consolidationMode === "namespace_isolated"}
                      onChange={() => setConsolidationMode("namespace_isolated")}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <SplitSquareHorizontal
                          size={14}
                          className="text-amber-600 dark:text-amber-400"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Namespace Isolated
                        </span>
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Each source is placed in its own directory on the target. No file conflicts.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-white p-3 transition hover:border-amber-300 dark:border-amber-700 dark:bg-gray-800 dark:hover:border-amber-600">
                    <input
                      type="radio"
                      name="consolidation_mode"
                      value="merge"
                      checked={consolidationMode === "merge"}
                      onChange={() => setConsolidationMode("merge")}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Merge
                          size={14}
                          className="text-amber-600 dark:text-amber-400"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Merge
                        </span>
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Advanced
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        All sources are merged into the target root. Files may overwrite each other.
                      </p>
                    </div>
                  </label>
                </div>

                {consolidationMode === "merge" && (
                  <>
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                      <ShieldAlert
                        size={16}
                        className="mt-0.5 shrink-0 text-red-500"
                      />
                      <p className="text-xs text-red-700 dark:text-red-400">
                        Merge mode can cause file overwrites when multiple sources
                        contain files at the same path. Data loss may occur. Use
                        only if you are certain there are no overlapping files.
                      </p>
                    </div>

                    {/* Merge Source Write Order */}
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-amber-800 dark:text-amber-300">
                        Source Write Order
                      </label>
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        The <span className="font-medium">last source</span> in the list wins file conflicts (overwrites earlier sources).
                      </p>
                      <div className="space-y-1.5">
                        {pairs
                          .filter((p) => n1Targets.some((t) => t.targetId === p.target_endpoint_id))
                          .map((p, i, arr) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                            >
                              <span className="w-5 text-center text-xs text-gray-400">{i + 1}</span>
                              <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                                {getEndpointLabel(p.source_endpoint_id)}
                              </span>
                              <div className="flex gap-0.5">
                                <button
                                  type="button"
                                  disabled={i === 0}
                                  onClick={() => {
                                    const newPairs = [...pairs];
                                    const pairIdx = pairs.indexOf(p);
                                    if (pairIdx > 0) {
                                      [newPairs[pairIdx - 1], newPairs[pairIdx]] = [newPairs[pairIdx], newPairs[pairIdx - 1]];
                                      setPairs(newPairs);
                                    }
                                  }}
                                  className="rounded p-0.5 text-gray-400 transition hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={i === arr.length - 1}
                                  onClick={() => {
                                    const newPairs = [...pairs];
                                    const pairIdx = pairs.indexOf(p);
                                    if (pairIdx < newPairs.length - 1) {
                                      [newPairs[pairIdx], newPairs[pairIdx + 1]] = [newPairs[pairIdx + 1], newPairs[pairIdx]];
                                      setPairs(newPairs);
                                    }
                                  }}
                                  className="rounded p-0.5 text-gray-400 transition hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                              {i === arr.length - 1 && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  WINS
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <XCircle size={16} className="shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          onClick={() => navigate(backPath)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {createMutation.isPending ? "Creating..." : "Create Batch Migration"}
        </button>
      </div>
    </div>
  );
};

export default BatchMigrationWizard;
