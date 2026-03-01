interface PipelineStage {
  id: string | number;
  label: string;
  count: number;
  color?: string;
}

interface PipelineFunnelProps {
  stages?: PipelineStage[];
  onStageClick?: (stageId: string | number) => void;
}

/**
 * PipelineFunnel - Visual funnel chart showing conversion rates
 */
const PipelineFunnel = ({ stages = [], onStageClick }: PipelineFunnelProps) => {
  if (!stages || stages.length === 0) {
    return null;
  }

  // Calculate max count for width scaling
  const maxCount = Math.max(...stages.map((s: PipelineStage) => s.count || 0));

  return (
    <div className="space-y-2">
      {stages.map((stage: PipelineStage, index: number) => {
        const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const previousStage = stages[index - 1];
        const conversionRate =
          previousStage && previousStage.count > 0
            ? Math.round((stage.count / previousStage.count) * 100)
            : 100;

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onStageClick?.(stage.id)}
            className="group w-full text-left transition hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              {/* Funnel bar */}
              <div className="relative flex-1">
                <div className="h-10 w-full rounded-lg bg-slate-100">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${stage.color || "bg-primary-500"}`}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div className="flex h-full items-center justify-between px-3 text-white">
                      <span className="text-sm font-semibold">{stage.label}</span>
                      <span className="text-sm font-bold">{stage.count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion rate */}
              {index > 0 && (
                <div className="flex w-16 items-center justify-center">
                  <span className="text-xs font-semibold text-slate-600">{conversionRate}%</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PipelineFunnel;
