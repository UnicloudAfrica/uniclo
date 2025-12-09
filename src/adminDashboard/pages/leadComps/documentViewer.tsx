// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ExternalLink, Loader2, X } from "lucide-react";
import { useDownloadDoc } from "../../../hooks/adminHooks/leadsHook";

const inferMimeTypeFromName = (fileName: any) => {
  const lower = fileName?.toLowerCase() || "";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (/\.(png|jpe?g|gif|bmp|webp)$/i.test(lower)) return "image/*";
  if (/\.(mp4|webm|ogg)$/i.test(lower)) return "video/*";
  if (/\.(mp3|wav|ogg)$/i.test(lower)) return "audio/*";
  return null;
};

const categorizeFileType = (mimeType: any, fileName: any) => {
  const fallback = inferMimeTypeFromName(fileName);
  const type = mimeType || fallback || "";
  return {
    isPdf: type.includes("pdf"),
    isImage: type.startsWith("image") || type === "image/*",
    isVideo: type.startsWith("video") || type === "video/*",
    isAudio: type.startsWith("audio") || type === "audio/*",
  };
};

const DocumentViewerModal = ({ isOpen, onClose, document: documentData }: any) => {
  const documentId = documentData?.identifier;
  const documentName = documentData?.name || "Document Viewer";
  const [modalContainer, setModalContainer] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
    remove: removeQuery,
  } = useDownloadDoc(documentId, {
    enabled: false,
  });

  useEffect(() => {
    const el = window.document.createElement("div");
    el.id = "document-viewer-modal-portal";
    document.body.appendChild(el);
    setModalContainer(el);
    return () => {
      window.document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (isOpen && documentId) {
      refetch();
    }
  }, [isOpen, documentId, refetch]);

  useEffect(() => {
    if (data?.blob) {
      const url = URL.createObjectURL(data.blob);
      setObjectUrl(url);
      setMimeType(data.contentType?.split(";")[0] || inferMimeTypeFromName(documentData?.name));
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [data, documentData?.name]);

  useEffect(() => {
    if (!isOpen) {
      setObjectUrl(null);
      if (typeof removeQuery === "function") {
        removeQuery();
      }
    }
  }, [isOpen, removeQuery]);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !modalContainer) return null;

  const { isPdf, isImage, isVideo, isAudio } = categorizeFileType(mimeType, documentData?.name);
  const canPreview = objectUrl && (isPdf || isImage || isVideo || isAudio) && !isError;

  const handleExternalView = () => {
    if (objectUrl) {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = () => {
    if (!objectUrl) return;
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = documentName;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <span className="text-gray-700 font-medium">Loading document...</span>
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Document</h3>
          <p className="text-red-600 mb-6 text-center max-w-md">
            {error?.message || "Unable to fetch the document from the server."}
          </p>
        </div>
      );
    }

    if (canPreview) {
      if (isPdf) {
        return (
          <iframe src={objectUrl} title={documentName} className="w-full h-full border-none" />
        );
      }
      if (isImage) {
        return (
          <div className="flex justify-center items-center h-full p-4 bg-black">
            <img
              src={objectUrl}
              alt={documentName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        );
      }
      if (isVideo) {
        return (
          <div className="flex justify-center items-center h-full p-4">
            <video src={objectUrl} controls className="max-w-full max-h-full rounded-lg" />
          </div>
        );
      }
      if (isAudio) {
        return (
          <div className="flex justify-center items-center h-full p-4">
            <audio src={objectUrl} controls className="w-full" />
          </div>
        );
      }
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-700 font-semibold mb-2">Preview not available</p>
        <p className="text-gray-500 text-sm">
          This file type cannot be previewed here. Use the download button to open it locally.
        </p>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 font-Outfit">
      <div className="bg-white rounded-[24px] max-w-8xl max-h-[90vh] w-full h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#575758] truncate pr-4">{documentName}</h2>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleExternalView}
              disabled={!objectUrl}
              className="p-2 text-gray-600 hover:text-[#288DD1] transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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

        <div className="flex-1 relative bg-gray-50 overflow-hidden">
          {renderContent()}
          {objectUrl && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur rounded-full px-4 py-2 text-xs text-gray-600">
              {mimeType || "Unknown type"}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 rounded-b-[24px] flex-shrink-0">
          <div className="text-sm text-gray-600 truncate pr-4">
            File: <span className="font-medium">{documentName}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExternalView}
              disabled={!objectUrl}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-[20px] text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Open in new tab
            </button>
            <button
              onClick={handleDownload}
              disabled={!objectUrl}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-[20px] text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-white bg-[#288DD1] rounded-[20px] text-sm font-medium hover:bg-[#1976D2] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    modalContainer
  );
};

export default DocumentViewerModal;
