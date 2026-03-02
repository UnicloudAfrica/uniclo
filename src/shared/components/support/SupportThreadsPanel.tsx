import React, { useMemo, useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Paperclip,
  X,
  Loader2,
  Search,
  Inbox,
  AlertTriangle,
  Flag,
  CheckCircle2,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { ThreadTable } from "./ThreadTable";
import { ThreadDetailModal } from "./ThreadDetailModal";
import type { Thread, SlaStatus } from "./threadTypes";
import { isSlaAtRisk } from "./threadTypes";
import { ModernButton } from "../ui";
import CustomerContextSelector from "../common/CustomerContextSelector";
import ToastUtils from "@/utils/toastUtil";
import { useCustomerContext } from "@/hooks/adminHooks/useCustomerContext";

type ThreadListResponse = {
  data?: Thread[] | { data?: Thread[] };
  sla_status?: SlaStatus;
};

type ThreadDetailResponse = {
  data?: Thread;
  sla_status?: SlaStatus;
};

type SupportFilters = {
  status?: string;
  search?: string;
  page?: number;
};

type SupportThreadPayload = Record<string, unknown> | FormData;
type ThreadStatusKey = "open" | "in_progress" | "pending" | "resolved" | "closed";

interface SupportThreadsPanelProps {
  queryKey: readonly unknown[];
  fetchThreads: (filters: SupportFilters) => Promise<ThreadListResponse & Record<string, unknown>>;
  fetchThread: (id: string | number) => Promise<ThreadDetailResponse & Record<string, unknown>>;
  createThread?: (payload: SupportThreadPayload) => Promise<unknown>;
  replyThread?: (id: string | number, payload: SupportThreadPayload) => Promise<unknown>;
  escalateThread?: (id: string | number) => Promise<unknown>;
  deescalateThread?: (id: string | number) => Promise<unknown>;
  resolveThread?: (id: string | number) => Promise<unknown>;
  canCreate?: boolean;
  canEscalate?: boolean;
  canDeescalate?: boolean;
  canResolve?: boolean;
  showTenant?: boolean;
  showUser?: boolean;
  showEscalation?: boolean;
  emptyMessage?: string;
  onView?: (thread: Thread) => void;
  adminFields?: boolean;
}

const SummaryCard = ({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  tone: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        {icon}
      </span>
    </div>
  </div>
);

const extractThreads = (payload: ThreadListResponse): Thread[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const extractThreadDetail = (
  payload: ThreadDetailResponse
): { thread: Thread | null; sla?: SlaStatus } => {
  if (!payload) return { thread: null };
  if (payload?.data) {
    return {
      thread: payload.data,
      ...(payload.sla_status !== undefined ? { sla: payload.sla_status } : {}),
    };
  }
  return {
    thread: payload as Thread,
    ...((payload as ThreadDetailResponse).sla_status !== undefined
      ? { sla: (payload as ThreadDetailResponse).sla_status }
      : {}),
  };
};

const CreateTicketModal = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  adminFields,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SupportThreadPayload) => void;
  isLoading: boolean;
  adminFields?: boolean;
}) => {
  const [formState, setFormState] = useState({
    subject: "",
    body: "",
    priority: "medium",
    category: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
  } = useCustomerContext({ enabled: Boolean(adminFields) });

  if (!open) return null;

  const updateField = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.subject.trim() || !formState.body.trim()) {
      ToastUtils.error("Subject and message are required.");
      return;
    }

    const payload: Record<string, unknown> = {
      subject: formState.subject.trim(),
      body: formState.body.trim(),
    };

    if (formState.priority) payload["priority"] = formState.priority;
    if (formState.category.trim()) payload["category"] = formState.category.trim();

    if (adminFields) {
      if (contextType === "tenant" && !selectedTenantId) {
        ToastUtils.error("Please select a tenant for this ticket.");
        return;
      }

      if (contextType === "user" && !selectedUserId) {
        ToastUtils.error("Please select a user for this ticket.");
        return;
      }

      if (contextType === "tenant" && selectedTenantId) {
        payload["tenant_id"] = selectedTenantId;
      }

      if (contextType === "user" && selectedUserId) {
        payload["user_id"] = selectedUserId;
        if (selectedTenantId) {
          payload["tenant_id"] = selectedTenantId;
        }
      }
    }

    if (files.length > 0) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => formData.append(key, payload[key] as any));
      files.forEach((file) => formData.append("attachments[]", file));
      onSubmit(formData);
    } else {
      onSubmit(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900">New Support Ticket</h3>
          <p className="text-sm text-gray-500">Share a summary and we will respond shortly.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              value={formState.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="What do you need help with?"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={formState.body}
              onChange={(event) => updateField("body", event.target.value)}
              className="mt-1 min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Describe the issue or request..."
              disabled={isLoading}
            />

            {/* File Attachments */}
            <div className="mt-2">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
              <div className="flex flex-wrap gap-2 mb-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="hover:text-red-500 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <ModernButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                leftIcon={<Paperclip className="w-4 h-4" />}
              >
                Attach Files
              </ModernButton>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={formState.priority}
                onChange={(event) => updateField("priority", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={isLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                value={formState.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Billing, Technical, etc."
                disabled={isLoading}
              />
            </div>
          </div>
          {adminFields && (
            <div className={isLoading ? "pointer-events-none opacity-70" : ""}>
              <CustomerContextSelector
                contextType={contextType}
                setContextType={setContextType}
                selectedTenantId={selectedTenantId}
                setSelectedTenantId={setSelectedTenantId}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                tenants={tenants}
                isTenantsFetching={isTenantsFetching}
                userPool={userPool}
                isUsersFetching={isUsersFetching}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <ModernButton variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </ModernButton>
            <ModernButton type="submit" isDisabled={isLoading}>
              {isLoading ? "Creating..." : "Create Ticket"}
            </ModernButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SupportThreadsPanel: React.FC<SupportThreadsPanelProps> = ({
  queryKey,
  fetchThreads,
  fetchThread,
  createThread,
  replyThread,
  escalateThread,
  deescalateThread,
  resolveThread,
  canCreate = true,
  canEscalate = false,
  canDeescalate = false,
  canResolve = true,
  showTenant = false,
  showUser = true,
  showEscalation = true,
  emptyMessage = "No support tickets found",
  adminFields = false,
  onView,
}) => {
  const queryClient = useQueryClient();
  const { ref: loadMoreRef, inView } = useInView();
  const [filters, setFilters] = useState<SupportFilters>({ status: "", search: "" });
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useInfiniteQuery({
    queryKey: [...queryKey, filters],
    queryFn: ({ pageParam = 1 }) => fetchThreads({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta || lastPage;
      const current = (meta as any).current_page || 1;
      const last = (meta as any).last_page || 1;
      return current < last ? current + 1 : undefined;
    },
  });

  useEffect(() => {
    if (inView && listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      listQuery.fetchNextPage();
    }
  }, [inView, listQuery.hasNextPage, listQuery.isFetchingNextPage, listQuery.fetchNextPage]);

  const detailQuery = useQuery({
    queryKey: [...queryKey, "detail", selectedId],
    queryFn: () => (selectedId ? fetchThread(selectedId) : null),
    enabled: Boolean(selectedId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: SupportThreadPayload) => {
      if (!createThread) return Promise.reject(new Error("createThread is not defined"));
      return createThread(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setCreateOpen(false);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (payload: {
      id: string | number;
      body: string | FormData | Record<string, unknown>;
    }) => {
      if (!replyThread) return Promise.reject(new Error("replyThread is not defined"));
      return replyThread(payload.id, payload.body as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string | number) => {
      if (!escalateThread) return Promise.reject(new Error("escalateThread is not defined"));
      return escalateThread(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
    },
  });

  const deescalateMutation = useMutation({
    mutationFn: (id: string | number) => {
      if (!deescalateThread) return Promise.reject(new Error("deescalateThread is not defined"));
      return deescalateThread(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string | number) => {
      if (!resolveThread) return Promise.reject(new Error("resolveThread is not defined"));
      return resolveThread(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
    },
  });

  const threads = useMemo(() => {
    if (!listQuery.data) return [];
    return listQuery.data.pages.flatMap((page) => extractThreads(page));
  }, [listQuery.data]);

  const totalFromMeta =
    (listQuery as any).data?.pages?.[0]?.meta?.total ?? listQuery.data?.pages?.[0]?.total;
  const statusCounts = useMemo(() => {
    const counts: Record<ThreadStatusKey, number> = {
      open: 0,
      in_progress: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
    };
    threads.forEach((thread) => {
      const statusValue = thread.status || "open";
      const normalized: ThreadStatusKey =
        statusValue === "in_progress" ||
        statusValue === "pending" ||
        statusValue === "resolved" ||
        statusValue === "closed"
          ? statusValue
          : "open";
      counts[normalized] = counts[normalized] + 1;
    });
    return counts;
  }, [threads]);

  const activeCount = statusCounts["open"] + statusCounts["in_progress"] + statusCounts["pending"];
  const resolvedCount = statusCounts["resolved"] + statusCounts["closed"];
  const highPriorityCount = useMemo(
    () =>
      threads.filter((thread) => thread.priority === "high" || thread.priority === "critical")
        .length,
    [threads]
  );
  const atRiskCount = useMemo(
    () => threads.filter((thread) => isSlaAtRisk(thread)).length,
    [threads]
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All", count: threads.length },
      { value: "open", label: "Open", count: statusCounts["open"] },
      { value: "in_progress", label: "In progress", count: statusCounts["in_progress"] },
      { value: "pending", label: "Pending", count: statusCounts["pending"] },
      { value: "resolved", label: "Resolved", count: statusCounts["resolved"] },
      { value: "closed", label: "Closed", count: statusCounts["closed"] },
    ],
    [statusCounts, totalFromMeta, threads.length]
  );

  const detailPayload = extractThreadDetail(detailQuery.data || {});
  const selectedThread = selectedId ? detailPayload.thread : null;

  const handleView = (thread: Thread) => {
    if (onView) {
      onView(thread);
    } else {
      setSelectedId(thread.uuid || thread.id);
    }
  };

  const handleReply = (payload: { message: string; files?: File[] } | string) => {
    if (!selectedId) return;

    // Handle legacy string call if any
    if (typeof payload === "string") {
      replyMutation.mutate({ id: selectedId, body: { body: payload } });
      return;
    }

    let body: SupportThreadPayload | Record<string, unknown>;
    if (payload.files && payload.files.length > 0) {
      const formData = new FormData();
      formData.append("body", payload.message);
      payload.files.forEach((f) => formData.append("attachments[]", f));
      body = formData;
    } else {
      body = { body: payload.message };
    }

    replyMutation.mutate({ id: selectedId, body });
  };

  const handleResolve = () => {
    if (!selectedId || !resolveThread) return;
    resolveMutation.mutate(selectedId);
  };

  const handleEscalate = (thread?: Thread) => {
    const id = thread ? thread.uuid || thread.id : selectedId;
    if (!id || !escalateThread) return;

    if (!onView) setSelectedId(id);

    escalateMutation.mutate(id);
  };

  const handleDeescalate = () => {
    if (!selectedId || !deescalateThread) return;
    deescalateMutation.mutate(selectedId);
  };

  const handleEscalateFromTable = (thread: Thread) => {
    handleEscalate(thread);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Active tickets"
          value={activeCount}
          description={
            totalFromMeta ? `${totalFromMeta} total tickets` : "Open, pending, in progress"
          }
          icon={<Inbox className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="SLA at risk"
          value={atRiskCount}
          description="Needs immediate response"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="bg-rose-50 text-rose-600"
        />
        <SummaryCard
          label="High priority"
          value={highPriorityCount}
          description="High + critical"
          icon={<Flag className="h-5 w-5" />}
          tone="bg-amber-50 text-amber-600"
        />
        <SummaryCard
          label="Resolved"
          value={resolvedCount}
          description="Resolved or closed"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((option) => {
                const isActive = filters.status === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        status: option.value,
                      }))
                    }
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {listQuery.isLoading ? "—" : option.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, search: event.target.value }))
                  }
                  placeholder="Search by subject, ticket ID, or user"
                  className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Showing <span className="font-semibold text-slate-900">{threads.length}</span>
                {totalFromMeta ? ` of ${totalFromMeta}` : ""} tickets
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModernButton
              variant="outline"
              onClick={() => listQuery.refetch()}
              isDisabled={listQuery.isFetching}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              {listQuery.isFetching ? "Refreshing..." : "Refresh"}
            </ModernButton>
            {canCreate && createThread && (
              <ModernButton
                onClick={() => setCreateOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Ticket
              </ModernButton>
            )}
          </div>
        </div>
      </div>

      <ThreadTable
        threads={threads}
        isLoading={listQuery.isLoading}
        onView={handleView}
        {...(canEscalate ? { onEscalate: handleEscalateFromTable } : {})}
        showEscalation={showEscalation}
        showTenant={showTenant}
        showUser={showUser}
        emptyTitle="No tickets yet"
        emptyDescription={emptyMessage}
        emptyAction={
          canCreate && createThread ? (
            <ModernButton
              onClick={() => setCreateOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create ticket
            </ModernButton>
          ) : null
        }
      />

      {listQuery.hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Only show modal if selectedThread is set (which is only set if onView is NOT provided) */}
      {selectedThread && (
        <ThreadDetailModal
          thread={selectedThread}
          {...(detailPayload.sla !== undefined ? { slaStatus: detailPayload.sla } : {})}
          onClose={() => setSelectedId(null)}
          onReply={handleReply}
          onEscalate={handleEscalate}
          onDeescalate={handleDeescalate}
          onResolve={handleResolve}
          isLoading={detailQuery.isFetching || replyMutation.isPending}
          canEscalate={canEscalate}
          canDeescalate={canDeescalate}
          canResolve={canResolve}
          currentUserRole={
            queryKey.includes("admin")
              ? "admin"
              : queryKey.includes("tenant")
                ? "tenant"
                : "business"
          }
        />
      )}

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isLoading={createMutation.isPending}
        adminFields={adminFields}
      />
    </>
  );
};

export default SupportThreadsPanel;
