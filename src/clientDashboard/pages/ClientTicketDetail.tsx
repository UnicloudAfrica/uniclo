// @ts-nocheck
import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { SharedTicketDetail } from "../../shared/components/support/SharedTicketDetail";
import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";
import { Thread, SlaStatus } from "../../shared/components/support/threadTypes";

type ThreadDetailResponse = {
    data?: Thread;
    sla_status?: SlaStatus;
};

const ClientTicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Queries
    const threadQuery = useQuery({
        queryKey: ["client", "support", "detail", id],
        queryFn: async () => {
            const res = await clientSilentApi("GET", `/business/support/${id}`);
            return res;
        },
        enabled: !!id,
    });

    // Mutations
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
            return clientApi("POST", `/business/support/${id}/reply`, body);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client", "support", "detail", id] });
        },
    });

    const resolveMutation = useMutation({
        mutationFn: () => clientApi("PUT", `/business/support/${id}`, { status: "resolved" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client", "support", "detail", id] });
            // Optionally redirect back or stay? Stay is usually better so they see the result.
        },
    });

    const rateMutation = useMutation({
        mutationFn: (payload: { score: number; comment?: string }) => clientApi("POST", `/business/support/${id}/rate`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client", "support", "detail", id] });
        },
    });

    const markRead = (messageId: number) => {
        if (!id) return Promise.resolve();
        return clientSilentApi("POST", `/business/support/${id}/read`, { last_read_message_id: messageId });
    };

    // Extract Data
    const payload = threadQuery.data as ThreadDetailResponse;
    const thread = payload?.data || (payload as unknown as Thread);
    const slaStatus = payload?.sla_status;

    if (threadQuery.isLoading) {
        return (
            <>
                <ClientActiveTab />
                <ClientPageShell
                    title="Ticket Details"
                    description="View and reply to your support ticket"
                    breadcrumbs={[
                        { label: "Home", href: "/client-dashboard" },
                        { label: "Support", href: "/client-dashboard/support" },
                        { label: "Loading..." },
                    ]}
                >
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                </ClientPageShell>
            </>
        );
    }

    if (threadQuery.isError || !thread) {
        return (
            <>
                <ClientActiveTab />
                <ClientPageShell
                    title="Ticket Details"
                    description="View and reply to your support ticket"
                    breadcrumbs={[
                        { label: "Home", href: "/client-dashboard" },
                        { label: "Support", href: "/client-dashboard/support" },
                        { label: "Error" },
                    ]}
                >
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
                        <p className="mt-2 text-sm text-gray-500">The ticket you are looking for does not exist or you do not have permission to view it.</p>
                    </div>
                </ClientPageShell>
            </>
        )
    }

    return (
        <>
            <ClientActiveTab />
            <ClientPageShell
                title={thread.subject}
                description={`Ticket #${thread.uuid || thread.id}`}
                breadcrumbs={[
                    { label: "Home", href: "/client-dashboard" },
                    { label: "Support", href: "/client-dashboard/support" },
                    { label: thread.subject || "Ticket" },
                ]}
            >
                <SharedTicketDetail
                    thread={thread}
                    slaStatus={slaStatus}
                    onBack={() => navigate("/client-dashboard/support")}
                    onReply={(payload) => replyMutation.mutate(payload)}
                    onResolve={() => resolveMutation.mutate()}
                    onRate={(payload) => rateMutation.mutate(payload)}
                    onFetchMessages={(page) => clientSilentApi("GET", `/business/support/${id}/messages?per_page=15&page=${page}`)}
                    onUpdateLastRead={(messageId) => markRead(messageId)}
                    canResolve={true}
                    canEscalate={false}
                    currentUserRole="business"
                    canDeescalate={false}
                    isLoading={threadQuery.isFetching || replyMutation.isPending || resolveMutation.isPending}
                />
            </ClientPageShell>
        </>
    );
};

export default ClientTicketDetail;
