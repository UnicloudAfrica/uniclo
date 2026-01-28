import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, CheckCircle, ArrowUpCircle, ArrowDownCircle, ChevronLeft, Paperclip, X, FileText, Download, UploadCloud, Loader2, Star } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ModernButton, ModernCard } from "../ui";
import {
    Thread,
    SlaStatus,
    ESCALATION_CONFIG,
    STATUS_STYLES,
    formatThreadDate,
    getSlaStatusColor,
    getStatusClasses,
    ThreadAttachment,
    ThreadMessage,
} from "./threadTypes";
import { useNavigate } from "react-router-dom";

interface SharedTicketDetailProps {
    thread: Thread;
    slaStatus?: SlaStatus;
    onBack?: () => void;
    onReply?: (payload: { message: string; files?: File[] }) => void;
    onEscalate?: () => void;
    onDeescalate?: () => void;
    onResolve?: () => void;
    onRate?: (payload: { score: number; comment?: string; agent_scores?: Record<string, number> }) => void;
    onFetchMessages?: (page: number) => Promise<any>;
    onUpdateLastRead?: (messageId: number) => Promise<any> | void;
    canEscalate?: boolean;
    canDeescalate?: boolean;
    canResolve?: boolean;
    isLoading?: boolean;
    currentUserRole?: "admin" | "tenant" | "user" | "business";
}

