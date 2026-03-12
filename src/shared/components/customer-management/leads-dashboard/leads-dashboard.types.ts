import type React from "react";
import type QuickActionsMenu from "../../../../adminDashboard/components/QuickActionsMenu";
import type LeadCard from "../../../../adminDashboard/components/LeadCard";
import type ResourceDataExplorer from "../../../../adminDashboard/components/ResourceDataExplorer";

export const STATUS_CONFIG = {
  all: {
    label: "All leads",
    description: "Entire pipeline",
    tone: "bg-slate-900 text-white",
    chip: "bg-slate-800 text-slate-100",
    color: "bg-gradient-to-r from-slate-600 to-slate-700",
  },
  new: {
    label: "New",
    description: "Awaiting contact",
    tone: "bg-sky-500/10 text-sky-600",
    chip: "bg-sky-500/15 text-sky-600",
    color: "bg-gradient-to-r from-sky-500 to-sky-600",
  },
  contacted: {
    label: "Contacted",
    description: "Initial outreach",
    tone: "bg-amber-500/10 text-amber-600",
    chip: "bg-amber-500/15 text-amber-600",
    color: "bg-gradient-to-r from-amber-500 to-amber-600",
  },
  qualified: {
    label: "Qualified",
    description: "Ready for proposal",
    tone: "bg-green-500/10 text-green-600",
    chip: "bg-green-500/15 text-green-600",
    color: "bg-gradient-to-r from-green-500 to-green-600",
  },
  proposal_sent: {
    label: "Proposal sent",
    description: "Awaiting feedback",
    tone: "bg-indigo-500/10 text-indigo-600",
    chip: "bg-indigo-500/15 text-indigo-600",
    color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
  },
  negotiating: {
    label: "Negotiating",
    description: "In discussion",
    tone: "bg-purple-500/10 text-purple-600",
    chip: "bg-purple-500/15 text-purple-600",
    color: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
  closed_won: {
    label: "Closed won",
    description: "Converted clients",
    tone: "bg-emerald-500/10 text-emerald-600",
    chip: "bg-emerald-500/15 text-emerald-600",
    color: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  },
  closed_lost: {
    label: "Closed lost",
    description: "Lost opportunities",
    tone: "bg-rose-500/10 text-rose-600",
    chip: "bg-rose-500/15 text-rose-600",
    color: "bg-gradient-to-r from-rose-500 to-rose-600",
  },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

export const STATUS_ORDER: StatusKey[] = [
  "all",
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
];

export interface LeadsDashboardProps {
  context?: "admin" | "tenant";
}

export type QuickActionsMenuProps = React.ComponentProps<typeof QuickActionsMenu>;
export type QuickActionLead = QuickActionsMenuProps["lead"];
export type LeadCardProps = React.ComponentProps<typeof LeadCard>;
export type LeadCardLead = LeadCardProps["lead"];
export type ResourceDataExplorerProps = React.ComponentProps<typeof ResourceDataExplorer>;
export type ExplorerColumn = NonNullable<ResourceDataExplorerProps["columns"]>[number];
export type UnknownRecord = Record<string, unknown>;
export type AssignUser = { id: string | number; name?: string };
export type FileApiClient = (
  method: string,
  path: string,
  payload?: Record<string, unknown>
) => Promise<unknown>;
export type StatusSegment = {
  id: StatusKey;
  count: number;
  label: string;
  description: string;
};
export type FunnelStage = {
  id: Exclude<StatusKey, "all">;
  label: string;
  count: number;
  color: string;
};
