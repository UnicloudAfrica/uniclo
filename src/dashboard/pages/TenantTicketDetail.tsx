// @ts-nocheck
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TenantPageShell from "../components/TenantPageShell";
import { SharedTicketDetail } from "../../shared/components/support/SharedTicketDetail";
import tenantApi from "../../index/tenant/tenantApi";
import silentTenantApi from "../../index/tenant/silentTenant";
import { Thread, SlaStatus } from "../../shared/components/support/threadTypes";

type ThreadDetailResponse = {
    data?: Thread;
    sla_status?: SlaStatus;
};

const TenantTicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Queries
    const threadQuery = useQuery({
        queryKey: ["tenant", "support", "detail", id],
        queryFn: async () => {
            const res = await silentTenantApi("GET", `/admin/support/${id}`);
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
            return tenantApi("POST", `/admin/support/${id}/reply`, body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenant", "support", "detail", id] });
        },
    });

    const resolveMutation = useMutation({
        mutationFn: () => tenantApi("PUT", `/admin/support/${id}`, { status: "resolved" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenant", "support", "detail", id] });
        },
    });

    const rateMutation = useMutation({
        mutationFn: (payload: { score: number; comment?: string }) => tenantApi("POST", `/admin/support/${id}/rate`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenant", "support", "detail", id] });
        },
    });

    const markRead = (messageId: number) => {
        if (!id) return Promise.resolve();
        return silentTenantApi("POST", `/admin/support/${id}/read`, { last_read_message_id: messageId });
    };

    // Extract Data
    const payload = threadQuery.data as ThreadDetailResponse;
    const thread = payload?.data || (payload as unknown as Thread);
    const slaStatus = payload?.sla_status;

    if (threadQuery.isLoading) {
        return (
            <TenantPageShell
                title="Ticket Details"
                description="View and reply to your support ticket"
            >
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
            </TenantPageShell>
        );
    }

    if (threadQuery.isError || !thread) {
        return (
            <TenantPageShell
                title="Ticket Details"
                description="View and reply to your support ticket"
            >
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
                    <p className="mt-2 text-sm text-gray-500">The ticket you are looking for does not exist.</p>
                </div>
            </TenantPageShell>
        )
    }

    return (
        <TenantPageShell
            title={thread.subject}
            description={`Ticket #${thread.uuid || thread.id}`}
        >
            <SharedTicketDetail
                thread={thread}
                slaStatus={slaStatus}
                onBack={() => navigate("/dashboard/support")}
                onReply={(payload) => replyMutation.mutate(payload)}
                onResolve={() => resolveMutation.mutate()}
                onRate={(payload) => rateMutation.mutate(payload)}
                onFetchMessages={(page) => silentTenantApi("GET", `/admin/support/${id}/messages?per_page=15&page=${page}`)}
                onUpdateLastRead={(messageId) => markRead(messageId)}
                canResolve={true}
                canEscalate={false}
                currentUserRole="tenant"
                canDeescalate={false}
                isLoading={threadQuery.isFetching || replyMutation.isPending || resolveMutation.isPending}
            />
        </TenantPageShell>
    );
};

export default TenantTicketDetail;
