// @ts-nocheck
import {
  Mic,
  Plus,
  Send,
  Smile,
  X,
  Loader2,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  Shield,
  Cloud,
  Timer,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  useCreateAdminSupportMessage,
  useFetchAdminSupportMessageById,
} from "../../../hooks/adminHooks/adminSupportHooks";

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const ESCALATION_LEVELS: Record<
  number,
  { label: string; color: string; bgColor: string; icon: any; description: string }
> = {
  0: {
    label: "Client Support",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    icon: User,
    description: "Handled by tenant support team",
  },
  1: {
    label: "Tenant Admin",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    icon: Building,
    description: "Escalated to tenant administrator",
  },
  2: {
    label: "UniCloud Admin",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    icon: Shield,
    description: "Escalated to platform support",
  },
  3: {
    label: "Provider",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    icon: Cloud,
    description: "Escalated to Zadara/provider",
  },
};

const PRIORITY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  low: { color: "#6B7280", bgColor: "#F3F4F6" },
  medium: { color: "#3B82F6", bgColor: "#EFF6FF" },
  high: { color: "#F59E0B", bgColor: "#FFFBEB" },
  critical: { color: "#EF4444", bgColor: "#FEF2F2" },
};

// Utility function to format dates
const formatDate = (isoString: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// ═══════════════════════════════════════════════════════════════════
// SLA STATUS DISPLAY
// ═══════════════════════════════════════════════════════════════════

const SlaStatusDisplay: React.FC<{
  responseDue?: string;
  resolutionDue?: string;
  firstResponse?: string;
  resolvedAt?: string;
}> = ({ responseDue, resolutionDue, firstResponse, resolvedAt }) => {
  const now = new Date();

  const getSlaStatus = (dueAt?: string, metAt?: string) => {
    if (!dueAt) return { status: "none", text: "—" };
    const due = new Date(dueAt);

    if (metAt) {
      const met = new Date(metAt);
      return met <= due
        ? { status: "met", text: "Met", color: "text-green-600", bg: "bg-green-100" }
        : { status: "missed", text: "Missed", color: "text-red-600", bg: "bg-red-100" };
    }

    const diff = due.getTime() - now.getTime();
    if (diff <= 0)
      return { status: "breached", text: "Breached", color: "text-red-600", bg: "bg-red-100" };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 2)
      return {
        status: "urgent",
        text: `${hours > 0 ? `${hours}h ` : ""}${minutes}m`,
        color: "text-red-600",
        bg: "bg-red-50",
      };
    if (hours < 4)
      return {
        status: "at_risk",
        text: `${hours}h ${minutes}m`,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      };
    return {
      status: "on_track",
      text: `${hours}h ${minutes}m`,
      color: "text-green-600",
      bg: "bg-green-50",
    };
  };

  const response = getSlaStatus(responseDue, firstResponse);
  const resolution = getSlaStatus(resolutionDue, resolvedAt);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={`p-3 rounded-lg ${response.bg || "bg-gray-50"}`}>
        <div className="flex items-center gap-2 mb-1">
          <Timer size={14} className={response.color || "text-gray-500"} />
          <span className="text-xs font-medium text-gray-500">Response SLA</span>
        </div>
        <div className={`text-sm font-semibold ${response.color || "text-gray-600"}`}>
          {response.text}
        </div>
      </div>
      <div className={`p-3 rounded-lg ${resolution.bg || "bg-gray-50"}`}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} className={resolution.color || "text-gray-500"} />
          <span className="text-xs font-medium text-gray-500">Resolution SLA</span>
        </div>
        <div className={`text-sm font-semibold ${resolution.color || "text-gray-600"}`}>
          {resolution.text}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ESCALATION TIMELINE
// ═══════════════════════════════════════════════════════════════════

interface EscalationEntry {
  id: number;
  from_level: number;
  to_level: number;
  reason?: string;
  auto_escalated: boolean;
  created_at: string;
}

