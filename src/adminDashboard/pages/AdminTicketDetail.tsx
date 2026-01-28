// @ts-nocheck
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../components/AdminPageShell";
import { SharedTicketDetail } from "../../shared/components/support/SharedTicketDetail";
import adminApi, { adminSilentApi } from "../../index/admin/api";
import { Thread, SlaStatus } from "../../shared/components/support/threadTypes";

type ThreadDetailResponse = {
    data?: Thread;
    sla_status?: SlaStatus;
};

const AdminTicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const adminQueryKey = ["admin", "support", "detail", id];

    // Queries
    const threadQuery = useQuery({
        queryKey: adminQueryKey,
        queryFn: async () => {
            const res = await adminSilentApi("GET", `/support/${id}`);
            return res;
        },
        enabled: !!id,
    });

    // Mutations
    const replyMutation = useMutation({
        mutationFn: (payload: { message: string; files?: File[] }) => {
            let body: any;
            if (payload.files && payload.files.length > 0) {
                const formData = new FormData();
                formData.append('body', payload.message);
                payload.files.forEach(f => formData.append('attachments[]', f));
                body = formData;
            } else {
                body = { body: payload.message };
            }
            return adminApi("POST", `/support/${id}/reply`, body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKey });
        },
    });

    const resolveMutation = useMutation({
        mutationFn: () => adminApi("PUT", `/support/${id}`, { status: "resolved" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKey });
        },
    });

    const escalateMutation = useMutation({
        mutationFn: () => adminApi("POST", `/support/${id}/escalate`, {}), // Check API?
        // SupportThreadsPanel passed escalateThread function, which likely called POST /escalate
        // Let's assume standard endpoint or adjust if needed.
        // SupportThreadsPanel used `escalateThread` prop.
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKey });
        },
    });

    const rateMutation = useMutation({
        mutationFn: (payload: { score: number; comment?: string }) => adminApi("POST", `/support/${id}/rate`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKey });
        },
    });

    const markRead = (messageId: number) => {
        if (!id) return Promise.resolve();
        return adminSilentApi("POST", `/support/${id}/read`, { last_read_message_id: messageId });
    };

    // Need to verify escalate endpoint.
    // In `TicketsDashboard.tsx`, `escalateThread` was NOT passed! Only `create` `reply` `resolve`.
    // Wait, `SupportThreadsPanel` has `escalateThread` prop but `TicketsDashboard` wasn't passing it?
    // Checking `TicketsDashboard`...
    // `TicketsDashboard` passes: fetchThreads, fetchThread, createThread, replyThread, resolveThread.
    // It does NOT pass escalateThread.
    // But it passes `showEscalation`.
    // If `escalateThread` is missing, `SupportThreadsPanel` wont show escalate button (logic: `canEscalate && escalateThread`).
    // So Admin currently CANNOT escalate?
    // Or maybe I missed it.
    // Assuming Admin SHOULD be able to escalate if endpoints exist.
    // For now, I will implement it but if endpoint is missing it will fail.
    // Actually, I'll stick to what was there: Resolve and Reply.

    // Extract Data
    const payload = threadQuery.data as ThreadDetailResponse;
    const thread = payload?.data || (payload as unknown as Thread);
    const slaStatus = payload?.sla_status;

    if (threadQuery.isLoading) {
        return (
            <AdminPageShell
                title="Ticket Details"
                description="View and reply to customer support ticket"
            >
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
            </AdminPageShell>
        );
    }

    if (threadQuery.isError || !thread) {
        return (
            <AdminPageShell
                title="Ticket Details"
                description="View and reply to customer support ticket"
            >
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
                    <p className="mt-2 text-sm text-gray-500">The ticket you are looking for does not exist.</p>
                </div>
            </AdminPageShell>
        )
    }

    return (
        <AdminPageShell
            title={thread.subject}
            description={`Ticket #${thread.uuid || thread.id} - ${thread.customer?.name || "Unknown Customer"}`}
            mainClassName="admin-dashboard-shell"
        >
            <SharedTicketDetail
                thread={thread}
                slaStatus={slaStatus}
                onBack={() => navigate("/admin-dashboard/tickets")}
                onReply={(payload) => replyMutation.mutate(payload)}
                onResolve={() => resolveMutation.mutate()}
                onRate={(payload) => rateMutation.mutate(payload)}
                onFetchMessages={(page) => adminSilentApi("GET", `/support/${id}/messages?per_page=15&page=${page}`)}
                onUpdateLastRead={(messageId) => markRead(messageId)}
                canResolve={true}
                canEscalate={false}
                currentUserRole="admin"
                // Force false for now as it wasn't in original Dashboard
                canDeescalate={false}
                isLoading={threadQuery.isFetching || replyMutation.isPending || resolveMutation.isPending}
            />
        </AdminPageShell>
    );
};

export default AdminTicketDetail;
