// @ts-nocheck
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Send,
  Flag,
  Users,
  Building2,
  Server,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "../../shared/components/ui";
import adminApi from "../../index/admin/api";

// Types
interface Thread {
  id: number;
  uuid: string;
  subject: string;
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  escalation_level: number;
  created_at: string;
  sla_response_due_at: string;
  sla_resolution_due_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  messages_count: number;
  user?: { id: number; name: string; email: string };
  messages?: Array<{
    id: number;
    message: string;
    sender_type: string;
    created_at: string;
    user?: { name: string };
  }>;
}

interface ThreadStats {
  total: number;
  by_status: Record<string, number>;
  sla_at_risk: number;
  by_escalation: Record<string, number>;
  escalation_levels: Record<number, string>;
}

// Escalation level labels and colors
const ESCALATION_CONFIG: Record<number, { label: string; icon: any; color: string }> = {
  0: { label: "Client", icon: User, color: "text-gray-500" },
  1: { label: "Tenant", icon: Building2, color: "text-blue-500" },
  2: { label: "Admin", icon: Users, color: "text-purple-500" },
  3: { label: "Provider", icon: Server, color: "text-red-500" },
};

// API hooks
const useThreads = (params: Record<string, any>) => {
  return useQuery({
    queryKey: ["threads", params],
    queryFn: async () => {
      const response = await adminApi.get("/threads", { params });
      return response.data.data;
    },
  });
};

const useThreadStats = () => {
  return useQuery({
    queryKey: ["threads", "statistics"],
    queryFn: async () => {
      const response = await adminApi.get("/threads/statistics");
      return response.data.data as ThreadStats;
    },
  });
};

const useThread = (uuid: string | null) => {
  return useQuery({
    queryKey: ["threads", uuid],
    queryFn: async () => {
      if (!uuid) return null;
      const response = await adminApi.get("/threads/" + uuid);
      return { thread: response.data.data, sla: response.data.sla_status };
    },
    enabled: !!uuid,
  });
};

const useEscalateThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason?: string }) => {
      const response = await adminApi.post("/threads/" + uuid + "/escalate", { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

const useReplyThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, message }: { uuid: string; message: string }) => {
      const response = await adminApi.post("/threads/" + uuid + "/reply", { message });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

const useResolveThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, resolution }: { uuid: string; resolution?: string }) => {
      const response = await adminApi.post("/threads/" + uuid + "/resolve", { resolution });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

// Helper functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: "text-gray-500",
    medium: "text-blue-500",
    high: "text-orange-500",
    critical: "text-red-600",
  };
  return colors[priority] || "text-gray-500";
};

const isSlaAtRisk = (thread: Thread): boolean => {
  if (thread.status === "resolved" || thread.status === "closed") return false;
  const now = new Date();
  if (!thread.first_response_at && new Date(thread.sla_response_due_at) < now) return true;
  if (!thread.resolved_at && new Date(thread.sla_resolution_due_at) < now) return true;
  return false;
};

const TicketsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    escalation_level: "",
    search: "",
    page: 1,
    per_page: 20,
  });
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: threadsData, isLoading } = useThreads(filters);
  const { data: stats } = useThreadStats();
  const { data: selectedData } = useThread(selectedUuid);
  const escalate = useEscalateThread();
  const reply = useReplyThread();
  const resolve = useResolveThread();

  const threads: Thread[] = threadsData?.data || [];
  const pagination = threadsData || {};
  const selectedThread = selectedData?.thread;
  const selectedSla = selectedData?.sla;

  const handleEscalate = async (uuid: string) => {
    const reason = prompt("Reason for escalation:");
    if (reason !== null) {
      try {
        await escalate.mutateAsync({ uuid, reason });
        alert("Thread escalated successfully");
      } catch (error: any) {
        alert(error.response?.data?.error || "Failed to escalate");
      }
    }
  };

  const handleReply = async () => {
    if (!selectedUuid || !replyText.trim()) return;
    try {
      await reply.mutateAsync({ uuid: selectedUuid, message: replyText });
      setReplyText("");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to send reply");
    }
  };

  const handleResolve = async (uuid: string) => {
    const resolution = prompt("Resolution summary (optional):");
    try {
      await resolve.mutateAsync({ uuid, resolution: resolution || undefined });
      setSelectedUuid(null);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to resolve");
    }
  };

  // Summary cards with escalation focus
  const summaryCards = useMemo(
    () => [
      {
        title: "Open Threads",
        value: stats?.by_status?.open || 0,
        icon: MessageSquare,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "In Progress",
        value: stats?.by_status?.in_progress || 0,
        icon: Clock,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "SLA At Risk",
        value: stats?.sla_at_risk || 0,
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        title: "Escalated to Provider",
        value: stats?.by_escalation?.provider || 0,
        icon: Server,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ],
    [stats]
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <AdminPageShell
          title="Support Threads"
          description="Manage support threads with escalation levels"
          actions={
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["threads"] })}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </ModernButton>
          }
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-semibold mt-1">{card.value}</p>
                  </div>
                  <div className={card.bgColor + " p-3 rounded-lg"}>
                    <card.icon className={"w-6 h-6 " + card.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Escalation Level Pills */}
          <div className="flex gap-2 mb-4">
            {Object.entries(ESCALATION_CONFIG).map(([level, config]) => {
              const count = stats?.by_escalation?.[config.label.toLowerCase()] || 0;
              return (
                <button
                  key={level}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      escalation_level: filters.escalation_level === level ? "" : level,
                      page: 1,
                    })
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    filters.escalation_level === level
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <config.icon className="w-4 h-4" />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Search by subject or UUID..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFilters({
                    status: "",
                    priority: "",
                    escalation_level: "",
                    search: "",
                    page: 1,
                    per_page: 20,
                  })
                }
              >
                Clear Filters
              </ModernButton>
            </div>
          </div>

          {/* Threads Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Thread
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Escalation
                    </th>
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : threads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No threads found
                      </td>
                    </tr>
                  ) : (
                    threads.map((thread) => {
                      const escalationConfig =
                        ESCALATION_CONFIG[thread.escalation_level] || ESCALATION_CONFIG[0];
                      const EscalationIcon = escalationConfig.icon;
                      return (
                        <tr key={thread.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              {isSlaAtRisk(thread) && (
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                              )}
                              <div>
                                <div className="font-medium text-sm line-clamp-1">
                                  {thread.subject}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {thread.uuid.slice(0, 8)}... • {thread.messages_count} msgs
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">{thread.user?.name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{thread.user?.email}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div
                              className={
                                "flex items-center justify-center gap-1 " +
                                getPriorityColor(thread.priority)
                              }
                            >
                              <Flag className="w-4 h-4" />
                              <span className="text-sm capitalize">{thread.priority}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div
                              className={
                                "flex items-center justify-center gap-1 " + escalationConfig.color
                              }
                            >
                              <EscalationIcon className="w-4 h-4" />
                              <span className="text-sm">{escalationConfig.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={
                                "inline-flex px-2 py-1 text-xs font-medium rounded-full " +
                                getStatusColor(thread.status)
                              }
                            >
                              {thread.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(thread.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <ModernButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUuid(thread.uuid)}
                              >
                                View
                              </ModernButton>
                              {thread.escalation_level < 3 &&
                                thread.status !== "resolved" &&
                                thread.status !== "closed" && (
                                  <ModernButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEscalate(thread.uuid)}
                                  >
                                    <ArrowUpCircle className="w-4 h-4" />
                                  </ModernButton>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {pagination.current_page} of {pagination.last_page}
                </div>
                <div className="flex gap-2">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    disabled={pagination.current_page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </ModernButton>
                </div>
              </div>
            )}
          </div>
        </AdminPageShell>
      </div>

      {/* Thread Detail Modal */}
      {selectedUuid && selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedThread.subject}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={
                      "inline-flex px-2 py-0.5 text-xs font-medium rounded-full " +
                      getStatusColor(selectedThread.status)
                    }
                  >
                    {selectedThread.status.replace("_", " ")}
                  </span>
                  <span
                    className={
                      "flex items-center gap-1 text-sm " +
                      (ESCALATION_CONFIG[selectedThread.escalation_level]?.color || "")
                    }
                  >
                    {(() => {
                      const Icon = ESCALATION_CONFIG[selectedThread.escalation_level]?.icon || User;
                      return <Icon className="w-4 h-4" />;
                    })()}
                    {ESCALATION_CONFIG[selectedThread.escalation_level]?.label || "Unknown"} Level
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUuid(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SLA Status Bar */}
            {selectedSla && (
              <div className="px-4 py-2 bg-gray-50 border-b flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Response SLA:</span>{" "}
                  <span
                    className={
                      selectedSla.response.status === "breached"
                        ? "text-red-600 font-medium"
                        : selectedSla.response.status === "met"
                          ? "text-green-600"
                          : ""
                    }
                  >
                    {selectedSla.response.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Resolution SLA:</span>{" "}
                  <span
                    className={
                      selectedSla.resolution.status === "breached"
                        ? "text-red-600 font-medium"
                        : selectedSla.resolution.status === "met"
                          ? "text-green-600"
                          : ""
                    }
                  >
                    {selectedSla.resolution.status.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedThread.messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.sender_type === "user"
                      ? "bg-blue-50 ml-0 mr-12"
                      : msg.sender_type === "system"
                        ? "bg-gray-100 text-center"
                        : "bg-green-50 ml-12 mr-0"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.user?.name || msg.sender_type}</span>
                    <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            {selectedThread.status !== "closed" && selectedThread.status !== "resolved" && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  />
                  <ModernButton onClick={handleReply}>
                    <Send className="w-4 h-4" />
                  </ModernButton>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <div className="flex gap-2">
                {selectedThread.escalation_level < 3 &&
                  selectedThread.status !== "resolved" &&
                  selectedThread.status !== "closed" && (
                    <ModernButton
                      variant="outline"
                      onClick={() => handleEscalate(selectedThread.uuid)}
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Escalate
                    </ModernButton>
                  )}
              </div>
              <div className="flex gap-2">
                {selectedThread.status !== "resolved" && selectedThread.status !== "closed" && (
                  <ModernButton
                    variant="primary"
                    onClick={() => handleResolve(selectedThread.uuid)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve
                  </ModernButton>
                )}
                <ModernButton variant="ghost" onClick={() => setSelectedUuid(null)}>
                  Close
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsDashboard;
