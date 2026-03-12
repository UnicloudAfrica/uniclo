import React, { useMemo } from "react";
import type { Lead } from "@/types/lead";
import LeadScoreIndicator from "../../../../adminDashboard/components/LeadScoreIndicator";
import QuickActionsMenu from "../../../../adminDashboard/components/QuickActionsMenu";
import {
  formatCreatedAt,
  formatStatusForDisplay,
  getLeadIdentifier,
  getStatusColorClass,
  normalizeId,
} from "./leads-dashboard.utils";
import type { ExplorerColumn, QuickActionLead } from "./leads-dashboard.types";

interface UseLeadColumnsOptions {
  selectedLeads: string[];
  filteredLeads: Lead[];
  handleSelectAll: () => void;
  handleSelectLead: (leadId: string | number | null | undefined) => void;
  handleQuickView: (lead: QuickActionLead) => void;
  handleQuickEdit: (lead: QuickActionLead) => void;
  handleQuickEmail: (lead: QuickActionLead) => void;
  handleQuickCall: (lead: QuickActionLead) => void;
  handleQuickDelete: (lead: QuickActionLead) => void;
  handleQuickAssign: (lead: QuickActionLead) => void;
}

export function useLeadColumns({
  selectedLeads,
  filteredLeads,
  handleSelectAll,
  handleSelectLead,
  handleQuickView,
  handleQuickEdit,
  handleQuickEmail,
  handleQuickCall,
  handleQuickDelete,
  handleQuickAssign,
}: UseLeadColumnsOptions): ExplorerColumn[] {
  return useMemo<ExplorerColumn[]>(
    () => [
      {
        header: (
          <input
            type="checkbox"
            checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />
        ),
        key: "select",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <input
              type="checkbox"
              checked={selectedLeads.includes(normalizeId(getLeadIdentifier(lead)))}
              onChange={() => handleSelectLead(getLeadIdentifier(lead))}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
            />
          );
        },
      },
      {
        header: "Lead",
        key: "name",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                {lead.first_name} {lead.last_name}
              </span>
              <span className="text-xs text-slate-400">{lead.company ?? "\u2014"}</span>
            </div>
          );
        },
      },
      {
        header: "Contact",
        key: "email",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <div className="flex flex-col text-sm text-slate-600">
              <span>{lead.email}</span>
              {lead.phone && <span className="text-xs text-slate-400">{lead.phone}</span>}
            </div>
          );
        },
      },
      {
        header: "Stage",
        key: "status",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColorClass(
                lead.status
              )}`}
            >
              {formatStatusForDisplay(lead.status)}
            </span>
          );
        },
      },
      {
        header: "Score",
        key: "score",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return <LeadScoreIndicator score={lead.score || 0} size="sm" showLabel={false} />;
        },
      },
      {
        header: "Source",
        key: "source",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
              {lead.source || "\u2014"}
            </span>
          );
        },
      },
      {
        header: "Lead type",
        key: "lead_type",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <span className="text-sm font-medium capitalize text-slate-700">
              {lead.lead_type || "\u2014"}
            </span>
          );
        },
      },
      {
        header: "Created",
        key: "created_at",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return <span className="text-sm text-slate-500">{formatCreatedAt(lead.created_at)}</span>;
        },
      },
      {
        header: "",
        key: "actions",
        align: "right",
        render: (row: Record<string, unknown>) => {
          const lead = row as Lead;
          return (
            <QuickActionsMenu
              lead={lead}
              onView={handleQuickView}
              onEdit={handleQuickEdit}
              onEmail={handleQuickEmail}
              onCall={handleQuickCall}
              onDelete={handleQuickDelete}
              onAssign={handleQuickAssign}
            />
          );
        },
      },
    ],
    [
      selectedLeads,
      filteredLeads,
      handleSelectAll,
      handleSelectLead,
      handleQuickView,
      handleQuickEdit,
      handleQuickEmail,
      handleQuickCall,
      handleQuickDelete,
      handleQuickAssign,
    ]
  );
}