const EscalationTimeline: React.FC<{ escalations?: EscalationEntry[] }> = ({
  escalations = [],
}) => {
  if (escalations.length === 0) {
    return <div className="text-center py-4 text-gray-400 text-sm">No escalations yet</div>;
  }

  return (
    <div className="space-y-3">
      {escalations.map((esc, idx) => {
        const toInfo = ESCALATION_LEVELS[esc.to_level] || ESCALATION_LEVELS[0];
        const ToIcon = toInfo.icon;

        return (
          <div key={esc.id || idx} className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: toInfo.bgColor }}
            >
              <ToIcon size={14} style={{ color: toInfo.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{toInfo.label}</span>
                {esc.auto_escalated && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-600 rounded">
                    AUTO
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{esc.reason || "Escalated"}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(esc.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ESCALATE BUTTON
// ═══════════════════════════════════════════════════════════════════

const EscalateButton: React.FC<{
  currentLevel: number;
  onEscalate: (reason: string) => void;
  isLoading?: boolean;
}> = ({ currentLevel, onEscalate, isLoading }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (currentLevel >= 3) {
    return (
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <Cloud size={12} />
        Maximum escalation level
      </div>
    );
  }

  const nextLevel = ESCALATION_LEVELS[currentLevel + 1];

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onEscalate(reason);
    setIsOpen(false);
    setReason("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <ArrowUpCircle size={16} />
        Escalate to {nextLevel.label}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <textarea
            placeholder="Reason for escalation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || isLoading}
              className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? "Escalating..." : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: any;
}

const TicketDrawer: React.FC<TicketDrawerProps> = ({ isOpen, onClose, ticket }: any) => {
  const [message, setMessage] = useState("");
  const [showEscalations, setShowEscalations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: fullTicketData,
    isFetching: isTicketFetching,
    refetch: refetchTicket,
  } = useFetchAdminSupportMessageById(ticket?.id, { enabled: !!ticket?.id });

  const { mutate: createSupportReply, isPending: isReplyPending } = useCreateAdminSupportMessage();

  useEffect(() => {
    if (isOpen && ticket?.id) {
      refetchTicket();
    }
  }, [isOpen, ticket?.id, refetchTicket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [fullTicketData?.messages]);

  if (!ticket || !isOpen) return null;

  const escalationLevel = fullTicketData?.escalation_level || 0;
  const levelInfo = ESCALATION_LEVELS[escalationLevel];
  const LevelIcon = levelInfo.icon;
  const priority = fullTicketData?.priority || "medium";
  const priorityConfig = PRIORITY_CONFIG[priority];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isReplyPending) return;
    // Implementation for sending message
  };

  const handleEscalate = (reason: string) => {
    console.log("Escalating with reason:", reason);
    // TODO: Call escalation API
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[999] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 bottom-0 h-[calc(100vh-74px)] w-full max-w-lg bg-white z-[1000] transform transition-transform duration-300 ease-in-out shadow-2xl rounded-l-2xl font-Outfit flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                Ticket #{String(ticket.id).slice(-6)}
              </h2>
              <span
                className="px-2 py-0.5 text-xs font-medium rounded capitalize"
                style={{ backgroundColor: priorityConfig.bgColor, color: priorityConfig.color }}
              >
                {priority}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: levelInfo.bgColor, color: levelInfo.color }}
              >
                <LevelIcon size={10} />
                {levelInfo.label}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isTicketFetching ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !fullTicketData ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Failed to load ticket details.
          </div>
        ) : (
          <>
            {/* Ticket Info */}
            <div className="p-5 border-b border-gray-100 space-y-4">
              <h3 className="text-base font-semibold text-gray-800">{fullTicketData.subject}</h3>

              {/* SLA Status */}
              <SlaStatusDisplay
                responseDue={fullTicketData.sla_response_due_at}
                resolutionDue={fullTicketData.sla_resolution_due_at}
                firstResponse={fullTicketData.first_response_at}
                resolvedAt={fullTicketData.resolved_at}
              />

              {/* Escalation Section */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setShowEscalations(!showEscalations)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    Escalation History
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showEscalations ? "rotate-180" : ""}`}
                    />
                  </button>
                  <EscalateButton currentLevel={escalationLevel} onEscalate={handleEscalate} />
                </div>

                {showEscalations && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <EscalationTimeline escalations={fullTicketData.escalations} />
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Conversation
              </h4>

              {fullTicketData.messages?.length > 0 ? (
                fullTicketData.messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.sender_type === "user" ? "" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender_type === "user" ? "bg-blue-500" : "bg-gray-800"
                      }`}
                    >
                      <span className="text-white text-xs font-medium">
                        {msg.sender_type === "user" ? "U" : "S"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`rounded-xl p-3 ${
                          msg.sender_type === "user"
                            ? "bg-gray-100 rounded-tl-sm"
                            : "bg-blue-50 rounded-tr-sm"
                        }`}
                      >
                        <p className="text-sm text-gray-800">{msg.body}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">No messages yet</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <Plus size={18} />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={isReplyPending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isReplyPending}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isReplyPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default TicketDrawer;
