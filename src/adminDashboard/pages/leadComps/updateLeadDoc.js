import React, { useState, useEffect } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import {
  useDownloadDoc,
  useUpdateDoc,
} from "../../../hooks/adminHooks/leadsHook";

const formatStatusForDisplay = (status) => {
  return status
    ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "N/A";
};

const documentStatusOptions = [
  "approved",
  "rejected",
  "requires_update",
  //   "pending_review",
];

const UpdateLeadDoc = ({ isOpen, onClose, document, leadId }) => {
  const [status, setStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [documentUrl, setDocumentUrl] = useState(null); // State to hold the object URL
  const [documentType, setDocumentType] = useState(null); // To store document MIME type

  const { mutate, isPending: isUpdatingDoc } = useUpdateDoc();
  const {
    data: fetchedDownloadData, // Binary or base64 data
    isFetching: isDownloading,
    refetch: fetchDownloadLink,
  } = useDownloadDoc(document?.identifier, {
    enabled: false, // Prevent fetching on component mount
  });

  useEffect(() => {
    if (isOpen && document) {
      setStatus(document.status || "");
      setReviewNotes(document.review_notes || "");
      setDocumentUrl(null); // Reset document URL when modal opens
      setDocumentType(null); // Reset document type
    }
  }, [isOpen, document]);

  console.log(fetchedDownloadData);

  useEffect(() => {
    if (fetchedDownloadData) {
      let blob;
      let mimeType = "application/pdf"; // Default to PDF

      // Handle ArrayBuffer (binary data)
      if (fetchedDownloadData instanceof ArrayBuffer) {
        // Infer MIME type from Content-Type or filename
        mimeType = document?.name?.endsWith(".pdf")
          ? "application/pdf"
          : document?.name?.endsWith(".png")
          ? "image/png"
          : document?.name?.endsWith(".jpg") ||
            document?.name?.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream";
        blob = new Blob([fetchedDownloadData], { type: mimeType });
      } else {
        console.error("Unexpected data format:", typeof fetchedDownloadData);
        return;
      }

      // Create object URL for rendering
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      setDocumentType(mimeType);

      // Cleanup on unmount or when new data is fetched
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [fetchedDownloadData, document?.name]);

  const handleViewDocument = () => {
    if (document?.identifier) {
      fetchDownloadLink(); // Trigger the query to fetch the binary/base64 data
    } else {
      console.log("Document ID is not available.");
    }
  };

  const handleSubmit = () => {
    const payload = {
      lead_id: leadId,
      status: status,
      review_notes: reviewNotes || null,
    };

    mutate(
      { id: document.identifier, docData: payload },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Failed to update document:", error);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Update Document: {document?.name || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isUpdatingDoc || isDownloading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[600px] justify-start">
          {/* <div className="space-y-3 w-full mb-6 text-sm text-gray-600">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-800">
                File Name: {document?.name || "N/A"}
              </span>
            </div>

            <button
              onClick={handleViewDocument}
              disabled={isDownloading}
              className="flex items-center px-4 py-2 bg-[#288DD1] text-white rounded-full hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? "Loading..." : "View Document"}
            </button>
          </div> */}

          {/* Render the document */}
          {documentUrl && (
            <div className="w-full max-h-[400px] overflow-auto mb-6">
              {documentType === "application/pdf" ? (
                <embed
                  src={documentUrl}
                  type="application/pdf"
                  width="100%"
                  height="400px"
                />
              ) : documentType.startsWith("image/") ? (
                <img
                  src={documentUrl}
                  alt={document?.name || "Document"}
                  className="max-w-full h-auto"
                />
              ) : (
                <p className="text-red-500">
                  Unsupported file type for preview.
                </p>
              )}
            </div>
          )}

          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
              >
                <option value="" disabled>
                  Select Status
                </option>
                {documentStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatStatusForDisplay(option)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="reviewNotes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Review Notes
              </label>
              <textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows="4"
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
                placeholder="Add your review notes here..."
              ></textarea>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isUpdatingDoc || isDownloading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUpdatingDoc || isDownloading}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Save Changes
              {isUpdatingDoc && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateLeadDoc;
