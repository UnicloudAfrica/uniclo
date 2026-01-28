import React from "react";
import {
  Activity,
  Clock,
  Layers,
  MapPin,
  Plus,
  Server,
  Shield,
  Wifi,
  LucideIcon,
} from "lucide-react";
import { ModernCard, StatusPill } from "../../ui";
import { designTokens } from "../../../../styles/designTokens";

interface NeutralPillProps {
  icon?: LucideIcon;
  label: string | number;
}

const NeutralPill: React.FC<NeutralPillProps> = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {label}
  </span>
);

interface SummaryMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string;
}

const SummaryMetricCard: React.FC<SummaryMetricCardProps> = ({
  icon: Icon,
  label,
  value,
  helper,
}) => (
  <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-sm backdrop-blur-sm">
    <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {helper ? <p className="text-xs text-white/70">{helper}</p> : null}
    </div>
  </div>
);

interface MetadataItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface ProjectStatusVariant {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

interface ProjectDetailsHeroProps {
  project: any;
  projectStatusVariant?: ProjectStatusVariant;
  healthPercent?: number;
  metadataItems?: MetadataItem[];
  summaryMetrics?: SummaryMetricCardProps[];
  canCreateInstances?: boolean;
  missingInstancePrereqs?: string[];
  onAddInstance?: () => void;
  onManageEdge?: () => void;
  infrastructureStepLabel?: string;
}

const ProjectDetailsHero: React.FC<ProjectDetailsHeroProps> = ({
  project,
  projectStatusVariant = {
    label: "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  healthPercent,
  metadataItems = [],
  summaryMetrics = [],
  canCreateInstances,
  missingInstancePrereqs = [],
  onAddInstance,
  onManageEdge,
  infrastructureStepLabel,
}) => {
  const heroProjectIdentifier = project?.identifier;
  const heroProviderLabel = project?.provider || "Provider";
  const heroRegionLabel = (project?.region || "Region").toUpperCase();
  const heroDescription =
    project?.description ||
    "Configure infrastructure, track instances, and manage networking resources for this project.";

  return (
    <ModernCard variant="glass" padding="none" className="overflow-hidden">
      <div
        className="brand-hero p-6 md:p-8"
        style={{
          borderRadius: designTokens.borderRadius.xl,
        }}
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              Project Control Center
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill
                status={projectStatusVariant?.label?.toLowerCase() || "unknown"}
                label={projectStatusVariant?.label || "Unknown"}
                showIcon
              />
              <NeutralPill icon={Shield} label={heroProjectIdentifier || "—"} />
              <NeutralPill icon={Layers} label={heroProviderLabel} />
              <NeutralPill icon={MapPin} label={heroRegionLabel} />
              <NeutralPill icon={Activity} label={infrastructureStepLabel || "—"} />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold md:text-4xl">
                {project?.name || "Project Overview"}
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-white/80">{heroDescription}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-6 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={onAddInstance}
                disabled={!canCreateInstances}
                title={
                  canCreateInstances
                    ? "Launch multi-instance workflow"
                    : `Complete the following before launching an instance: ${missingInstancePrereqs.join(
                        ", "
                      )}.`
                }
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  canCreateInstances
                    ? "bg-white text-[--theme-color] hover:bg-white/90 hover:text-[--theme-color]"
                    : "bg-white/20 text-white/60 cursor-not-allowed"
                }`}
              >
                <Plus className="h-4 w-4" />
                Add Instance
              </button>
              <button
                type="button"
                onClick={onManageEdge}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                <Wifi className="h-4 w-4" />
                Manage Edge
              </button>
            </div>
            <div className="flex items-center gap-6 lg:gap-8">
              <div className="text-center">
                <div
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20"
                  style={{
                    background: `conic-gradient(rgba(255,255,255,0.9) ${healthPercent || 0}%, rgba(255,255,255,0.2) 0)`,
                  }}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-semibold text-[--theme-color]">
                    {healthPercent || 0}%
                  </div>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-white/70">
                  Infrastructure health
                </p>
              </div>
              <div className="grid gap-3 text-sm text-white/85">
                {metadataItems.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs uppercase tracking-wide text-white/60">{item.label}</p>
                    <p className="mt-1 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <SummaryMetricCard key={metric.label} {...metric} />
          ))}
        </div>
        <div className="pointer-events-none absolute right-6 top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
      </div>
      {!canCreateInstances && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          <p className="font-semibold text-amber-900">Instances locked</p>
          <p className="mt-1">
            Complete the following before provisioning new instances:{" "}
            <span className="font-medium">{missingInstancePrereqs.join(", ")}</span>.
          </p>
        </div>
      )}
    </ModernCard>
  );
};

export default ProjectDetailsHero;
