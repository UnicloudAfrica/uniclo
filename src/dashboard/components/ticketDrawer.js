import { Mic, Plus, Send, Smile, X } from "lucide-react";
import { useState, useEffect } from "react";

// Ticket Drawer Component
const TicketDrawer = ({ isOpen, onClose, ticket }) => {
  const [message, setMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Ensure component is mounted before animating
  }, []);

  if (!ticket) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[999] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 bottom-0 h-[calc(100vh-74px)] w-full max-w-md bg-white z-[1000] transform transition-transform duration-300 ease-in-out shadow-2xl rounded-l-[16px] font-Outfit ${
          isMounted && isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className=" w-full h-full relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#F2F2F2] rounded-t-[16px]">
            <h2 className="text-xl font-semibold text-[#575758]">
              Ticket ID: {ticket.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ticket Details */}
          <div className="  mt-6 px-5">
            <h3 className="text-xl font-medium text-[#1c1c1c] mb-4">
              {ticket.subject}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#575758] font-normal text-base">
                  Priority:
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.priority === "In-progress"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Low
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#575758] font-normal text-base">
                  Status:
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.priority === "In-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.priority === "In-progress"
                      ? "In-progress"
                      : "Closed"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#575758] font-normal text-base">
                  Date Created:
                </span>
                <div className="mt-1 text-[#1c1c1c]">{ticket.dateCreated}</div>
              </div>

              <div>
                <span className="text-[#575758] font-normal text-base">
                  Date Updated:
                </span>
                <div className="mt-1 text-[#1c1c1c]">{ticket.dateUpdated}</div>
              </div>
            </div>
          </div>

          {/* Conversation Section */}
          <div className="flex-1 mt-8 px-5 flex flex-col">
            <div className=" ">
              <h4 className="text-base font-medium text-[#1c1c1c]">
                Conversation
              </h4>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto w-full pt-4 space-y-4">
              {/* User Avatar and Message */}
              <div className="flex items-start space-x-3 ">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
                <div className="flex-1">
                  <div className="bg-[#FAFAFA] border border-[#ECEDF0] rounded-b-lg rounded-tr-lg p-3">
                    <p className="text-sm text-[#1c1c1c]">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Phasellus vel justo eu metus ultricies porttitor.
                      Suspendisse non ligula vitae sem sollicitudin tincidunt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Response */}
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <div className="bg-[#288DD10D]  border-[#288DD1]  rounded-b-lg rounded-tl-lg p-3 -1.5">
                    <p className="text-sm text-[#288DD1]">
                      Hey Olivia, can you please be specific on how we can help
                      you?
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">S</span>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-[#ECEDF0] absolute bottom-0 right-0 ">
              <div className="flex items-center space-x-3">
                <button className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <button className="text-gray-400 hover:text-gray-600">
                  <Smile className="w-5 h-5" />
                </button>

                <button className="text-gray-400 hover:text-gray-600">
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!message.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketDrawer;
