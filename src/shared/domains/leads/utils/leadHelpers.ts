/**
 * Lead Helper Utilities
 * Shared utility functions for lead/CRM operations
 */

import type { Lead, LeadStatus, LeadPriority, LeadStats } from "../types/lead.types";

/**
 * Get lead status variant
 */
export const getLeadStatusVariant = (status: LeadStatus) => {
  switch (status) {
    case "new":
      return {
        label: "New",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
    case "contacted":
      return {
        label: "Contacted",
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        dot: "bg-cyan-500",
      };
    case "qualified":
      return {
        label: "Qualified",
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-500",
      };
    case "proposal":
      return {
        label: "Proposal",
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        dot: "bg-indigo-500",
      };
    case "negotiation":
      return {
        label: "Negotiation",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "won":
      return {
        label: "Won",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "lost":
      return {
        label: "Lost",
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
      };
    case "on_hold":
      return {
        label: "On Hold",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
      };
    default:
      return {
        label: "Unknown",
        bg: "bg-gray-50",
        text: "text-gray-500",
        dot: "bg-gray-300",
      };
  }
};

/**
 * Get priority variant
 */
export const getLeadPriorityVariant = (priority: LeadPriority) => {
  switch (priority) {
    case "critical":
      return { label: "Critical", color: "text-red-700", icon: "🔴" };
    case "high":
      return { label: "High", color: "text-orange-700", icon: "🟠" };
    case "medium":
      return { label: "Medium", color: "text-yellow-700", icon: "🟡" };
    case "low":
      return { label: "Low", color: "text-gray-600", icon: "⚪" };
    default:
      return { label: "Normal", color: "text-gray-500", icon: "○" };
  }
};

/**
 * Calculate lead statistics
 */
export const calculateLeadStats = (leads: Lead[]): LeadStats => {
  const stats = leads.reduce(
    (acc, lead) => {
      acc.total++;

      switch (lead.status) {
        case "new":
          acc.new++;
          break;
        case "qualified":
          acc.qualified++;
          break;
        case "proposal":
        case "negotiation":
          acc.proposal++;
          break;
        case "won":
          acc.won++;
          acc.total_value = (acc.total_value || 0) + (lead.estimated_value || 0);
          break;
        case "lost":
          acc.lost++;
          break;
      }

      return acc;
    },
    {
      total: 0,
      new: 0,
      qualified: 0,
      proposal: 0,
      won: 0,
      lost: 0,
      total_value: 0,
      conversion_rate: 0,
    }
  );

  // Calculate conversion rate
  const closed = stats.won + stats.lost;
  stats.conversion_rate = closed > 0 ? (stats.won / closed) * 100 : 0;

  return stats;
};

/**
 * Calculate lead score (0-100)
 */
export const calculateLeadScore = (lead: Lead): number => {
  let score = 0;

  // Status contributes to score
  const statusScores: Record<LeadStatus, number> = {
    new: 10,
    contacted: 20,
    qualified: 40,
    proposal: 60,
    negotiation: 80,
    won: 100,
    lost: 0,
    on_hold: 10,
  };
  score += statusScores[lead.status] || 0;

  // Priority adds weight
  if (lead.priority === "critical") score += 10;
  if (lead.priority === "high") score += 5;

  // Has estimated value
  if (lead.estimated_value && lead.estimated_value > 0) score += 10;

  // Has documents
  if (lead.documents && lead.documents.length > 0) score += 5;

  // Recent activity
  if (lead.last_contacted_at) {
    const daysSinceContact = daysSince(lead.last_contacted_at);
    if (daysSinceContact < 7) score += 5;
  }

  return Math.min(Math.max(score, 0), 100);
};

/**
 * Days since date
 */
export const daysSince = (date: string): number => {
  const then = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Format currency
 */
export const formatLeadValue = (value: number | undefined, currency: string = "USD"): string => {
  if (!value) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Get lead age
 */
export const getLeadAge = (createdAt: string): string => {
  const days = daysSince(createdAt);

  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;

  const months = Math.floor(days / 30);
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;

  const years = Math.floor(months / 12);
  return years === 1 ? "1 year" : `${years} years`;
};

/**
 * Check if follow-up is overdue
 */
export const isFollowUpOverdue = (lead: Lead): boolean => {
  if (!lead.next_follow_up_at) return false;
  if (lead.status === "won" || lead.status === "lost") return false;

  const followUpDate = new Date(lead.next_follow_up_at);
  const now = new Date();

  return now > followUpDate;
};

/**
 * Filter leads by search
 */
export const filterLeadsBySearch = (leads: Lead[], searchQuery: string): Lead[] => {
  if (!searchQuery.trim()) return leads;

  const query = searchQuery.toLowerCase();
  return leads.filter(
    (lead) =>
      lead.company_name.toLowerCase().includes(query) ||
      lead.contact_name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query)
  );
};

/**
 * Sort leads by score (highest first)
 */
export const sortLeadsByScore = (leads: Lead[]): Lead[] => {
  return [...leads].sort((a, b) => {
    const scoreA = a.score ?? calculateLeadScore(a);
    const scoreB = b.score ?? calculateLeadScore(b);
    return scoreB - scoreA;
  });
};

/**
 * Get next stage in pipeline
 */
export const getNextStage = (currentStatus: LeadStatus): LeadStatus | null => {
  const pipeline: LeadStatus[] = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "negotiation",
    "won",
  ];

  const currentIndex = pipeline.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === pipeline.length - 1) return null;

  return pipeline[currentIndex + 1];
};
