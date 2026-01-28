import React, { useState } from "react";
import { X } from "lucide-react";
import { Thread, SlaStatus } from "./threadTypes";
import { SharedTicketDetail } from "./SharedTicketDetail";
import adminApi, { adminSilentApi } from "../../../index/admin/api";

interface ThreadDetailModalProps {
  thread: Thread;
  slaStatus?: SlaStatus;
  onClose: () => void;
  onReply?: (payload: { message: string; files?: File[] }) => void;
  onEscalate?: () => void;
  onDeescalate?: () => void;
  onResolve?: () => void;
  canEscalate?: boolean;
  canDeescalate?: boolean;
  canResolve?: boolean;
  isLoading?: boolean;
  currentUserRole?: "admin" | "tenant" | "user" | "business";
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
  currentUserRole = "admin",
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-gray-900 truncate pr-4">{thread.subject}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          <SharedTicketDetail
            thread={thread}
            slaStatus={slaStatus}
            onBack={onClose}
            onReply={onReply}
            onEscalate={onEscalate}
            onDeescalate={onDeescalate}
            onResolve={onResolve}
            onFetchMessages={(page) => adminSilentApi("GET", `/support/${thread.uuid || thread.id}/messages?per_page=15&page=${page}`)}
            onUpdateLastRead={(messageId) => adminSilentApi("POST", `/support/${thread.uuid || thread.id}/read`, { last_read_message_id: messageId })}
            canEscalate={canEscalate}
            canDeescalate={canDeescalate}
            canResolve={canResolve}
            isLoading={isLoading}
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailModal;
