// @ts-nocheck
import React from "react";
import { X, Send, CheckCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ModernButton } from "../ui";
import {
  Thread,
  SlaStatus,
  ESCALATION_CONFIG,
  STATUS_STYLES,
  formatThreadDate,
  getSlaStatusColor,
  getStatusClasses,
} from "./threadTypes";

interface ThreadDetailModalProps {
  thread: Thread;
  slaStatus?: SlaStatus;
  onClose: () => void;
  onReply?: (message: string) => void;
  onEscalate?: () => void;
  onDeescalate?: () => void;
  onResolve?: () => void;
  onClose?: () => void;
  canEscalate?: boolean;
  canDeescalate?: boolean;
  canResolve?: boolean;
  isLoading?: boolean;
}

export const ThreadDetailModal: React.FC<ThreadDetailModalProps> = ({
  thread,
  slaStatus,
  onClose,
  onReply,
  onEscalate,
  onDeescalate,
  onResolve,
  canEscalate = true,
  canDeescalate = false,
  canResolve = true,
  isLoading = false,
}) => {
  const [replyText, setReplyText] = React.useState("");
  const escalationConfig = ESCALATION_CONFIG[thread.escalation_level] || ESCALATION_CONFIG[0];
  const EscalationIcon = escalationConfig.icon;

  const handleReply = () => {
    if (replyText.trim() && onReply) {
      onReply(replyText);
      setReplyText("");
    }
  };

  const isOpen = thread.status !== "resolved" && thread.status !== "closed";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{thread.subject}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClasses(thread.status)}`}
              >
                {thread.status.replace("_", " ")}
              </span>
              <span className={`flex items-center gap-1 text-sm ${escalationConfig.color}`}>
                <EscalationIcon className="w-4 h-4" />
                {escalationConfig.label} Level
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SLA Status Bar */}
        {slaStatus && (
          <div className="px-4 py-2 bg-gray-50 border-b flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Response SLA:</span>{" "}
              <span className={`font-medium ${getSlaStatusColor(slaStatus.response.status)}`}>
                {slaStatus.response.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Resolution SLA:</span>{" "}
              <span className={`font-medium ${getSlaStatusColor(slaStatus.resolution.status)}`}>
                {slaStatus.resolution.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {thread.messages?.map((msg) => (
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
                <span className="font-medium text-sm">
                  {msg.user?.name || (msg.sender_type === "system" ? "System" : "Support")}
                </span>
                <span className="text-xs text-gray-500">{formatThreadDate(msg.created_at)}</span>
                {msg.is_internal && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                    Internal
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        {isOpen && onReply && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                disabled={isLoading}
              />
              <ModernButton onClick={handleReply} disabled={isLoading || !replyText.trim()}>
                <Send className="w-4 h-4" />
              </ModernButton>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <div className="flex gap-2">
            {canEscalate && isOpen && thread.escalation_level < 3 && onEscalate && (
              <ModernButton variant="outline" onClick={onEscalate} disabled={isLoading}>
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Escalate
              </ModernButton>
            )}
            {canDeescalate && isOpen && thread.escalation_level > 0 && onDeescalate && (
              <ModernButton variant="outline" onClick={onDeescalate} disabled={isLoading}>
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                De-escalate
              </ModernButton>
            )}
          </div>
          <div className="flex gap-2">
            {canResolve && isOpen && onResolve && (
              <ModernButton variant="primary" onClick={onResolve} disabled={isLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve
              </ModernButton>
            )}
            <ModernButton variant="ghost" onClick={onClose}>
              Close
            </ModernButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailModal;