export const SharedTicketDetail: React.FC<SharedTicketDetailProps> = ({
    thread,
    slaStatus,
    onBack,
    onReply,
    onEscalate,
    onDeescalate,
    onResolve,
    onRate,
    onFetchMessages,
    onUpdateLastRead,
    canEscalate = true,
    canDeescalate = false,
    canResolve = true,
    isLoading = false,
    currentUserRole = "user",
}) => {
    const navigate = useNavigate();
    const [replyText, setReplyText] = useState("");
    const [ratingScore, setRatingScore] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollBottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const lastReadUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastReadReportedRef = useRef<number | null>(null);
    const isBootstrappingRef = useRef(true);
    const [hasScrolledInitially, setHasScrolledInitially] = useState(false);
    const [showLoadMore, setShowLoadMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [preventAutoScroll, setPreventAutoScroll] = useState(false);
    const [newMessageArrived, setNewMessageArrived] = useState(false);
    const [prevMessagesLength, setPrevMessagesLength] = useState(0);
    const [lastReadMessageId, setLastReadMessageId] = useState<number | null>(
        thread.last_read_message_id ?? null
    );

    // Infinite Query for messages
    const {
        data: messagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingMessages,
    } = useInfiniteQuery({
        queryKey: ["support", "thread", thread.uuid || thread.id, "messages"],
        queryFn: ({ pageParam = 1 }) => onFetchMessages ? onFetchMessages(pageParam) : Promise.resolve({ data: [] }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta || lastPage;
            const current = meta.current_page || 1;
            const last = meta.last_page || 1;
            return current < last ? current + 1 : undefined;
        },
        enabled: !!onFetchMessages && !!(thread.uuid || thread.id),
    });

    const allMessages = useMemo(() => {
        const initialMessages = thread.messages || [];
        const flattenedData = messagesData?.pages.flatMap(page => {
            const data = page?.data || page;
            return Array.isArray(data) ? data : [];
        }) || [];

        // Deduplicate using UUID or ID
        const messageMap = new Map();
        [...initialMessages, ...flattenedData].forEach(msg => {
            const id = msg.id ?? msg.uuid ?? `temp-${new Date(msg.created_at).getTime()}-${msg.body?.substring(0, 5)}`;
            if (id) messageMap.set(id, msg);
        });

        const combined = Array.from(messageMap.values());

        const getMessageTime = (value?: string) => {
            const parsed = Date.parse(value ?? "");
            return Number.isFinite(parsed) ? parsed : null;
        };

        const getNumericId = (value?: number | string) => {
            if (typeof value === "number") return Number.isFinite(value) ? value : null;
            if (typeof value === "string") {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : null;
            }
            return null;
        };

        // FORCE STRICT CHRONOLOGICAL: Oldest (Top) -> Newest (Bottom)
        return combined.sort((a, b) => {
            const timeA = getMessageTime(a.created_at);
            const timeB = getMessageTime(b.created_at);
            if (timeA !== null && timeB !== null && timeA !== timeB) return timeA - timeB;
            if (timeA !== null && timeB === null) return -1;
            if (timeA === null && timeB !== null) return 1;

            // Stable sort for identical timestamps: Oldest ID first (ASC)
            const idA = getNumericId(a.id);
            const idB = getNumericId(b.id);
            if (idA !== null && idB !== null && idA !== idB) return idA - idB;
            if (idA !== null && idB === null) return -1;
            if (idA === null && idB !== null) return 1;

            const uuidA = a.uuid || "";
            const uuidB = b.uuid || "";
            if (uuidA !== uuidB) return uuidA < uuidB ? -1 : 1;
            return 0;
        });
    }, [messagesData, thread.messages]);

    const isNearBottom = (container: HTMLDivElement, threshold = 150) => {
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    };

    const queueLastReadUpdate = (messageId: number) => {
        if (!onUpdateLastRead) return;
        if (lastReadUpdateTimeoutRef.current) {
            clearTimeout(lastReadUpdateTimeoutRef.current);
        }
        lastReadUpdateTimeoutRef.current = setTimeout(() => {
            if (lastReadReportedRef.current === messageId) {
                return;
            }
            Promise.resolve(onUpdateLastRead(messageId)).catch(() => {
                // Ignore read tracking errors to avoid breaking scroll
            });
            lastReadReportedRef.current = messageId;
        }, 800);
    };

    useEffect(() => {
        setLastReadMessageId(thread.last_read_message_id ?? null);
        lastReadReportedRef.current = thread.last_read_message_id ?? null;
        setHasScrolledInitially(false);
        isBootstrappingRef.current = true;
    }, [thread.uuid, thread.id, thread.last_read_message_id]);

    useEffect(() => {
        if (allMessages.length > prevMessagesLength && prevMessagesLength > 0 && !isLoadingMore) {
            setNewMessageArrived(true);
        }
        setPrevMessagesLength(allMessages.length);
    }, [allMessages.length, prevMessagesLength, isLoadingMore]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
        if (!containerRef.current) return;
        containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior,
        });
    }, []);

    const scrollToBottomWithRetry = useCallback((behavior: ScrollBehavior = "auto") => {
        scrollToBottom(behavior);
        requestAnimationFrame(() => scrollToBottom(behavior));
        setTimeout(() => scrollToBottom("auto"), 120);
    }, [scrollToBottom]);

    useEffect(() => {
        if (newMessageArrived && !preventAutoScroll) {
            scrollToBottom("smooth");
            setNewMessageArrived(false);
        }
    }, [newMessageArrived, preventAutoScroll, scrollToBottom]);

    useEffect(() => {
        if (allMessages.length === 0 || hasScrolledInitially) return;
        scrollToBottomWithRetry("auto");
        const timer = setTimeout(() => {
            setHasScrolledInitially(true);
        }, 160);
        return () => clearTimeout(timer);
    }, [allMessages.length, hasScrolledInitially, scrollToBottomWithRetry]);

    useEffect(() => {
        if (!hasScrolledInitially) return;
        handleScroll();
    }, [hasScrolledInitially, allMessages.length]);

    useEffect(() => {
        return () => {
            if (lastReadUpdateTimeoutRef.current) {
                clearTimeout(lastReadUpdateTimeoutRef.current);
                lastReadUpdateTimeoutRef.current = null;
            }
        };
    }, []);

    const loadMoreMessages = useCallback(async (options?: { preserveScroll?: boolean }) => {
        if (isLoadingMore || isFetchingNextPage || !hasNextPage || !containerRef.current) return;

        const preserveScroll = options?.preserveScroll ?? true;
        setIsLoadingMore(true);
        if (preserveScroll) {
            setPreventAutoScroll(true);
        }

        const container = containerRef.current;
        const scrollHeightBefore = container.scrollHeight;

        try {
            await fetchNextPage();
        } finally {
            setTimeout(() => {
                if (!containerRef.current) return;
                if (preserveScroll) {
                    const scrollHeightAfter = containerRef.current.scrollHeight;
                    const heightDifference = scrollHeightAfter - scrollHeightBefore;
                    containerRef.current.scrollTop = containerRef.current.scrollTop + heightDifference;
                    setPreventAutoScroll(!isNearBottom(containerRef.current));
                } else {
                    scrollToBottomWithRetry("auto");
                    setPreventAutoScroll(false);
                }
                setIsLoadingMore(false);
            }, 100);
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoadingMore, scrollToBottomWithRetry]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (!hasNextPage || container.scrollHeight > container.clientHeight + 4) {
            isBootstrappingRef.current = false;
        }
    }, [allMessages.length, hasNextPage]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || isLoadingMore || isFetchingNextPage || !hasNextPage) return;
        if (container.scrollHeight <= container.clientHeight + 4) {
            loadMoreMessages({ preserveScroll: !isBootstrappingRef.current });
        }
    }, [allMessages.length, hasNextPage, isFetchingNextPage, isLoadingMore, loadMoreMessages]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const nearTop = container.scrollTop < 50;
        setShowLoadMore(nearTop && !!hasNextPage);
        if (nearTop && hasNextPage && hasScrolledInitially && !isLoadingMore) {
            loadMoreMessages({ preserveScroll: true });
        }
        setPreventAutoScroll(!isNearBottom(container));

        if (!allMessages.length) return;

        const containerRect = container.getBoundingClientRect();
        let lastVisibleMessageId: number | null = null;

        allMessages.forEach((msg) => {
            if (!msg.id) return;
            const key = msg.id ?? msg.uuid;
            const element = messageRefs.current[String(key)];
            if (!element) return;
            const elementRect = element.getBoundingClientRect();
            const isVisible =
                elementRect.top < containerRect.bottom &&
                elementRect.bottom > containerRect.top &&
                elementRect.top + elementRect.height / 2 < containerRect.bottom;
            if (isVisible) {
                lastVisibleMessageId = msg.id;
            }
        });

        if (lastVisibleMessageId && lastVisibleMessageId !== lastReadMessageId) {
            setLastReadMessageId(lastVisibleMessageId);
            queueLastReadUpdate(lastVisibleMessageId);
        }
    };

    const lastReadIndex = lastReadMessageId
        ? allMessages.findIndex((msg) => msg.id === lastReadMessageId)
        : -1;

    const escalationLevel = thread.escalation_level ?? 0;
    const statusLabel = (thread.status || "open").replace("_", " ");
    const escalationConfig = ESCALATION_CONFIG[escalationLevel] || ESCALATION_CONFIG[0];
    const EscalationIcon = escalationConfig.icon;

    const handleReply = () => {
        if ((replyText.trim() || files.length > 0) && onReply) {
            onReply({ message: replyText, files });
            setReplyText("");
            setFiles([]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleMediaLoad = () => {
        const container = containerRef.current;
        if (!container || preventAutoScroll) return;
        if (isNearBottom(container)) {
            scrollToBottom("auto");
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getDateSeparator = (currentDate?: string, prevDate?: string) => {
        if (!currentDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const messageDate = new Date(currentDate);
        messageDate.setHours(0, 0, 0, 0);

        if (
            prevDate &&
            new Date(prevDate).setHours(0, 0, 0, 0) === messageDate.getTime()
        ) {
            return null;
        }

        if (messageDate.getTime() === today.getTime()) {
            return "Today";
        }

        if (messageDate.getTime() === yesterday.getTime()) {
            return "Yesterday";
        }

        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        if (messageDate >= oneWeekAgo) {
            return messageDate.toLocaleDateString("en-US", { weekday: "long" });
        }

        return messageDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const isOpen = thread.status !== "resolved" && thread.status !== "closed";

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <ModernButton variant="ghost" onClick={handleBack} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                    Back
                </ModernButton>
                <h1 className="text-2xl font-bold text-gray-900">{thread.subject}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <ModernCard>
                        <div ref={containerRef} onScroll={handleScroll} className="h-[600px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                            <div className="flex flex-col min-h-full">
                                {showLoadMore && (
                                    <div className="flex justify-center mb-4">
                                        {isLoadingMore || isFetchingNextPage ? (
                                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        ) : (
                                            <button
                                                onClick={loadMoreMessages}
                                                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700"
                                            >
                                                Load More Messages
                                            </button>
                                        )}
                                    </div>
                                )}

                                {isLoadingMessages && allMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-3 py-10">
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        <p className="text-xs text-gray-500">Loading messages...</p>
                                    </div>
                                ) : allMessages.length === 0 ? (
                                    <p className="text-center text-sm text-gray-500 py-10">No messages yet.</p>
                                ) : (
                                    <>
                                        <div className="flex-grow" />
                                        <div className="space-y-4 pt-4">
                                        {allMessages.map((msg, idx) => {
                                            const isMe = msg.sender_type === currentUserRole || (currentUserRole === "business" && msg.sender_type === "user");
                                            const isSystem = msg.sender_type === "system";
                                            const prevMsg = idx > 0 ? allMessages[idx - 1] : null;
                                            const isSameSender = prevMsg && prevMsg.sender_type === msg.sender_type &&
                                                (prevMsg.user?.id === msg.user?.id || prevMsg.admin?.id === msg.admin?.id);
                                            const separator = getDateSeparator(msg.created_at, prevMsg?.created_at);
                                            const isUnread = lastReadIndex >= 0 && idx > lastReadIndex;
                                            const showNewMessagesSeparator = lastReadIndex >= 0 && idx === lastReadIndex + 1;
                                            const messageKey = msg.id ?? msg.uuid ?? `msg-${idx}`;

                                            return (
                                                <React.Fragment key={messageKey}>
                                                    {separator && (
                                                        <div className="text-center my-2">
                                                            <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-4 py-1 rounded-full">
                                                                {separator}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {showNewMessagesSeparator && (
                                                        <div className="text-center my-3">
                                                            <span className="inline-block bg-blue-100 text-blue-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
                                                                New Messages
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div
                                                        ref={(el) => {
                                                            messageRefs.current[String(messageKey)] = el;
                                                        }}
                                                        className={`flex flex-col ${isMe ? "items-end" : isSystem ? "items-center" : "items-start"} ${isSameSender ? "-mt-2" : "mt-2"} ${isUnread ? "bg-blue-50/40 rounded-lg px-2 py-1" : ""}`}
                                                    >
                                                        <div
                                                            className={`max-w-[85%] rounded-xl p-3 ${isMe
                                                                ? "bg-blue-600 text-white rounded-br-none"
                                                                : isSystem
                                                                    ? "bg-gray-100 text-gray-500 text-center text-[11px] px-4 py-1.5"
                                                                    : "bg-white text-gray-900 border border-gray-100 rounded-bl-none shadow-sm"
                                                                }`}
                                                        >
                                                            {!isSystem && !isSameSender && (
                                                                <div className={`flex items-center gap-2 text-[10px] mb-1 font-semibold uppercase tracking-wider opacity-60 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                                                                    <span>{msg.user?.name || msg.sender?.name || msg.admin?.name || (msg.sender_type === "admin" ? "Agent" : "User")}</span>
                                                                    {isUnread && <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-300" />}
                                                                    <span className={`text-[10px] font-medium ${isMe ? "text-blue-100" : "text-gray-400"}`}>{formatTime(msg.created_at)}</span>
                                                                </div>
                                                            )}
                                                            <p className="whitespace-pre-wrap text-sm leading-snug line-clamp-[15] hover:line-clamp-none cursor-default">{msg.message || msg.body}</p>

                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="mt-3 space-y-2">
                                                                    {msg.attachments.map((att: ThreadAttachment, attIdx: number) => {
                                                                        const isImage = att.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.file_name);
                                                                        return (
                                                                            <div key={att.id || `att-${attIdx}`} className="block">
                                                                                {isImage ? (
                                                                                    <div className="group relative rounded-lg overflow-hidden border border-gray-200 max-w-xs transition-all hover:shadow-md mb-2">
                                                                                        <img src={att.url} alt={att.file_name} onLoad={handleMediaLoad} className="w-full h-auto object-contain bg-gray-50 max-h-[200px]" />
                                                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                                                                                <Download className="w-4 h-4 text-gray-700" />
                                                                                            </div>
                                                                                        </a>
                                                                                    </div>
                                                                                ) : (
                                                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-lg text-xs transition ${isMe ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" : "bg-gray-50 hover:bg-white text-gray-700 border border-gray-200"}`}>
                                                                                        <FileText className="w-4 h-4" />
                                                                                        <span className="truncate max-w-[200px]">{att.file_name}</span>
                                                                                        <Download className="w-3 h-3 ml-auto opacity-70" />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            <div className={`text-[10px] mt-1.5 opacity-60 ${isMe ? "text-blue-100" : "text-gray-400"} text-right font-medium`}>
                                                                {formatThreadDate(msg.created_at)}
                                                                {msg.is_internal && <span className="ml-2 bg-yellow-500 text-white px-1 rounded text-[9px] font-bold">INTERNAL</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        <div ref={scrollBottomRef} className="h-0" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {isOpen && onReply && (
                            <div
                                className={`mt-8 pt-6 border-t border-gray-100 transition-all rounded-xl ${isDragging ? 'bg-blue-50/50 p-4 border-2 border-dashed border-blue-300' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="flex flex-col gap-3 relative">
                                    {isDragging && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 z-10 rounded-xl border-2 border-dashed border-blue-400">
                                            <div className="text-blue-600 font-semibold flex flex-col items-center gap-2">
                                                <UploadCloud className="w-8 h-8" />
                                                <span>Drop files here to attach</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-700">Reply</label>
                                        {files.length === 0 && (
                                            <span className="text-xs text-gray-400">Drag files here or click attach</span>
                                        )}
                                    </div>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px] bg-white"
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        disabled={isLoading}
                                    />

                                    {files.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {files.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200">
                                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                                    <button onClick={() => removeFile(idx)} className="hover:text-red-500 p-0.5"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2">
                                        <div>
                                            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} disabled={isLoading} />
                                            <ModernButton variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading} leftIcon={<Paperclip className="w-4 h-4" />}>
                                                Attach Files
                                            </ModernButton>
                                        </div>
                                        <ModernButton onClick={handleReply} disabled={isLoading || (!replyText.trim() && files.length === 0)} rightIcon={<Send className="w-4 h-4" />}>
                                            Send Reply
                                        </ModernButton>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isOpen && !thread.rating && onRate && (
                            <div className="mt-8 pt-6 border-t border-gray-100 bg-blue-50/30 p-6 rounded-xl border border-blue-100/50">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 text-center font-display">How was your support experience?</h3>
                                <p className="text-sm text-gray-500 mb-6 text-center">Your feedback helps us provide a better service for everyone.</p>

                                <div className="flex justify-center gap-3 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} onClick={() => setRatingScore(star)} className={`transition-all duration-200 ${ratingScore >= star ? 'text-yellow-400 scale-110' : 'text-gray-300'} hover:scale-125`}>
                                            <Star className={`w-10 h-10 ${ratingScore >= star ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>

                                {ratingScore > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                                        <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px] bg-white shadow-sm" placeholder="Tell us what you liked or what we can improve (optional)..." value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
                                        <ModernButton className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/20" onClick={() => onRate({ score: ratingScore, comment: ratingComment })} isDisabled={isLoading}>
                                            {isLoading ? "Submitting..." : "Submit Rating"}
                                        </ModernButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {thread.rating && (
                            <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50/50 p-6 rounded-xl border border-gray-200/50">
                                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.1em] font-sans">Support Quality Rating</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className={`w-5 h-5 ${thread.rating!.score >= star ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                    ))}
                                    <span className="text-sm font-bold text-gray-900 ml-2">{thread.rating.score} / 5</span>
                                </div>
                                {thread.rating.comment && (
                                    <div className="relative">
                                        <div className="text-sm text-gray-600 italic bg-white p-4 rounded-xl border border-gray-100 leading-relaxed shadow-sm">
                                            "{thread.rating.comment}"
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 text-[10px] text-gray-400 text-right uppercase tracking-wider">
                                    Submitted on {new Date(thread.rating.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </ModernCard>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <ModernCard title="Ticket Details">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Status</span>
                                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusClasses(thread.status)}`}>{statusLabel}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Escalation Level</span>
                                <span className={`flex items-center gap-1.5 text-sm font-medium ${escalationConfig.color}`}>
                                    <EscalationIcon className="w-4 h-4" />
                                    {escalationConfig.label}
                                </span>
                            </div>

                            {slaStatus && (
                                <>
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-sm text-gray-500 block mb-1">Response SLA</span>
                                        <span className={`text-sm font-medium ${getSlaStatusColor(slaStatus.response.status)}`}>{slaStatus.response.status.toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block mb-1">Resolution SLA</span>
                                        <span className={`text-sm font-medium ${getSlaStatusColor(slaStatus.resolution.status)}`}>{slaStatus.resolution.status.toUpperCase()}</span>
                                    </div>
                                </>
                            )}

                            {(thread.customer || thread.user) && (
                                <div className="pt-2 border-t border-gray-100">
                                    <span className="text-sm text-gray-500 block mb-1">Customer</span>
                                    <span className="text-sm font-medium text-gray-900">{thread.customer?.name || thread.user?.name || thread.customer?.email || thread.user?.email || "Unknown"}</span>
                                    <div className="text-xs text-gray-500">{(thread.customer?.name || thread.user?.name) ? (thread.customer?.email || thread.user?.email) : ""}</div>
                                </div>
                            )}

                            {thread.involved_users && thread.involved_users.admins.length > 0 && (
                                <div className="pt-4 border-t border-gray-100">
                                    <span className="text-sm text-gray-500 block mb-2">Involved Agents</span>
                                    <div className="flex flex-wrap gap-2">
                                        {thread.involved_users.admins.map(admin => (
                                            <div key={admin.id} title={admin.name} className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded text-xs text-blue-700 border border-blue-100">
                                                <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center font-bold text-[10px]">{admin.name[0]}</div>
                                                <span className="max-w-[120px] truncate">{admin.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {thread.customer_context && (
                                <div className="pt-4 border-t border-gray-100">
                                    <span className="text-sm text-gray-500 block mb-2">Detailed Context</span>
                                    <div className="space-y-3">
                                        {thread.customer_context.tenant && (
                                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Tenant</div>
                                                <div className="text-sm font-bold text-gray-900">{thread.customer_context.tenant.name}</div>
                                                <div className="text-xs text-gray-500">{thread.customer_context.tenant.identifier}</div>
                                            </div>
                                        )}
                                        {thread.customer_context.user && (
                                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">User Info</div>
                                                <div className="text-sm text-gray-900 truncate">{thread.customer_context.user.email}</div>
                                                {thread.customer_context.user.phone && <div className="text-sm text-gray-900">{thread.customer_context.user.phone}</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-gray-100 space-y-2">
                                {canEscalate && isOpen && escalationLevel < 3 && onEscalate && (
                                    <ModernButton variant="outline" className="w-full justify-start" onClick={onEscalate} disabled={isLoading} leftIcon={<ArrowUpCircle className="w-4 h-4" />}>Escalate Ticket</ModernButton>
                                )}
                                {canDeescalate && isOpen && escalationLevel > 0 && onDeescalate && (
                                    <ModernButton variant="outline" className="w-full justify-start" onClick={onDeescalate} disabled={isLoading} leftIcon={<ArrowDownCircle className="w-4 h-4" />}>De-escalate Ticket</ModernButton>
                                )}
                                {canResolve && isOpen && onResolve && (
                                    <ModernButton variant="primary" className="w-full justify-start bg-green-600 hover:bg-green-700 border-green-600" onClick={onResolve} disabled={isLoading} leftIcon={<CheckCircle className="w-4 h-4" />}>Resolve Ticket</ModernButton>
                                )}
                            </div>
                        </div>
                    </ModernCard>
                </div>
            </div>
        </div>
    );
};
