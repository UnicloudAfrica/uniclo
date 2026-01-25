// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { ThreadTable } from "./ThreadTable";
import { ThreadDetailModal } from "./ThreadDetailModal";
import type { Thread, SlaStatus } from "./threadTypes";
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
};

interface SupportThreadsPanelProps {
  queryKey: readonly unknown[];
  fetchThreads: (filters: SupportFilters) => Promise<any>;
  fetchThread: (id: string | number) => Promise<any>;
  createThread?: (payload: Record<string, any>) => Promise<any>;
  replyThread?: (id: string | number, payload: Record<string, any>) => Promise<any>;
  escalateThread?: (id: string | number) => Promise<any>;
  deescalateThread?: (id: string | number) => Promise<any>;
  resolveThread?: (id: string | number) => Promise<any>;
  canCreate?: boolean;
  canEscalate?: boolean;
  canDeescalate?: boolean;
  canResolve?: boolean;
  showTenant?: boolean;
  showUser?: boolean;
  showEscalation?: boolean;
  emptyMessage?: string;
  adminFields?: boolean;
}

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
  if (payload?.data) return { thread: payload.data, sla: payload.sla_status };
  return { thread: payload as Thread, sla: payload?.sla_status };
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
  onSubmit: (payload: Record<string, any>) => void;
  isLoading: boolean;
  adminFields?: boolean;
}) => {
  const [formState, setFormState] = useState({
    subject: "",
    body: "",
    priority: "medium",
    category: "",
  });
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.subject.trim() || !formState.body.trim()) {
      ToastUtils.error("Subject and message are required.");
      return;
    }

    const payload: Record<string, any> = {
      subject: formState.subject.trim(),
      body: formState.body.trim(),
    };

    if (formState.priority) payload.priority = formState.priority;
    if (formState.category.trim()) payload.category = formState.category.trim();

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
        payload.tenant_id = selectedTenantId;
      }

      if (contextType === "user" && selectedUserId) {
        payload.user_id = selectedUserId;
        if (selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        }
      }
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
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
}) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SupportFilters>({ status: "", search: "" });
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: [...queryKey, filters],
    queryFn: () => fetchThreads(filters),
  });

  const detailQuery = useQuery({
    queryKey: [...queryKey, "detail", selectedId],
    queryFn: () => (selectedId ? fetchThread(selectedId) : null),
    enabled: Boolean(selectedId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => createThread?.(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setCreateOpen(false);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (payload: { id: string | number; body: string }) =>
      replyThread?.(payload.id, { body: payload.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string | number) => escalateThread?.(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
    },
  });

  const deescalateMutation = useMutation({
    mutationFn: (id: string | number) => deescalateThread?.(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string | number) => resolveThread?.(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [...queryKey, "detail", selectedId] });
    },
  });

  const threads = useMemo(() => extractThreads(listQuery.data), [listQuery.data]);
  const detailPayload = extractThreadDetail(detailQuery.data || {});
  const selectedThread = selectedId ? detailPayload.thread : null;

  const handleView = (thread: Thread) => {
    setSelectedId(thread.uuid || thread.id);
  };

  const handleReply = (message: string) => {
    if (!selectedId) return;
    replyMutation.mutate({ id: selectedId, body: message });
  };

  const handleResolve = () => {
    if (!selectedId || !resolveThread) return;
    resolveMutation.mutate(selectedId);
  };

  const handleEscalate = (thread?: Thread) => {
    const id = thread ? thread.uuid || thread.id : selectedId;
    if (!id || !escalateThread) return;
    setSelectedId(id);
    escalateMutation.mutate(id);
  };

  const handleDeescalate = () => {
    if (!selectedId || !deescalateThread) return;
    deescalateMutation.mutate(selectedId);
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <span className="text-gray-500">Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="bg-transparent text-sm text-gray-700 focus:outline-none"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search tickets"
            className="w-full min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-auto"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModernButton
            variant="outline"
            onClick={() => listQuery.refetch()}
            isDisabled={listQuery.isFetching}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
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

      <ThreadTable
        threads={threads}
        isLoading={listQuery.isLoading}
        onView={handleView}
        onEscalate={canEscalate ? handleEscalate : undefined}
        showEscalation={showEscalation}
        showTenant={showTenant}
        showUser={showUser}
        emptyMessage={emptyMessage}
      />

      {selectedThread && (
        <ThreadDetailModal
          thread={selectedThread}
          slaStatus={detailPayload.sla}
          onClose={() => setSelectedId(null)}
          onReply={replyThread ? handleReply : undefined}
          onEscalate={canEscalate ? handleEscalate : undefined}
          onDeescalate={canDeescalate ? handleDeescalate : undefined}
          onResolve={canResolve ? handleResolve : undefined}
          canEscalate={canEscalate}
          canDeescalate={canDeescalate}
          canResolve={canResolve}
          isLoading={detailQuery.isFetching || replyMutation.isPending}
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
