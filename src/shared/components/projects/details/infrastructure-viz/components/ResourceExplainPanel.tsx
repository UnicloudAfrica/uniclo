/**
 * ResourceExplainPanel.tsx
 *
 * A slide-in panel that displays a detailed, novice-friendly explanation of the
 * selected cloud resource. On desktop it slides in from the right; on mobile it
 * slides up from the bottom as a bottom-sheet.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Lightbulb, ArrowRight, Info } from "lucide-react";
import { RESOURCE_EXPLANATIONS, LAYER_ORDER, type ResourceTypeId } from "../resourceExplanations";
import type { SelectedResource, InfraVizProps } from "../InfrastructureVisualization.types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResourceExplainPanelProps {
  resource: SelectedResource;
  resourceCounts: InfraVizProps["resourceCounts"];
  instanceStats: InfraVizProps["instanceStats"];
  onClose: () => void;
  highlightedTypes: ResourceTypeId[];
  onSelectResource: (resource: SelectedResource) => void;
  onNavigateToResource?: (typeId: ResourceTypeId) => void;
}

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const desktopVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { x: "100%", opacity: 0 },
};

const mobileVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { y: "100%", opacity: 0 },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResourceExplainPanel({
  resource,
  resourceCounts,
  instanceStats,
  onClose,
  highlightedTypes,
  onSelectResource,
  onNavigateToResource,
}: ResourceExplainPanelProps) {
  // SSR-safe mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const explanation = RESOURCE_EXPLANATIONS[resource.typeId];
  if (!explanation) return null;

  const Icon = explanation.icon;
  const layer = LAYER_ORDER.find((l) => l.id === explanation.layer);

  // Resolve count for this resource type
  const count =
    resource.typeId === "instances" ? instanceStats.total : (resourceCounts[resource.typeId] ?? 0);

  return (
    <AnimatePresence mode="wait">
      {/* --- Mobile backdrop overlay --- */}
      {isMobile && (
        <motion.div
          key="backdrop"
          className="absolute inset-0 z-40 bg-black/40"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />
      )}

      {/* --- Panel --- */}
      <motion.div
        key={`panel-${resource.typeId}`}
        variants={isMobile ? mobileVariants : desktopVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={
          isMobile
            ? "absolute bottom-0 left-0 right-0 z-50 flex flex-col bg-white shadow-xl border border-gray-200 rounded-t-2xl"
            : "absolute top-0 right-0 z-50 flex flex-col bg-white shadow-xl border border-gray-200 rounded-xl w-[380px] h-full"
        }
        style={isMobile ? { height: "65vh" } : undefined}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-start gap-3 p-4 pb-2">
          {/* Icon circle */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${explanation.bgColor}`}
          >
            <Icon className={`h-5 w-5 ${explanation.color}`} />
          </div>

          {/* Title + layer badge */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {explanation.label}
            </h3>
            {layer && (
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${layer.bgColor} ${layer.color}`}
              >
                {layer.label}
              </span>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Scrollable content                                                */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
          {/* --- What is this? --- */}
          <section>
            <SectionHeader icon={Info} label="What is this?" />
            <p className="text-sm text-gray-600 leading-relaxed">{explanation.explanation}</p>
          </section>

          {/* --- Building Analogy --- */}
          <section>
            <SectionHeader icon={Building2} label="Building Analogy" />
            <p className="text-sm text-gray-600 leading-relaxed">{explanation.buildingMetaphor}</p>
          </section>

          {/* --- Key Facts --- */}
          <section>
            <SectionHeader icon={Lightbulb} label="Key Facts" />
            <ul className="list-disc list-outside ml-4 space-y-1">
              {explanation.keyFacts.map((fact, idx) => (
                <li key={idx} className="text-sm text-gray-600 leading-relaxed">
                  {fact}
                </li>
              ))}
            </ul>
          </section>

          {/* --- Current Status --- */}
          <section>
            <SectionHeader icon={Info} label="Current Status" />
            <div className="text-sm text-gray-600 leading-relaxed">
              {resource.typeId === "instances" ? (
                <p>
                  <span className="font-medium text-gray-900">{instanceStats.total}</span> total
                  &mdash;{" "}
                  <span className="font-medium text-emerald-600">
                    {instanceStats.running} running
                  </span>
                  ,{" "}
                  <span className="font-medium text-gray-500">{instanceStats.stopped} stopped</span>
                  {instanceStats.provisioning != null && instanceStats.provisioning > 0 && (
                    <>
                      ,{" "}
                      <span className="font-medium text-amber-500">
                        {instanceStats.provisioning} provisioning
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p>
                  <span className="font-medium text-gray-900">{count}</span>{" "}
                  {explanation.label.toLowerCase()} configured in your infrastructure.
                </p>
              )}
            </div>
          </section>

          {/* --- Related Resources --- */}
          {explanation.relatedResources.length > 0 && (
            <section>
              <SectionHeader icon={ArrowRight} label="Related Resources" />
              <div className="flex flex-wrap gap-2">
                {explanation.relatedResources.map((relatedId) => {
                  const related = RESOURCE_EXPLANATIONS[relatedId];
                  if (!related) return null;
                  const RelatedIcon = related.icon;
                  const isHighlighted = highlightedTypes.includes(relatedId);

                  return (
                    <button
                      key={relatedId}
                      type="button"
                      onClick={() => onSelectResource({ typeId: relatedId })}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isHighlighted
                          ? `${related.bgColor} ${related.color} border-current`
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <RelatedIcon className="h-3.5 w-3.5" />
                      {related.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Footer: Go to Resource button                                     */}
        {/* ----------------------------------------------------------------- */}
        {onNavigateToResource && (
          <div className="shrink-0 border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => onNavigateToResource(resource.typeId)}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${explanation.color
                .replace("text-", "bg-")
                .replace(/-\d+$/, "-600")} hover:opacity-90`}
            >
              Go to {explanation.label}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Internal: Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: SIcon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <SIcon className="h-3.5 w-3.5 text-gray-400" />
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</h4>
    </div>
  );
}
