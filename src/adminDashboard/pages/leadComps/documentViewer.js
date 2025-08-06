"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Loader2, X, AlertTriangle } from "lucide-react";

const DocumentViewerModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  const [modalContainer, setModalContainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localPdfUrl, setLocalPdfUrl] = useState(null);

  const getFileType = (url) => {
    if (!url) return null;
    const extension = url.split(".").pop()?.toLowerCase();
    return extension;
  };

  const fileType = getFileType(fileUrl);
  const isImage = ["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(
    fileType
  );
  const isPdf = fileType === "pdf";
  const isVideo = ["mp4", "webm", "ogg"].includes(fileType);
  const isAudio = ["mp3", "wav", "ogg"].includes(fileType);
  const isDocxLike = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(
    fileType
  );

  useEffect(() => {
    if (!isOpen) return;

    const initializeViewer = async () => {
      setIsLoading(true);
      setError(null);
      setLocalPdfUrl(null);

      if (isPdf && fileUrl) {
        try {
          const response = await fetch(fileUrl, { mode: "cors" });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setLocalPdfUrl(url);
        } catch (e) {
          console.error("Failed to fetch PDF:", e);
          setError("Failed to load the PDF document.");
        } finally {
          setIsLoading(false);
        }
      } else if (isImage || isVideo || isAudio || isDocxLike) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
        if (fileUrl) {
          setError(
            `Preview not available for this file type (${
              fileType?.toUpperCase() || "Unknown"
            }).`
          );
        } else {
          setError("No file URL provided.");
        }
      }
    };

    initializeViewer();

    return () => {
      if (localPdfUrl) {
        URL.revokeObjectURL(localPdfUrl);
      }
    };
  }, [isOpen, fileUrl]);

  useEffect(() => {
    const el = document.createElement("div");
    el.id = "document-viewer-modal-portal";
    document.body.appendChild(el);
    setModalContainer(el);

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleError = () => {
    setError(
      "Failed to load the document. It might be unsupported or corrupted."
    );
    setIsLoading(false);
  };

  const handleExternalView = () => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const renderContent = () => {
    if (isPdf && localPdfUrl) {
      return (
        <iframe
          src={localPdfUrl}
          title={fileName || "PDF Document"}
          className="w-full h-full border-none"
        />
      );
    } else if (isImage) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <img
            src={fileUrl}
            alt={fileName || "Image"}
            className="max-w-full max-h-full object-contain rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={handleError}
          />
        </div>
      );
    } else if (isVideo) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-full rounded-lg"
            onLoadedData={() => setIsLoading(false)}
            onError={handleError}
          />
        </div>
      );
    } else if (isAudio) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <audio
            src={fileUrl}
            controls
            className="w-full"
            onLoadedData={() => setIsLoading(false)}
            onError={handleError}
          />
        </div>
      );
    } else if (isDocxLike) {
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(
            fileUrl
          )}&embedded=true`}
          title={fileName || "Document Viewer"}
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          onError={handleError}
        />
      );
    } else {
      return null;
    }
  };

  if (!isOpen || !modalContainer) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 font-Outfit">
      <div className="bg-white rounded-[24px] max-w-6xl max-h-[90vh] w-full h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#575758] truncate pr-4">
            {fileName || "Document Viewer"}
          </h2>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleExternalView}
              className="p-2 text-gray-600 hover:text-[#288DD1] transition-colors rounded-lg hover:bg-gray-100"
              title="Open in New Tab"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-gray-50 overflow-hidden">
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
                <span className="text-gray-700 font-medium">
                  Loading document...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8">
              <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Failed to Load Document
              </h3>
              <p className="text-red-600 mb-6 text-center max-w-md">{error}</p>
              <button
                onClick={handleExternalView}
                className="flex items-center justify-center px-6 py-3 bg-[#288DD1] text-white rounded-full font-medium hover:bg-[#1976D2] transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Try Opening in New Tab
              </button>
            </div>
          )}

          <div className="w-full h-full overflow-auto">
            {!error && renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 rounded-b-[24px] flex-shrink-0">
          <div className="text-sm text-gray-600">
            {fileName && (
              <span className="truncate">
                File: <span className="font-medium">{fileName}</span>
                {fileType && (
                  <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs font-mono">
                    {fileType.toUpperCase()}
                  </span>
                )}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-[20px] text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    modalContainer
  );
};

export default DocumentViewerModal;
