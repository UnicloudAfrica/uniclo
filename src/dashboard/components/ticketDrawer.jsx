import { Mic, Plus, Send, Smile, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ToastUtils from "../../utils/toastUtil.ts"; // Assuming ToastUtils path is correct
import { useCreateSupportMessage, useFetchSupportMessageById } from "../../hooks/supportHook";

// Utility function to format dates
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const TicketDrawer = ({ isOpen, onClose, ticket }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const {
    data: fullTicketData,
    isFetching: isTicketFetching,
    refetch: refetchTicket,
  } = useFetchSupportMessageById(ticket?.id, { enabled: !!ticket?.id });

  const { mutate: createSupportReply, isPending: isReplyPending } = useCreateSupportMessage();

  useEffect(() => {
    if (isOpen && ticket?.id) {
      refetchTicket(); // Refetch ticket data when drawer opens or ticket ID changes
    }
  }, [isOpen, ticket?.id, refetchTicket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [fullTicketData?.messages]); // Scroll to bottom when messages load/update

  if (!ticket || !isOpen) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || isReplyPending) return;

    const payload = {
      ticket_id: ticket.id,
      body: message,
    };

    // createSupportReply(payload, {
    //   onSuccess: () => {
    //     ToastUtils.success("Message sent!");
    //     setMessage("");
    //     refetchTicket(); // Refetch messages to show the new one
    //   },
    //   onError: (err) => {
    //     ToastUtils.error(err.message || "Failed to send message.");
    //   },
    // });
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[999] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 bottom-0 h-[calc(100vh-74px)] w-full max-w-md bg-white z-[1000] transform transition-transform duration-300 ease-in-out shadow-2xl rounded-l-[16px] font-Outfit ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full h-full relative flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#F2F2F2] rounded-t-[16px]">
            <h2 className="text-xl font-semibold text-[#575758]">Ticket ID: {ticket.id}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isTicketFetching ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
              <p className="ml-2 text-gray-700">Loading ticket details...</p>
            </div>
          ) : !fullTicketData ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Failed to load ticket details.
            </div>
          ) : (
            <>
              <div className="mt-6 px-5">
                <h3 className="text-xl font-medium text-[#1c1c1c] mb-4">
                  {fullTicketData.subject}
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#575758] font-normal text-base">Status:</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          fullTicketData.status === "open"
                            ? "bg-[#00BF6B14] text-[#00BF6B]"
                            : "bg-[#EB417833] text-[#EB4178]"
                        }`}
                      >
                        {fullTicketData.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#575758] font-normal text-base">Date Created:</span>
                    <div className="mt-1 text-[#1c1c1c]">
                      {formatDate(fullTicketData.created_at)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#575758] font-normal text-base">Date Updated:</span>
                    <div className="mt-1 text-[#1c1c1c]">
                      {formatDate(fullTicketData.updated_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 mt-8 px-5 flex flex-col overflow-hidden">
                <div className="mb-4">
                  <h4 className="text-base font-medium text-[#1c1c1c]">Conversation</h4>
                </div>

                <div className="flex-1 overflow-y-auto w-full pt-4 space-y-4 pb-4">
                  {fullTicketData.messages && fullTicketData.messages.length > 0 ? (
                    fullTicketData.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-3 ${
                          msg.sender_type === "user" ? "" : "flex-row-reverse space-x-reverse"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.sender_type === "user" ? "bg-blue-500" : "bg-gray-800"
                          }`}
                        >
                          <span className="text-white text-sm font-medium">
                            {msg.sender_type === "user" ? "U" : "S"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div
                            className={`rounded-b-lg p-3 ${
                              msg.sender_type === "user"
                                ? "bg-[#FAFAFA] border border-[#ECEDF0] rounded-tr-lg"
                                : "bg-[#288DD10D] border-[#288DD1] rounded-tl-lg"
                            }`}
                          >
                            <p
                              className={`text-sm ${
                                msg.sender_type === "user" ? "text-[#1c1c1c]" : "text-[#288DD1]"
                              }`}
                            >
                              {msg.body}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(msg.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">
                      No messages in this conversation yet.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-6 border-t border-[#ECEDF0]">
                <div className="flex items-center space-x-3">
                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={isReplyPending}
                    />
                  </div>

                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    <Smile className="w-5 h-5" />
                  </button>

                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    disabled={!message.trim() || isReplyPending}
                  >
                    {isReplyPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TicketDrawer;
