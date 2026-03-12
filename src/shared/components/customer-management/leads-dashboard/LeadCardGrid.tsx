import React from "react";
import { Loader2, UserPlus } from "lucide-react";
import type { Lead } from "@/types/lead";
import LeadCard from "../../../../adminDashboard/components/LeadCard";
import { isLead } from "./leads-dashboard.utils";
import type { LeadCardLead } from "./leads-dashboard.types";

interface LeadCardGridProps {
  leads: Lead[];
  isLoading: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onViewLead: (lead: Lead) => void;
  onEmailLead: (lead: Lead) => void;
  onCallLead: (lead: Lead) => void;
  onToggleFavorite: (lead: Lead) => void;
}

const LeadCardGrid: React.FC<LeadCardGridProps> = ({
  leads,
  isLoading,
  searchValue,
  onSearchChange,
  onViewLead,
  onEmailLead,
  onCallLead,
  onToggleFavorite,
}) => {
  return (
    <div className="space-y-4">
      {/* Search for card view */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : leads.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onView={(value: LeadCardLead) => {
                if (isLead(value)) {
                  onViewLead(value);
                }
              }}
              onEmail={(value: LeadCardLead) => {
                if (isLead(value)) {
                  onEmailLead(value);
                }
              }}
              onCall={(value: LeadCardLead) => {
                if (isLead(value)) {
                  onCallLead(value);
                }
              }}
              onToggleFavorite={(value: LeadCardLead) => {
                if (isLead(value)) {
                  void onToggleFavorite(value);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
            <UserPlus className="h-5 w-5" />
          </span>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">No leads found</h3>
          <p className="mb-4 text-sm text-slate-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default LeadCardGrid;
