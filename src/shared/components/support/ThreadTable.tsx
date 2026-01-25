// @ts-nocheck
import React from "react";
import { AlertTriangle, Flag, ArrowUpCircle } from "lucide-react";
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
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        Loading threads...
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Thread
              </th>
              {showUser && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
              )}
              {showTenant && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Tenant
                </th>
              )}
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Priority
              </th>
              {showEscalation && (
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Escalation
                </th>
              )}
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {threads.map((thread) => {
              const escalationLevel = thread.escalation_level ?? 0;
              const escalationConfig = ESCALATION_CONFIG[escalationLevel] || ESCALATION_CONFIG[0];
              const EscalationIcon = escalationConfig.icon;
              const slaRisk = isSlaAtRisk(thread);
              const statusValue = thread.status || "open";
              const isOpen = statusValue !== "resolved" && statusValue !== "closed";
              const priority = thread.priority || "medium";
              const messageCount = thread.messages_count ?? thread.messages?.length ?? 0;

              return (
                <tr key={thread.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {slaRisk && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                      )}
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{thread.subject}</div>
                        <div className="text-xs text-gray-500">
                          {(thread.uuid || String(thread.id)).slice(0, 8)}... • {messageCount} msgs
                        </div>
                      </div>
                    </div>
                  </td>
                  {showUser && (
                    <td className="px-4 py-3">
                      <div className="text-sm">{thread.user?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{thread.user?.email}</div>
                    </td>
                  )}
                  {showTenant && (
                    <td className="px-4 py-3">
                      <div className="text-sm">{thread.tenant?.name || "-"}</div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <div
                      className={`flex items-center justify-center gap-1 ${getPriorityClasses(priority)}`}
                    >
                      <Flag className="w-4 h-4" />
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                  </td>
                  {showEscalation && (
                    <td className="px-4 py-3 text-center">
                      <div
                        className={`flex items-center justify-center gap-1 ${escalationConfig.color}`}
                      >
                        <EscalationIcon className="w-4 h-4" />
                        <span className="text-sm">{escalationConfig.label}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(statusValue)}`}
                    >
                      {statusValue.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
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
