import { Loader2, AlertCircle, MessageCircle } from "lucide-react";
import type { OnboardingThread } from "@/types/onboarding";

export interface ConversationThreadProps {
  threads: OnboardingThread[];
  comment: string;
  onCommentChange: (value: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
}

const ConversationThread = ({
  threads,
  comment,
  onCommentChange,
  onSendMessage,
  isSending,
}: ConversationThreadProps) => (
  <div className="border-t border-gray-100 pt-6">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <MessageCircle className="w-5 h-5 text-[--theme-color]" /> Conversation history
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      Keep everything in one place. We will notify you when reviewers respond.
    </p>

    <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
      {threads.length ? (
        threads.map((thread) => (
          <div
            key={thread.id}
            className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium">
                {thread.author?.name ?? thread.author?.type ?? "Reviewer"}
              </p>
              <span className="text-xs text-gray-400">
                {thread.created_at ? new Date(thread.created_at).toLocaleString() : ""}
              </span>
            </div>
            <p className="whitespace-pre-line text-gray-700">{thread.message}</p>
            {thread.action === "request_changes" && (
              <span className="inline-flex items-center mt-2 text-xs font-medium text-amber-600">
                <AlertCircle className="w-4 h-4 mr-1" /> Changes requested
              </span>
            )}
          </div>
        ))
      ) : (
        <div className="text-sm text-gray-500">No messages yet. Submit a note to start.</div>
      )}
    </div>

    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Leave a note for the review team
      </label>
      <textarea
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        rows={3}
        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
        placeholder="Share clarifications or let us know when you've made an update."
      />
      <div className="flex flex-col md:flex-row md:items-center gap-3 mt-3">
        <button
          type="button"
          onClick={onSendMessage}
          disabled={!comment.trim() || isSending}
          className="px-4 py-2 rounded-full bg-[--secondary-color] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
            </span>
          ) : (
            "Send message"
          )}
        </button>
        <p className="text-xs text-gray-500">
          You can also submit the step to send a final note with your update.
        </p>
      </div>
    </div>
  </div>
);

export default ConversationThread;
