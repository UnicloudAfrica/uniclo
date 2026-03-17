import { useCallback, useMemo, useState } from "react";
import { Check, AlertTriangle, XCircle, Loader2, Globe } from "lucide-react";
import ModernModal from "./ui/ModernModal";
import type { ModalAction } from "./ui/ModernModal";
import ModernButton from "./ui/ModernButton";
import type {
  ApplyToRegionsPayload,
  ApplyToRegionsResult,
  ApplyToRegionsSkipped,
} from "@/hooks/shared/useApplyPriceToRegions";

export interface ApplyToRegionsItem {
  productable_type: string;
  productable_id: string | number;
  product_name: string;
  price_usd: number;
}

interface RegionOption {
  code: string;
  name: string;
  provider?: string;
  country_code?: string;
}

export interface ApplyToRegionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ApplyToRegionsItem[];
  provider: string;
  sourceRegion: string;
  regions: RegionOption[];
  onApply: (payload: ApplyToRegionsPayload) => Promise<ApplyToRegionsResult>;
  isApplying: boolean;
}

type Phase = "selecting" | "applying" | "results";

const ApplyToRegionsModal: React.FC<ApplyToRegionsModalProps> = ({
  isOpen,
  onClose,
  items,
  provider,
  sourceRegion,
  regions,
  onApply,
  isApplying,
}) => {
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("selecting");
  const [result, setResult] = useState<ApplyToRegionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableRegions = useMemo(
    () =>
      regions.filter(
        (r) =>
          r.code !== sourceRegion &&
          (!r.provider || r.provider === provider)
      ),
    [regions, sourceRegion, provider]
  );

  const handleReset = useCallback(() => {
    setSelectedRegions(new Set());
    setPhase("selecting");
    setResult(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const toggleRegion = useCallback((code: string) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedRegions.size === availableRegions.length) {
      setSelectedRegions(new Set());
    } else {
      setSelectedRegions(new Set(availableRegions.map((r) => r.code)));
    }
  }, [availableRegions, selectedRegions.size]);

  const handleApply = useCallback(async () => {
    if (selectedRegions.size === 0) {
      return;
    }

    setPhase("applying");
    setError(null);

    try {
      const payload: ApplyToRegionsPayload = {
        provider,
        regions: Array.from(selectedRegions),
        items: items.map((item) => ({
          productable_type: item.productable_type,
          productable_id: item.productable_id,
          price_usd: item.price_usd,
        })),
      };

      const res = await onApply(payload);
      setResult(res);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setPhase("results");
    }
  }, [selectedRegions, provider, items, onApply]);

  const allSelected = availableRegions.length > 0 && selectedRegions.size === availableRegions.length;

  const selectingActions: ModalAction[] = [
    { label: "Cancel", variant: "ghost", onClick: handleClose },
    {
      label: `Apply to ${selectedRegions.size} region(s)`,
      variant: "primary",
      onClick: () => void handleApply(),
      disabled: selectedRegions.size === 0 || isApplying,
    },
  ];

  const applyingActions: ModalAction[] = [
    { label: "Cancel", variant: "ghost", onClick: () => {}, disabled: true },
    { label: "Applying...", variant: "primary", onClick: () => {}, disabled: true },
  ];

  const resultsActions: ModalAction[] = [
    { label: "Done", variant: "primary", onClick: handleClose },
  ];

  const actions =
    phase === "selecting" ? selectingActions : phase === "applying" ? applyingActions : resultsActions;

  const subtitle = items.length === 1
    ? items[0]?.product_name ?? ""
    : `${items.length} products selected`;

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Apply pricing to other regions"
      subtitle={subtitle}
      size="md"
      actions={actions}
    >
      {phase === "selecting" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>
              Apply pricing from <strong>{sourceRegion}</strong> to other regions.
              {items.length === 1 && (
                <span className="ml-1 font-medium text-slate-900">
                  ${Number(items[0]?.price_usd ?? 0).toFixed(2)}/mo
                </span>
              )}
            </p>
            {items.length > 1 && (
              <p className="mt-1 text-xs text-slate-500">
                {items.length} product(s) will be replicated with their current prices.
              </p>
            )}
          </div>

          {/* Select All toggle */}
          {availableRegions.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target regions
              </p>
              <ModernButton variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? "Deselect All" : "Select All"}
              </ModernButton>
            </div>
          )}

          {/* Region checklist */}
          {availableRegions.length === 0 ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700">
              <Globe className="mx-auto mb-2 h-6 w-6 text-amber-400" />
              No other regions available for this provider.
            </div>
          ) : (
            <div className="max-h-[280px] space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-1">
              {availableRegions.map((region) => {
                const isSelected = selectedRegions.has(region.code);
                return (
                  <label
                    key={region.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isSelected
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRegion(region.code)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">{region.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {region.code}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {phase === "applying" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Applying prices to {selectedRegions.size} region(s)...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {items.length} product(s) being replicated.
            </p>
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <>
              {result.applied > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <p>
                    <strong>{result.applied}</strong> pricing entr{result.applied === 1 ? "y" : "ies"} applied
                    successfully.
                  </p>
                </div>
              )}

              {result.skipped.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-amber-700">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {result.skipped.length} skipped
                  </div>
                  <ul className="mt-2 max-h-[160px] space-y-1 overflow-y-auto text-xs text-amber-600">
                    {result.skipped.map((skip: ApplyToRegionsSkipped, idx: number) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="shrink-0 font-medium">{skip.region}:</span>
                        <span>{skip.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.applied === 0 && result.skipped.length === 0 && !error && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No changes were made.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ModernModal>
  );
};

export default ApplyToRegionsModal;
