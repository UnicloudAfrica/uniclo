import React from "react";
import { AlertTriangle, Flag, ArrowUpCircle, Inbox, Loader2 } from "lucide-react";
import { ModernButton } from "../ui";
import {
  Thread,
  ESCALATION_CONFIG,
  formatThreadDate,
  getStatusClasses,
  getPriorityClasses,
  isSlaAtRisk,
} from "./threadTypes";

interface ThreadTableProps {
  threads: Thread[];
  isLoading?: boolean;
  onView: (thread: Thread) => void;
  onEscalate?: (thread: Thread) => void;
  showEscalation?: boolean;
  showUser?: boolean;
  showTenant?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ReactNode;
}

export const ThreadTable: React.FC<ThreadTableProps> = ({
  threads,
  isLoading = false,
  onView,
  onEscalate,
  showEscalation = true,
  showUser = true,
  showTenant = false,
  emptyMessage = "No threads found",
  emptyTitle = "No tickets found",
  emptyDescription,
  emptyAction,
  emptyIcon,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        Loading tickets...
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/90 p-10 text-center text-slate-500 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          {emptyIcon || <Inbox className="h-5 w-5" />}
        </div>
        <h3 className="text-sm font-semibold text-slate-700">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-slate-500">{emptyDescription || emptyMessage}</p>
        {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Thread
              </th>
              {showUser && (
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 md:table-cell">
                  User
                </th>
              )}
              {showTenant && (
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 lg:table-cell">
                  Tenant
                </th>
              )}
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500 sm:table-cell">
                Priority
              </th>
              {showEscalation && (
                <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500 md:table-cell">
                  Escalation
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 lg:table-cell">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {threads.map((thread) => {
              const escalationLevel = thread.escalation_level ?? 0;
              const escalationConfig = ESCALATION_CONFIG[escalationLevel] || ESCALATION_CONFIG[0];
              const EscalationIcon = escalationConfig?.icon;
              const slaRisk = isSlaAtRisk(thread);
              const statusValue = thread.status || "open";
              const isOpen = statusValue !== "resolved" && statusValue !== "closed";
              const priority = thread.priority || "medium";
              const messageCount = thread.messages_count ?? thread.messages?.length ?? 0;

              return (
                <tr key={thread.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {slaRisk && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                      )}
                      <div>
                        <div className="line-clamp-1 text-sm font-medium text-slate-900">
                          {thread.subject}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(thread.uuid || String(thread.id)).slice(0, 8)}... • {messageCount} msgs
                        </div>
                      </div>
                    </div>
                  </td>
                  {showUser && (
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="text-sm text-slate-700">{thread.user?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{thread.user?.email}</div>
                    </td>
                  )}
                  {showTenant && (
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="text-sm text-slate-700">{thread.tenant?.name || "-"}</div>
                    </td>
                  )}
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <div
                      className={`flex items-center justify-center gap-1 ${getPriorityClasses(priority)}`}
                    >
                      <Flag className="w-4 h-4" />
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                  </td>
                  {showEscalation && (
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      <div
                        className={`flex items-center justify-center gap-1 ${escalationConfig?.color}`}
                      >
                        <EscalationIcon className="w-4 h-4" />
                        <span className="text-sm">{escalationConfig?.label}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(statusValue)}`}
                    >
                      {statusValue.replace("_", " ")}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-500 lg:table-cell">
                    {formatThreadDate(thread.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <ModernButton variant="ghost" size="sm" onClick={() => onView(thread)}>
                        View
                      </ModernButton>
                      {onEscalate && isOpen && escalationLevel < 3 && (
                        <ModernButton
                          variant="outline"
                          size="sm"
                          onClick={() => onEscalate(thread)}
                          className="hidden sm:inline-flex"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </ModernButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThreadTable;
