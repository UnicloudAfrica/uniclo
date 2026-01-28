import React from "react";
import { Mail, Phone, Eye, Star } from "lucide-react";
import LeadScoreIndicator from "./LeadScoreIndicator";

/**
 * LeadCard - Card view for individual lead
 */
const LeadCard = ({ lead, onView, onEmail, onCall, onToggleFavorite }) => {
    const getStatusColorClass = (status) => {
        switch (status) {
            case "new":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "contacted":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "qualified":
                return "bg-green-100 text-green-800 border-green-200";
            case "proposal_sent":
                return "bg-indigo-100 text-indigo-800 border-indigo-200";
            case "negotiating":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "closed_won":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "closed_lost":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getPriorityBadge = (score) => {
        if (score >= 80) return { label: "High", class: "bg-red-100 text-red-800 border-red-300" };
        if (score >= 60) return { label: "Medium", class: "bg-yellow-100 text-yellow-800 border-yellow-300" };
        return { label: "Low", class: "bg-gray-100 text-gray-600 border-gray-300" };
    };

    const formatStatusForDisplay = (status) => {
        return status.replace(/_/g, " ");
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const leadScore = lead.score || 0; // Use real score from backend
    const priority = getPriorityBadge(leadScore);

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[rgb(var(--theme-color-300))] hover:shadow-lg">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-color)] text-lg font-bold text-white">
                        {lead.first_name?.[0]}{lead.last_name?.[0]}
                    </div>

                    {/* Name & Company */}
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            {lead.first_name} {lead.last_name}
                        </h3>
                        <p className="text-sm text-slate-500">{lead.company || "—"}</p>
                    </div>
                </div>

                {/* Priority Badge & Favorite */}
                <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priority.class}`}>
                        {priority.label}
                    </span>
                    <button
                        type="button"
                        onClick={() => onToggleFavorite?.(lead)}
                        className="rounded-full p-1 transition hover:bg-slate-100"
                        title={lead.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Star
                            className={`h-4 w-4 ${lead.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`}
                        />
                    </button>
                </div>
            </div>

            {/* Contact Info */}
            <div className="mb-4 space-y-1">
                <p className="text-sm text-slate-600">{lead.email}</p>
                {lead.phone && <p className="text-xs text-slate-400">{lead.phone}</p>}
            </div>

            {/* Status & Score */}
            <div className="mb-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusColorClass(lead.status)}`}>
                    {formatStatusForDisplay(lead.status)}
                </span>
                <LeadScoreIndicator score={leadScore} size="sm" showLabel={false} />
            </div>

            {/* Meta Info */}
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>Last contact: {formatTimeAgo(lead.created_at)}</span>
                {lead.source && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium capitalize">
                        {lead.source}
                    </span>
                )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onEmail?.(lead)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[rgb(var(--theme-color-300))] hover:bg-[rgb(var(--theme-color-50))] hover:text-[var(--theme-color)]"
                >
                    <Mail className="h-4 w-4" />
                    Email
                </button>
                <button
                    type="button"
                    onClick={() => onCall?.(lead)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[rgb(var(--theme-color-300))] hover:bg-[rgb(var(--theme-color-50))] hover:text-[var(--theme-color)]"
                >
                    <Phone className="h-4 w-4" />
                    Call
                </button>
                <button
                    type="button"
                    onClick={() => onView?.(lead)}
                    className="flex items-center justify-center rounded-lg border border-[rgba(var(--theme-color-rgb),0.2)] bg-[var(--theme-color)] px-3 py-2 text-white transition hover:bg-[rgb(var(--theme-color-700))]"
                >
                    <Eye className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default LeadCard;
