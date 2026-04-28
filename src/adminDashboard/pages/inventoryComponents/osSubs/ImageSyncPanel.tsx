import { useState } from "react";
import { RefreshCw, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useTriggerImageSync, useImageSyncComparison } from "@/hooks/adminHooks/imageSyncHooks";
import { ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";

interface ImageSyncPanelProps {
  region: string;
  provider?: string;
}

const ImageSyncPanel = ({ region, provider = "zadara" }: ImageSyncPanelProps) => {
  const [lastResult, setLastResult] = useState<{
    images_synced: number;
    products_created: number;
    tenant_prices_created: number;
    stale_marked: number;
  } | null>(null);

  const { data: comparisonRaw, isFetching: isComparing } = useImageSyncComparison(region, provider);
  const comparison = comparisonRaw as { active?: number; inactive?: number; missing_product?: number } | undefined;
  const syncMutation = useTriggerImageSync();

  const handleSync = () => {
    setLastResult(null);
    syncMutation.mutate(
      { region, provider },
      {
        onSuccess: (res) => {
          setLastResult(res.data);
          ToastUtils.success(
            `Synced ${res.data.images_synced} images. ${res.data.products_created} new products created.`
          );
        },
        onError: () => {
          ToastUtils.error("Image sync failed. Check the logs for details.");
        },
      }
    );
  };

  if (!region) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Comparison stats */}
        <div className="flex flex-wrap items-center gap-6">
          {isComparing ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking...
            </div>
          ) : comparison ? (
            <>
              <StatBadge
                icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                label="Active"
                value={comparison.active ?? 0}
              />
              <StatBadge
                icon={<XCircle className="h-3.5 w-3.5 text-slate-400" />}
                label="Inactive"
                value={comparison.inactive ?? 0}
              />
              {(comparison.missing_product ?? 0) > 0 && (
                <StatBadge
                  icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  label="Missing pricing"
                  value={comparison.missing_product ?? 0}
                />
              )}
            </>
          ) : null}
        </div>

        {/* Sync button + last result */}
        <div className="flex items-center gap-3">
          {lastResult && (
            <span className="text-xs text-slate-500">
              {lastResult.images_synced} synced
              {lastResult.products_created > 0 && ` · ${lastResult.products_created} new`}
              {lastResult.stale_marked > 0 && ` · ${lastResult.stale_marked} stale`}
            </span>
          )}
          <ModernButton
            size="sm"
            variant="secondary"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncMutation.isPending ? "Syncing..." : "Sync Now"}
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

const StatBadge = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-1.5 text-sm">
    {icon}
    <span className="font-medium text-slate-700">{value}</span>
    <span className="text-slate-400">{label}</span>
  </div>
);

export default ImageSyncPanel;
